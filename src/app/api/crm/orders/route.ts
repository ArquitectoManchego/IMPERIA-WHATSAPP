import { NextResponse } from 'next/server';
import { database, crmPath } from '@/lib/admin-db';
export async function GET() {
  try {
    const contacts = await database().collection(`${crmPath}/contacts`).get();
    const result: any[] = [];
    for (const contact of contacts.docs) { const orders = await contact.ref.collection('orders').get(); result.push(...orders.docs.map(d => ({ ...d.data(), id:d.id, client:contact.data().nombre, phone:contact.data().telefono }))); }
    return NextResponse.json(result);
  } catch (error: any) { return NextResponse.json({error:error.message},{status:503}); }
}
