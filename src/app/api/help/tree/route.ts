import { NextResponse } from 'next/server';
import { getHelpTree, getHelpCategories } from '@/lib/help-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [tree, categories] = await Promise.all([
      getHelpTree(),
      getHelpCategories()
    ]);
    return NextResponse.json({ success: true, tree, categories });
  } catch (error: any) {
    console.error('Error fetching help tree:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener árbol de ayuda' },
      { status: 500 }
    );
  }
}
