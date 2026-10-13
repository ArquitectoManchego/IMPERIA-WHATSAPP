import { downloadMedia } from '@/lib/whatsapp';
import { NextResponse } from 'next/server';
export async function GET(req: Request) {
  try { const id = new URL(req.url).searchParams.get('id'); if (!id) return new Response(null, { status: 400 });
    const media = await downloadMedia(id);
    return new Response(Buffer.from(media.data, 'base64'), { headers: { 'Content-Type': media.mimetype || 'application/octet-stream', 'Content-Disposition': 'attachment; filename="adjunto"', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'El adjunto ya no está disponible en WhatsApp' }, { status: 404 }); }
}
