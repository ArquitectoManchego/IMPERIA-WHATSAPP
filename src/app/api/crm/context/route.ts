import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { contactContext, patchContact } from '@/lib/crm-store';
export async function GET(req: Request) {
  try { return NextResponse.json(await contactContext(new URL(req.url).searchParams.get('phone') || '')); }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }); }
}
export async function PATCH(req: Request) {
  try { const session = await getServerSession(authOptions); if (!session) return new Response(null,{status:401});
    const data = await req.json(); await patchContact(data.phone, data, session.user?.email || 'Operador'); return NextResponse.json(await contactContext(data.phone));
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }); }
}
