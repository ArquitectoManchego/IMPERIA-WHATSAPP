import { NextRequest, NextResponse } from 'next/server';
import { searchHelpArticles } from '@/lib/help-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') || '';
    const results = await searchHelpArticles(q);
    return NextResponse.json({ success: true, query: q, results });
  } catch (error: any) {
    console.error('Error searching help:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error en la búsqueda de ayuda' },
      { status: 500 }
    );
  }
}
