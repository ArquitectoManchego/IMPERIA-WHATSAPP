import { NextResponse } from 'next/server';
import { initializeWhatsApp, getWhatsAppStatus } from '@/lib/whatsapp';
export async function GET() { return NextResponse.json(await getWhatsAppStatus()); }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    await initializeWhatsApp(body.restart === true);
    return NextResponse.json(await getWhatsAppStatus());
  } catch (error: any) {
    const fallback = await getWhatsAppStatus();
    if (fallback.mode === 'remote') {
      return NextResponse.json(fallback);
    }
    return NextResponse.json({ ...fallback, error: error.message }, { status: 503 });
  }
}
