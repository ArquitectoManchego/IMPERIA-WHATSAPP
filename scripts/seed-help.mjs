import { seedHelpToFirestore } from '../src/lib/help-store.ts';

async function main() {
  console.log('🌱 Sembrando contenido del Centro de Ayuda en Firestore...');
  try {
    const res = await seedHelpToFirestore();
    console.log(`✅ ¡Sembrado exitoso!`);
    console.log(`   - Categorías: ${res.categories}`);
    console.log(`   - Artículos: ${res.articles}`);
  } catch (err) {
    console.error('❌ Error sembrando en Firestore:', err);
    process.exit(1);
  }
}

main();
