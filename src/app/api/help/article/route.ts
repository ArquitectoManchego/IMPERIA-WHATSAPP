import { NextRequest, NextResponse } from 'next/server';
import { getHelpArticleBySlug } from '@/lib/help-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug') || '';
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug requerido' }, { status: 400 });
    }
    const article = await getHelpArticleBySlug(slug);
    if (!article) {
      return NextResponse.json({ success: false, error: 'Artículo no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, article });
  } catch (error: any) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener artículo' },
      { status: 500 }
    );
  }
}
