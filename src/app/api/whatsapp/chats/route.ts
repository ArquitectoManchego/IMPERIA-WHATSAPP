import { NextResponse } from 'next/server';
import { getRecentChats } from '@/lib/whatsapp';

export async function GET() {
  try {
    const chats = await getRecentChats(20);
    return NextResponse.json(chats);
  } catch (error: any) {
    console.error('Error fetching recent chats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
