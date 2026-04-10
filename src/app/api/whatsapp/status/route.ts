import { NextResponse } from 'next/server';
import { initializeWhatsApp, getWhatsAppStatus } from '@/lib/whatsapp';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restart = searchParams.get('restart') === 'true';

  try {
    // Attempt initialization (or force restart if requested)
    await initializeWhatsApp(restart);
    
    const status = getWhatsAppStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('API Error in WhatsApp status', error);
    return NextResponse.json({ error: 'Failed to manage WhatsApp connection' }, { status: 500 });
  }
}
