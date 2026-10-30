import { database, crmPath } from '@/lib/admin-db';
import type { HelpCategory, HelpArticle, HelpTreeItem } from './help-types.ts';
import { INITIAL_HELP_CATEGORIES, INITIAL_HELP_ARTICLES } from '@/lib/help-content-seed';

const CATEGORIES_COL = `${crmPath}/help_categories`;
const ARTICLES_COL = `${crmPath}/help_articles`;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Seeds all categories and articles into Firestore.
 */
export async function seedHelpToFirestore(): Promise<{ categories: number; articles: number }> {
  const db = database();
  const batch = db.batch();

  for (const cat of INITIAL_HELP_CATEGORIES) {
    const docRef = db.collection(CATEGORIES_COL).doc(cat.id);
    batch.set(docRef, cat, { merge: true });
  }

  for (const art of INITIAL_HELP_ARTICLES) {
    const docRef = db.collection(ARTICLES_COL).doc(art.id);
    batch.set(docRef, art, { merge: true });
  }

  await batch.commit();
  return {
    categories: INITIAL_HELP_CATEGORIES.length,
    articles: INITIAL_HELP_ARTICLES.length,
  };
}

/**
 * Retrieves all help categories from Firestore, seeding if empty.
 */
export async function getHelpCategories(): Promise<HelpCategory[]> {
  try {
    const db = database();
    const snap = await db.collection(CATEGORIES_COL).orderBy('order', 'asc').get();

    if (snap.empty) {
      // Auto-seed to Firestore if collection does not exist yet
      await seedHelpToFirestore();
      return INITIAL_HELP_CATEGORIES;
    }

    const categories: HelpCategory[] = [];
    snap.forEach((doc) => {
      categories.push(doc.data() as HelpCategory);
    });
    return categories.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.warn('[HelpStore] Falling back to initial categories due to error:', error);
    return INITIAL_HELP_CATEGORIES;
  }
}

/**
 * Retrieves all help articles from Firestore, seeding if empty.
 */
export async function getHelpArticles(): Promise<HelpArticle[]> {
  try {
    const db = database();
    const snap = await db.collection(ARTICLES_COL).orderBy('order', 'asc').get();

    if (snap.empty) {
      await seedHelpToFirestore();
      return INITIAL_HELP_ARTICLES;
    }

    const articles: HelpArticle[] = [];
    snap.forEach((doc) => {
      articles.push(doc.data() as HelpArticle);
    });
    return articles.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.warn('[HelpStore] Falling back to initial articles due to error:', error);
    return INITIAL_HELP_ARTICLES;
  }
}

/**
 * Retrieves a single help article by its slug.
 */
export async function getHelpArticleBySlug(slug: string): Promise<HelpArticle | null> {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, '');
  try {
    const db = database();
    const snap = await db.collection(ARTICLES_COL).where('slug', '==', normalizedSlug).limit(1).get();

    if (!snap.empty) {
      return snap.docs[0].data() as HelpArticle;
    }

    // Try finding by id as well
    const byIdSnap = await db.collection(ARTICLES_COL).doc(normalizedSlug).get();
    if (byIdSnap.exists) {
      return byIdSnap.data() as HelpArticle;
    }
  } catch (err) {
    console.warn('[HelpStore] Error querying Firestore by slug, falling back to seed:', err);
  }

  // Fallback to in-memory initial list
  const found = INITIAL_HELP_ARTICLES.find(
    (a) => a.slug === normalizedSlug || a.id === normalizedSlug
  );
  return found || null;
}

/**
 * Builds the complete hierarchical navigation tree: Category -> Subcategory -> Articles.
 */
export async function getHelpTree(): Promise<HelpTreeItem[]> {
  const [categories, articles] = await Promise.all([
    getHelpCategories(),
    getHelpArticles(),
  ]);

  return categories.map((category) => {
    const subcats = (category.subcategories || []).map((subcat) => {
      const subArticles = articles.filter(
        (art) => art.categoryId === category.id && art.subcategoryId === subcat.id
      );
      return {
        subcategory: subcat,
        articles: subArticles,
      };
    });

    const directArticles = articles.filter(
      (art) => art.categoryId === category.id && !art.subcategoryId
    );

    return {
      category,
      subcategories: subcats,
      directArticles,
    };
  });
}

/**
 * Full-text search across all help articles.
 */
export async function searchHelpArticles(query: string): Promise<Array<HelpArticle & { score: number }>> {
  if (!query || query.trim().length === 0) return [];
  const q = normalizeText(query.trim());
  const words = q.split(/\s+/).filter(Boolean);

  const articles = await getHelpArticles();
  const results: Array<HelpArticle & { score: number }> = [];

  for (const article of articles) {
    let score = 0;
    const titleNorm = normalizeText(article.title);
    const summaryNorm = normalizeText(article.summary);
    const keywordsNorm = (article.keywords || []).map(normalizeText);

    // Block content preview
    const blockContentNorm = normalizeText(
      article.blocks
        .map((b) => {
          if (b.type === 'paragraph') return b.text;
          if (b.type === 'callout') return `${b.title || ''} ${b.text}`;
          if (b.type === 'steps') return b.items.map((i) => `${i.title} ${i.description}`).join(' ');
          if (b.type === 'faq') return b.items.map((f) => `${f.question} ${f.answer}`).join(' ');
          return '';
        })
        .join(' ')
    );

    for (const w of words) {
      if (titleNorm.includes(w)) score += 10;
      if (summaryNorm.includes(w)) score += 5;
      if (keywordsNorm.some((k) => k.includes(w))) score += 7;
      if (blockContentNorm.includes(w)) score += 2;
    }

    if (score > 0) {
      results.push({ ...article, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Saves or updates an article in Firestore.
 */
export async function saveHelpArticle(article: HelpArticle): Promise<void> {
  const db = database();
  await db.collection(ARTICLES_COL).doc(article.id).set(
    {
      ...article,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Saves or updates a category in Firestore.
 */
export async function saveHelpCategory(category: HelpCategory): Promise<void> {
  const db = database();
  await db.collection(CATEGORIES_COL).doc(category.id).set(category, { merge: true });
}
