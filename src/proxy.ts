import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith('/api/auth/') || path === '/api/webhooks/openwa' || path === '/api/internal/worker' || path === '/api/whatsapp/logs') return NextResponse.next();
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const allowed = (process.env.CRM_ALLOWED_EMAILS || '').split(',').map(x => x.trim().toLowerCase());
  if (!token?.email || !allowed.includes(token.email.toLowerCase())) return NextResponse.json({ error: 'Inicia sesión con una cuenta autorizada' }, { status: 401 });
  if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
    const origin = req.headers.get('origin');
    const expected = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).origin : req.nextUrl.origin;
    if (!origin || origin !== expected) return NextResponse.json({ error: 'Origen no autorizado' }, { status: 403 });
  }
  return NextResponse.next();
}
export const config = { matcher: ['/api/:path*'] };
