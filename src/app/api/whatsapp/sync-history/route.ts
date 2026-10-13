import { NextResponse } from 'next/server';
import { syncRecentHistory, getSyncStatus, getAllSyncedData } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    let months = 2;
    let minMessages = 50;

    try {
      const body = await req.json();
      if (body.months) months = Number(body.months);
      if (body.minMessages) minMessages = Number(body.minMessages);
    } catch {
      // Use defaults if empty body
    }

    const result = await syncRecentHistory(months, minMessages);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in sync-history POST:', error);
    return NextResponse.json({ error: error.message || 'Error en sincronización' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isExport = searchParams.get('export') === 'true';

  if (isExport) {
    const data = getAllSyncedData();
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="whatsapp-history-${new Date().toISOString().slice(0, 10)}.json"`
      }
    });
  }

  const status = getSyncStatus();
  return NextResponse.json(status);
}
