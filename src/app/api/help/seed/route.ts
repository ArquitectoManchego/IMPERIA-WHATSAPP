import { NextResponse } from 'next/server';
import { seedHelpToFirestore } from '@/lib/help-store';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await seedHelpToFirestore();
    return NextResponse.json({
      success: true,
      message: `Sembrado exitoso en Firestore: ${result.categories} categorías y ${result.articles} artículos.`,
      result
    });
  } catch (error: any) {
    console.error('Error seeding help to Firestore:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al sembrar ayuda en Firestore' },
      { status: 500 }
    );
  }
}
