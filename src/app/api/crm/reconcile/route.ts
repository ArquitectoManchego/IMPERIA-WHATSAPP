import { NextResponse } from 'next/server';
import { runWorker } from '@/lib/crm-worker';
export async function POST() {
  try { return NextResponse.json(await runWorker()); }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 503 }); }
}
