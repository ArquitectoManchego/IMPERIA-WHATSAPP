import { NextResponse } from 'next/server';
import { sendMessage } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const { chatId, phone, message, mediaBase64 } = await req.json();
    let primaryId = chatId;
    if (!primaryId || (!primaryId.includes('@') && /[a-zA-Z]/.test(primaryId))) {
      primaryId = phone || chatId;
    }

    if (!primaryId || (!message && !mediaBase64)) {
      return NextResponse.json({ error: 'Chat ID/Phone and (message or media) are required' }, { status: 400 });
    }

    const result = await sendMessage(primaryId, message || '', mediaBase64, phone);
    
    return NextResponse.json({ 
      success: true, 
      messageId: result?.id?.id || result?.id || 'sent'
    });
  } catch (error: any) {
    console.error('Error in API /api/whatsapp/send:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to send message' 
    }, { status: 500 });
  }
}
