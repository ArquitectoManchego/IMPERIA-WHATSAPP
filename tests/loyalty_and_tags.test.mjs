import test from 'node:test';
import assert from 'node:assert/strict';
import { extractInstitutionalTags } from '../src/lib/crm-domain.ts';
import { getCustomerLoyalty, REWARDS_CATALOG, TIER_CONFIG } from '../src/lib/loyalty-store.ts';

test('extractInstitutionalTags correctly identifies institutions and faculties', () => {
  // UV & ENFRA
  const uvEnfraRow = {
    grupo_graduacion: 'UV',
    notas_extra: '',
    articulos: [{ descripcion: 'FIL COM UV ENFRA DAM' }]
  };
  const tags1 = extractInstitutionalTags(uvEnfraRow);
  assert.ok(tags1.includes('Universidad Veracruzana'));
  assert.ok(tags1.includes('Facultad de Enfermería'));

  // Nutricion
  const nutRow = {
    notas_extra: 'Bordado Flor Lis FAC NUTRICION'
  };
  const tags2 = extractInstitutionalTags(nutRow);
  assert.ok(tags2.includes('Facultad de Nutrición'));

  // Universidad de Oriente
  const uoRow = {
    grupo_graduacion: 'UNIVERSIDAD DE ORIENTE MARIA PAULA'
  };
  const tags3 = extractInstitutionalTags(uoRow);
  assert.ok(tags3.includes('Universidad de Oriente'));

  // Amparo del Castillo
  const ampRow = {
    grupo_graduacion: 'Amparo del Castillo Elizabeth Sanchez'
  };
  const tags4 = extractInstitutionalTags(ampRow);
  assert.ok(tags4.includes('Amparo del Castillo'));

  // CETUG
  const cetugRow = {
    grupo_graduacion: 'CETUG Esmeralda Garcia'
  };
  const tags5 = extractInstitutionalTags(cetugRow);
  assert.ok(tags5.includes('CETUG'));
});

test('Stackable multi-tag filter applies strict AND logic', () => {
  const clientA = { name: 'Cliente A', tags: ['Universidad Veracruzana', 'Facultad de Enfermería'] };
  const clientB = { name: 'Cliente B', tags: ['Universidad Veracruzana', 'Facultad de Nutrición'] };
  const clientC = { name: 'Cliente C', tags: ['Amparo del Castillo'] };

  const allClients = [clientA, clientB, clientC];

  const filter = (selected) => {
    return allClients.filter(c => {
      const cTags = (c.tags || []).map(t => t.toLowerCase());
      return selected.length === 0 || selected.every(st => cTags.includes(st.toLowerCase()));
    });
  };

  // Single tag: Universidad Veracruzana -> clientA & clientB
  const uvOnly = filter(['Universidad Veracruzana']);
  assert.equal(uvOnly.length, 2);
  assert.ok(uvOnly.some(c => c.name === 'Cliente A'));
  assert.ok(uvOnly.some(c => c.name === 'Cliente B'));

  // Stacked tags: UV AND Enfermería -> clientA ONLY
  const uvEnfra = filter(['Universidad Veracruzana', 'Facultad de Enfermería']);
  assert.equal(uvEnfra.length, 1);
  assert.equal(uvEnfra[0].name, 'Cliente A');

  // Stacked tags: UV AND Amparo -> NONE
  const uvAmp = filter(['Universidad Veracruzana', 'Amparo del Castillo']);
  assert.equal(uvAmp.length, 0);
});

test('getCustomerLoyalty computes card, points, rewards and event-by-event reviews', () => {
  const phone = '+52 229 123 4567';
  const orders = [
    { total: 5000, folio: '1001' },
    { total: 8000, folio: '1002' }
  ];

  const profile = getCustomerLoyalty(phone, 'Dra. Laura Jimenez', orders);

  // 1. Frequent client card
  assert.equal(profile.hasCard, true);
  assert.ok(profile.cardNumber.startsWith('IMP-'));
  assert.ok(['bronze', 'silver', 'gold', 'platinum'].includes(profile.tier));
  assert.ok(profile.tierName);

  // 2. Points balance derived from purchases ($13000 / 10 = 1300 pts + survey points)
  assert.ok(profile.currentPoints >= 1300);
  assert.ok(profile.lifetimePoints >= profile.currentPoints);

  // 3. Available rewards
  assert.ok(profile.availableRewards.length > 0);
  const bordado = profile.availableRewards.find(r => r.id === 'rwd_bordado_nombre');
  assert.ok(bordado);
  assert.equal(bordado.isAvailable, true);
  assert.ok(bordado.code);

  // 4. Reputation & Google Reviews
  assert.equal(profile.hasGoodReviews, true);
  assert.equal(profile.googleRating, 5);
  assert.equal(profile.ratedOnGoogle, true);

  // 5. Survey feedbacks history by event
  assert.ok(profile.feedbacks.length > 0);
  profile.feedbacks.forEach(event => {
    assert.ok(event.rating >= 4);
    assert.ok(event.date);
    assert.ok(event.branchName);
    assert.ok(Array.isArray(event.positiveAspects));
    assert.ok(Array.isArray(event.negativeAspects));
    assert.equal(event.ratedOnGoogle, true);
  });
});
