import { NextResponse } from 'next/server';
import { sendMessage } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const { chatId, phone, message, mediaBase64 } = await req.json();
    const finalId = chatId || phone;

    if (!finalId || (!message && !mediaBase64)) {
      return NextResponse.json({ error: 'Chat ID/Phone and (message or media) are required' }, { status: 400 });
    }

    const result = await sendMessage(finalId, message || '', mediaBase64);
    
    return NextResponse.json({ 
      success: true, 
      messageId: result.id.id 
    });
  } catch (error: any) {
    console.error('Error in API /api/whatsapp/send:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to send message' 
    }, { status: 500 });
  }
}
