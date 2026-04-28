import { NextResponse } from 'next/server';

export async function GET() {
  const globalForWhatsApp = globalThis as unknown as {
    systemLogs: string[];
  };

  return NextResponse.json(globalForWhatsApp.systemLogs || []);
}

export async function DELETE() {
  const globalForWhatsApp = globalThis as unknown as {
    systemLogs: string[];
  };
  globalForWhatsApp.systemLogs = [];
  return NextResponse.json({ success: true });
}
