import { NextResponse } from 'next/server';
import { listQuickReplies, saveQuickReply, deleteQuickReply } from '@/lib/crm-store';

export async function GET() {
  try {
    const replies = await listQuickReplies();
    return NextResponse.json(replies);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Título y contenido requeridos' }, { status: 400 });
    }
    const saved = await saveQuickReply(body);
    return NextResponse.json({ success: true, quickReply: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
    await deleteQuickReply(id);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
