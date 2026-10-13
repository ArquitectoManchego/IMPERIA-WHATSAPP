import { NextResponse } from 'next/server';
import { workerAuthorized, runWorker, processOutbox } from '@/lib/crm-worker';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  if (!workerAuthorized(req.headers.get('authorization'))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  try {
    if (type === 'outbox') {
      return NextResponse.json(await processOutbox());
    }
    return NextResponse.json(await runWorker());
  }
  catch (error: any) { console.error('CRM worker failed',error); return NextResponse.json({ error: error.message }, { status: 503 }); }
}
