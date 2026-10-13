import { NextResponse } from 'next/server';
import {
  listScheduledItems,
  addScheduledItem,
  updateScheduledItem,
  deleteScheduledItem,
} from '@/lib/crm-store';

export async function GET() {
  try {
    const items = await listScheduledItems();
    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'cancel') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
      const updated = await updateScheduledItem(id, { status: 'cancelled' });
      return NextResponse.json({ success: true, item: updated });
    }

    if (!body.contactId || !body.phone || !body.content || !body.scheduledFor) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const created = await addScheduledItem({
      contactId: body.contactId,
      phone: body.phone,
      contactName: body.contactName,
      type: body.type === 'internal_reminder' ? 'internal_reminder' : 'whatsapp_message',
      title: body.title,
      content: body.content,
      scheduledFor: body.scheduledFor,
      recurrence: body.recurrence || 'none',
    });

    return NextResponse.json({ success: true, item: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
    await deleteScheduledItem(id);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
