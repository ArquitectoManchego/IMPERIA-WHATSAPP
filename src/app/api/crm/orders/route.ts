import { NextResponse } from 'next/server';
import { database, crmPath } from '@/lib/admin-db';
import { orderView } from '@/lib/crm-domain';
import path from 'path';
import fs from 'fs';

function getLocalFallbackOrders() {
  try {
    const rawPath = path.resolve(process.cwd(), 'src/data/clients_raw.json');
    if (!fs.existsSync(rawPath)) return [];
    const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    const orders: any[] = [];
    for (const row of raw) {
      if (row.nota_id || (row.articulos && row.articulos.length > 0)) {
        const view = orderView(row);
        orders.push({
          ...view,
          id: row.id,
          client: row.nombre || 'Cliente sin nombre',
          phone: row.telefono || ''
        });
      }
    }
    return orders;
  } catch (e) {
    return [];
  }
}

let cachedOrders: any[] | null = null;
let lastOrdersCacheTime = 0;

export async function GET() {
  const now = Date.now();
  if (cachedOrders && (now - lastOrdersCacheTime) < 30000) {
    return NextResponse.json(cachedOrders);
  }

  let result: any[] = [];
  try {
    // Attempt single collectionGroup read to prevent N+1 queries
    const snapshot = await database().collectionGroup('orders').limit(500).get();
    if (!snapshot.empty) {
      result = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    }
  } catch (error: any) {
    console.warn('Firestore orders collectionGroup read failed (falling back to local snapshot):', error.message);
  }

  // Fallback to local dataset if Firestore query was empty or threw RESOURCE_EXHAUSTED
  if (result.length === 0) {
    result = getLocalFallbackOrders();
  }

  cachedOrders = result;
  lastOrdersCacheTime = now;
  return NextResponse.json(result);
}
