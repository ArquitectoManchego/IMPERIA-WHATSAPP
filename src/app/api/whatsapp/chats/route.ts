import { NextResponse } from 'next/server';
import { getRecentChats } from '@/lib/whatsapp';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '200');
    const chats = await getRecentChats(limit);
    return NextResponse.json(chats);
  } catch (error: any) {
    console.error('Error fetching recent chats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
