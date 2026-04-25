import { NextResponse } from 'next/server';
import { getChatMessages } from '@/lib/whatsapp';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chatId') || searchParams.get('phone');
  const limit = parseInt(searchParams.get('limit') || '100');
  const days = parseInt(searchParams.get('days') || '2');

  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID or Phone is required' }, { status: 400 });
  }

  try {
    const messages = await getChatMessages(chatId, days, limit);
    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
