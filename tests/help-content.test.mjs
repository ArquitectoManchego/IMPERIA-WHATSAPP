import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_HELP_CATEGORIES, INITIAL_HELP_ARTICLES } from '../src/lib/help-content-seed.ts';
import { SHOT_METADATA_REGISTRY } from '../src/lib/help-shots-registry.ts';

test('Help Center: categories integrity and unique ids', () => {
  const ids = new Set();
  for (const cat of INITIAL_HELP_CATEGORIES) {
    assert.ok(cat.id, 'Category must have an id');
    assert.ok(!ids.has(cat.id), `Category id ${cat.id} must be unique`);
    ids.add(cat.id);
    assert.ok(cat.title, `Category ${cat.id} must have a title`);
    assert.ok(cat.icon, `Category ${cat.id} must have an icon`);
    assert.ok(cat.order > 0, `Category ${cat.id} must have a positive order`);
  }
});

test('Help Center: articles integrity and category references', () => {
  const categoryIds = new Set(INITIAL_HELP_CATEGORIES.map((c) => c.id));
  const articleSlugs = new Set();
  const articleIds = new Set();

  for (const art of INITIAL_HELP_ARTICLES) {
    assert.ok(art.id, 'Article must have an id');
    assert.ok(!articleIds.has(art.id), `Article id ${art.id} must be unique`);
    articleIds.add(art.id);

    assert.ok(art.slug, `Article ${art.id} must have a slug`);
    assert.ok(!articleSlugs.has(art.slug), `Article slug ${art.slug} must be unique`);
    articleSlugs.add(art.slug);

    assert.ok(
      categoryIds.has(art.categoryId),
      `Article ${art.id} references non-existent category ${art.categoryId}`
    );

    const category = INITIAL_HELP_CATEGORIES.find((c) => c.id === art.categoryId);
    if (art.subcategoryId) {
      const subcatExists = category.subcategories?.some((s) => s.id === art.subcategoryId);
      assert.ok(
        subcatExists,
        `Article ${art.id} references non-existent subcategory ${art.subcategoryId} in ${art.categoryId}`
      );
    }

    assert.ok(art.blocks.length > 0, `Article ${art.id} must have at least one content block`);
  }
});

test('Help Center: shot references match SHOT_METADATA_REGISTRY', () => {
  for (const art of INITIAL_HELP_ARTICLES) {
    for (const block of art.blocks) {
      if (block.type === 'screenshot') {
        const shot = SHOT_METADATA_REGISTRY[block.shotId];
        assert.ok(
          shot || block.shotId.startsWith('/'),
          `Article ${art.id} references missing shotId ${block.shotId}`
        );

        if (shot && block.focusId) {
          assert.ok(
            shot.elements[block.focusId],
            `Article ${art.id} references missing focusId ${block.focusId} on shot ${block.shotId}`
          );
        }
      }
    }
  }
});

test('Help Center: search normalizer logic handles accents and case', () => {
  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  assert.equal(normalizeText('Agendación'), 'agendacion');
  assert.equal(normalizeText('CAMPAÑAS'), 'campanas');
  assert.equal(normalizeText('VÍDEO'), 'video');
});
