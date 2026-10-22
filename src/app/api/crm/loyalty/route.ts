import { NextResponse } from 'next/server';
import { getCustomerLoyalty } from '@/lib/loyalty-store';
import { contactContext } from '@/lib/crm-store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    if (!phone) {
      return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 });
    }

    let orders: any[] = [];
    let contactName: string | undefined = undefined;

    try {
      const ctx = await contactContext(phone);
      orders = ctx.orders || [];
      contactName = ctx.contact?.nombre;
    } catch (_) {}

    const loyaltyProfile = getCustomerLoyalty(phone, contactName, orders);
    return NextResponse.json(loyaltyProfile);
  } catch (error: any) {
    console.error('Error fetching customer loyalty:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
