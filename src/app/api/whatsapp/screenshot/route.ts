import { NextResponse } from 'next/server';
import { getScreenshot } from '@/lib/whatsapp';

export async function GET() {
  try {
    const screenshot = await getScreenshot();
    return NextResponse.json({ screenshot });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
