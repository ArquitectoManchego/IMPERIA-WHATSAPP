import { NextResponse } from 'next/server';
import { getWhatsAppClient, getWhatsAppStatus } from '@/lib/whatsapp';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
  }

  const client = getWhatsAppClient();
  const status = getWhatsAppStatus();

  if (!client || !status.isReady) {
    return NextResponse.json({ error: 'WhatsApp client not ready' }, { status: 503 });
  }

  try {
    const chat = await client.getChatById(chatId);
    
    // Test fetchMessages
    const fetchLimit = 50;
    const messages = await chat.fetchMessages({ limit: fetchLimit });
    
    // Test searchMessages (Plan B)
    const searchedMessages = await client.searchMessages('', { chatId: chatId, limit: fetchLimit });

    return NextResponse.json({
      chatId: chatId,
      name: chat.name,
      isGroup: chat.isGroup,
      hasMessages: chat.messages?.length > 0,
      lastMessage: chat.lastMessage ? {
        body: chat.lastMessage.body,
        timestamp: chat.lastMessage.timestamp,
        fromMe: chat.lastMessage.fromMe
      } : null,
      fetchMessagesResult: {
        count: messages.length,
        firstMessage: messages.length > 0 ? messages[0].body : null,
        lastMessage: messages.length > 0 ? messages[messages.length - 1].body : null
      },
      searchMessagesResult: {
        count: searchedMessages.length,
        firstMessage: searchedMessages.length > 0 ? searchedMessages[0].body : null,
        lastMessage: searchedMessages.length > 0 ? searchedMessages[searchedMessages.length - 1].body : null
      },
      clientStatus: status
    });
  } catch (error: any) {
    console.error('[Debug API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
