import { database, legacyPath, crmPath } from './admin-db';
import { phoneNumber, stableId, orderView, notificationFor, sameData, PipelineStage, OpportunityDeal, QuickReply, ScheduledItem, CampaignItem, AutomationRule, DEFAULT_STAGES } from './crm-domain';
import { getMetadataState, updateMetadataState } from './crm-metadata-store';

export const contactsRef = () => database().collection(`${crmPath}/contacts`);

function withTimeout<T>(promise: Promise<T>, ms = 1500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), ms))
  ]);
}

let cachedContacts: any[] | null = null;
let lastContactsCacheTime = 0;
const CONTACTS_CACHE_TTL = 30000; // 30s in-memory cache to prevent quota exhaustion

export function invalidateContactsCache() {
  cachedContacts = null;
  lastContactsCacheTime = 0;
}

export function getLocalFallbackContacts(): any[] {
  try {
    const fs = require('fs');
    const path = require('path');
    const rawPath = path.resolve(process.cwd(), 'src/data/clients_raw.json');
    if (!fs.existsSync(rawPath)) return [];
    const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    const map = new Map<string, any>();
    for (const row of raw) {
      if (!row.telefono) continue;
      let normalized: string;
      try {
        normalized = phoneNumber(String(row.telefono));
      } catch {
        continue;
      }
      const id = stableId(normalized);
      if (!map.has(id)) {
        map.set(id, {
          id,
          nombre: row.nombre || normalized,
          telefono: normalized,
          status: 'cliente',
          source: 'taylor',
          nameConfirmed: !!row.nombre,
          notificationsConsent: false,
          googleSyncStatus: 'synced',
          createdAt: row.createdAt?.seconds ? new Date(row.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
          updatedAt: row.updatedAt?.seconds ? new Date(row.updatedAt.seconds * 1000).toISOString() : new Date().toISOString()
        });
      } else {
        const existing = map.get(id);
        if (!existing.nameConfirmed && row.nombre) {
          existing.nombre = row.nombre;
          existing.nameConfirmed = true;
        }
      }
    }
    return Array.from(map.values());
  } catch (e) {
    return [];
  }
}

export async function ensureContact(phone: string, name?: string, source = 'whatsapp') {
  const normalized = phoneNumber(phone);
  const ref = contactsRef().doc(stableId(normalized));

  // If name is not provided or matches raw phone, look up from local Taylor dataset
  if (!name || name === normalized) {
    try {
      const local = getLocalFallbackContacts();
      const match = local.find(c => c.telefono === normalized);
      if (match?.nombre) name = match.nombre;
    } catch (_) {}
  }

  try {
    await withTimeout(database().runTransaction(async tx => {
      const old = await tx.get(ref);
      if (!old.exists) {
        tx.create(ref, {
          nombre: name || normalized,
          telefono: normalized,
          status: 'prospecto',
          source,
          nameConfirmed: source !== 'whatsapp' && !!name,
          notificationsConsent: false,
          googleSyncStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }));
    const snap = await withTimeout(ref.get());
    return { ...(snap.data() || {}), id: ref.id } as any;
  } catch (err: any) {
    return {
      id: ref.id,
      nombre: name || normalized,
      telefono: normalized,
      status: 'prospecto',
      source,
      nameConfirmed: source !== 'whatsapp' && !!name,
      notificationsConsent: false,
      googleSyncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

export async function listContacts() {
  const now = Date.now();
  if (cachedContacts && (now - lastContactsCacheTime) < CONTACTS_CACHE_TTL) {
    return cachedContacts;
  }

  let contacts: any[] = [];
  try {
    const snapshot = await withTimeout(contactsRef().orderBy('updatedAt', 'desc').limit(1000).get());
    contacts = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (err: any) {
    contacts = [];
  }

  // If Firestore is empty, timed out, or quota exceeded, fall back to local dataset
  if (contacts.length === 0) {
    contacts = getLocalFallbackContacts();
  } else {
    // Merge any missing Taylor contacts that aren't yet in Firestore
    const firestorePhones = new Set(contacts.map(c => c.telefono));
    const local = getLocalFallbackContacts();
    for (const loc of local) {
      if (!firestorePhones.has(loc.telefono)) {
        contacts.push(loc);
      }
    }
  }

  // Enrich with local metadata (stages, tags, deals)
  try {
    const metadata = await getMetadataState();
    const enriched = contacts.map(c => {
      const stage = metadata.contactStages[c.id] || (c.status === 'cliente' ? 'cliente' : 'nuevo');
      const tags = metadata.contactTags[c.id] || (c.tags || []);
      const contactDeals = metadata.deals.filter(d => d.contactId === c.id);
      const dealsTotal = contactDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      return {
        ...c,
        stage,
        tags,
        dealsCount: contactDeals.length,
        dealsTotal,
      };
    });
    cachedContacts = enriched;
    lastContactsCacheTime = now;
    return enriched;
  } catch (_) {
    cachedContacts = contacts;
    lastContactsCacheTime = now;
    return contacts;
  }
}

export async function allLegacyOrders() {
  const rows: any[] = [];
  try {
    let last: any;
    for (;;) {
      let query = database().collection(legacyPath()).orderBy('__name__').limit(500);
      if (last) query = query.startAfter(last);
      const page = await withTimeout(query.get(), 2000);
      rows.push(...page.docs.map(d => ({ ...d.data(), id: d.id })));
      if (page.size < 500) break;
      last = page.docs[page.docs.length - 1];
    }
  } catch (err: any) {
    // Return whatever was collected
  }
  return rows;
}

export async function reconcileOrders() {
  const rows = await allLegacyOrders();
  let linked = 0; let skippedInvalidPhones = 0;
  for (const row of rows) {
    if (!row.telefono) continue;
    const hasOrder = !!(row.nota_id || row.articulos?.length);
    let normalized: string;
    try { normalized = phoneNumber(String(row.telefono)); } catch { skippedInvalidPhones++; continue; }
    const contact = await ensureContact(normalized, row.nombre, hasOrder ? 'pedidos' : 'legacy');
    const ref = contactsRef().doc(contact.id);
    await migrateLegacyHistory(row, contact.id);
    if (!hasOrder) continue;
    const orderRef = ref.collection('orders').doc(row.id);
    const view = orderView(row);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
    try {
      await withTimeout(database().runTransaction(async tx => {
        const [old, person] = await Promise.all([tx.get(orderRef), tx.get(ref)]);
        const previous = old.data();
        const changed = !sameData(previous, view);
        const updates: any = { status: 'cliente' };
        if (!person.data()?.nameConfirmed && row.nombre) Object.assign(updates, { nombre: row.nombre, nameConfirmed: true, googleSyncStatus: 'pending' });
        if (person.data()?.status !== 'cliente' || updates.nombre) updates.updatedAt = new Date().toISOString();
        tx.update(ref, updates);
        tx.set(orderRef, view);
        if (changed && previous) tx.set(ref.collection('timeline').doc(), { type: 'pedido', text: `Pedido ${view.folio}: ${view.stage}`, orderId: row.id, createdAt: new Date().toISOString(), author: 'Sistema de pedidos' });
      }));
    } catch (_) {}
    linked++;
  }
  return { linked, skippedInvalidPhones };
}

async function migrateLegacyHistory(row: any, contactId: string) {
  try {
    const marker = database().doc(`${crmPath}/migrations/${row.id}`);
    if ((await withTimeout(marker.get())).exists) return;
    const { saveWhatsAppMessage } = await import('./firebase-server');
    const legacyMessages = await withTimeout(database().collection(`${legacyPath()}/${row.id}/whatsapp_messages`).get());
    for (const doc of legacyMessages.docs) {
      const msg = doc.data(); const originalChat = msg.fromMe ? msg.to : msg.from;
      const chatId = typeof originalChat === 'string' && /^[0-9]+@c\.us$/.test(originalChat) ? originalChat : phoneNumber(row.telefono).slice(1)+'@c.us';
      const messageId = /^(true|false)_/.test(doc.id) ? doc.id : `${!!msg.fromMe}_${chatId}_${doc.id}`;
      await saveWhatsAppMessage(chatId, { ...msg, id: messageId });
    }
  } catch (_) {}
}

export async function contactContext(phone: string) {
  let contact: any = null;
  let orders: any[] = [];
  let timeline: any[] = [];
  let notices: any[] = [];

  const normalized = phoneNumber(phone);

  try {
    contact = await ensureContact(phone);
    const ref = contactsRef().doc(contact.id);
    const [ordersSnap, timelineSnap, noticesSnap] = await withTimeout(Promise.all([
      ref.collection('orders').get().catch(() => ({ docs: [] })),
      ref.collection('timeline').orderBy('createdAt', 'desc').limit(100).get().catch(() => ({ docs: [] })),
      database().collection(`${crmPath}/notifications`).where('contactId', '==', contact.id).get().catch(() => ({ docs: [] })),
    ]));
    orders = (ordersSnap?.docs || []).map((d: any) => ({ ...d.data(), id: d.id }));
    timeline = (timelineSnap?.docs || []).map((d: any) => ({ ...d.data(), id: d.id }));
    notices = (noticesSnap?.docs || []).map((d: any) => ({ ...d.data(), id: d.id }));
  } catch (_) {}

  if (!contact) {
    contact = {
      id: stableId(normalized),
      nombre: normalized,
      telefono: normalized,
      status: 'prospecto',
      source: 'whatsapp',
      nameConfirmed: false,
      notificationsConsent: false,
      googleSyncStatus: 'pending'
    };
  }

  // Fallback to local clients dataset if orders list is empty
  if (orders.length === 0) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const rawPath = path.resolve(process.cwd(), 'src/data/clients_raw.json');
      if (fs.existsSync(rawPath)) {
        const rawClients = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
        const digits = normalized.replace(/\D/g, '').slice(-10);
        const matches = rawClients.filter((c: any) => {
          const cDigits = (c.telefono || '').replace(/\D/g, '').slice(-10);
          return cDigits && cDigits === digits && (c.nota_id || (c.articulos && c.articulos.length > 0));
        });

        for (const row of matches) {
          const view = orderView(row);
          orders.push(view);
          if (row.nombre && !contact.nameConfirmed) {
            contact.nombre = row.nombre;
            contact.status = 'cliente';
          }
        }
      }
    } catch (_) {}
  }

  // Enrich contact with metadata
  let stage = 'nuevo';
  let tags: string[] = [];
  let deals: any[] = [];
  let scheduled: any[] = [];

  try {
    const metadata = await getMetadataState();
    stage = metadata.contactStages[contact.id] || (contact.status === 'cliente' ? 'cliente' : 'nuevo');
    tags = metadata.contactTags[contact.id] || (contact.tags || []);
    deals = metadata.deals.filter(d => d.contactId === contact.id);
    scheduled = metadata.scheduledItems.filter(s => s.contactId === contact.id);
  } catch (_) {}

  return {
    contact,
    orders,
    timeline,
    notifications: notices.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 20),
    stage,
    tags,
    deals,
    scheduled,
  };
}

export async function patchContact(phone: string, patch: any, author: string) {
  const person = await ensureContact(phone);
  const ref = contactsRef().doc(person.id);
  const data: any = { updatedAt: new Date().toISOString(), googleSyncStatus: 'pending' };
  if (typeof patch.nombre === 'string' && patch.nombre.trim()) Object.assign(data, { nombre: patch.nombre.trim().slice(0,150), nameConfirmed: true });
  if (typeof patch.notificationsConsent === 'boolean') Object.assign(data, { notificationsConsent: patch.notificationsConsent, consentUpdatedAt: new Date().toISOString(), consentRecordedBy: author });
  try {
    await withTimeout(ref.update(data));
    if (typeof patch.note === 'string' && patch.note.trim()) {
      await withTimeout(ref.collection('timeline').add({
        type: ['incidencia','peticion','acuerdo','nota'].includes(patch.type) ? patch.type : 'nota',
        text: patch.note.trim().slice(0,5000),
        author,
        createdAt: new Date().toISOString()
      }));
    }
  } catch (_) {}

  if (typeof patch.stage === 'string') {
    await updateContactStage(phone, patch.stage);
  }
  if (Array.isArray(patch.tags)) {
    await updateContactTags(phone, patch.tags);
  }
  if (patch.deal) {
    await addDeal({
      ...patch.deal,
      contactId: person.id,
    });
  }
  if (patch.scheduled) {
    await addScheduledItem({
      ...patch.scheduled,
      contactId: person.id,
      phone: person.telefono,
      contactName: person.nombre,
    });
  }
}

// ==========================================
// Nuevas Funciones CRM: Etapas, Deals, Plantillas, Programados, etc.
// ==========================================

export async function getPipelineStages(): Promise<PipelineStage[]> {
  const metadata = await getMetadataState();
  return metadata.stages;
}

export async function savePipelineStages(stages: PipelineStage[]): Promise<PipelineStage[]> {
  const updated = await updateMetadataState(state => ({ ...state, stages }));
  return updated.stages;
}

export async function updateContactStage(phone: string, stageId: string) {
  const person = await ensureContact(phone);
  await updateMetadataState(state => ({
    ...state,
    contactStages: { ...state.contactStages, [person.id]: stageId }
  }));
  invalidateContactsCache();
}

export async function updateContactTags(phone: string, tags: string[]) {
  const person = await ensureContact(phone);
  await updateMetadataState(state => ({
    ...state,
    contactTags: { ...state.contactTags, [person.id]: tags }
  }));
  invalidateContactsCache();
}

export async function listDeals(): Promise<OpportunityDeal[]> {
  const metadata = await getMetadataState();
  return metadata.deals;
}

export async function addDeal(deal: Omit<OpportunityDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<OpportunityDeal> {
  const newDeal: OpportunityDeal = {
    ...deal,
    id: 'deal-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await updateMetadataState(state => ({
    ...state,
    deals: [newDeal, ...state.deals]
  }));
  invalidateContactsCache();
  return newDeal;
}

export async function updateDeal(dealId: string, patch: Partial<OpportunityDeal>): Promise<OpportunityDeal | null> {
  let updatedDeal: OpportunityDeal | null = null;
  await updateMetadataState(state => {
    const deals = state.deals.map(d => {
      if (d.id === dealId) {
        updatedDeal = { ...d, ...patch, updatedAt: new Date().toISOString() };
        return updatedDeal;
      }
      return d;
    });
    return { ...state, deals };
  });
  invalidateContactsCache();
  return updatedDeal;
}

export async function deleteDeal(dealId: string): Promise<boolean> {
  await updateMetadataState(state => ({
    ...state,
    deals: state.deals.filter(d => d.id !== dealId)
  }));
  invalidateContactsCache();
  return true;
}

export async function listQuickReplies(): Promise<QuickReply[]> {
  const metadata = await getMetadataState();
  return metadata.quickReplies;
}

export async function saveQuickReply(reply: QuickReply): Promise<QuickReply> {
  const id = reply.id || ('qr-' + Date.now());
  const item = { ...reply, id };
  await updateMetadataState(state => {
    const exists = state.quickReplies.some(q => q.id === id);
    const quickReplies = exists
      ? state.quickReplies.map(q => q.id === id ? item : q)
      : [...state.quickReplies, item];
    return { ...state, quickReplies };
  });
  return item;
}

export async function deleteQuickReply(id: string): Promise<boolean> {
  await updateMetadataState(state => ({
    ...state,
    quickReplies: state.quickReplies.filter(q => q.id !== id)
  }));
  return true;
}

export async function listScheduledItems(): Promise<ScheduledItem[]> {
  const metadata = await getMetadataState();
  return metadata.scheduledItems;
}

export async function addScheduledItem(item: Omit<ScheduledItem, 'id' | 'createdAt' | 'status'>): Promise<ScheduledItem> {
  const newItem: ScheduledItem = {
    ...item,
    id: 'sch-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  await updateMetadataState(state => ({
    ...state,
    scheduledItems: [newItem, ...state.scheduledItems]
  }));
  return newItem;
}

export async function updateScheduledItem(id: string, patch: Partial<ScheduledItem>): Promise<ScheduledItem | null> {
  let updated: ScheduledItem | null = null;
  await updateMetadataState(state => {
    const scheduledItems = state.scheduledItems.map(s => {
      if (s.id === id) {
        updated = { ...s, ...patch };
        return updated;
      }
      return s;
    });
    return { ...state, scheduledItems };
  });
  return updated;
}

export async function deleteScheduledItem(id: string): Promise<boolean> {
  await updateMetadataState(state => ({
    ...state,
    scheduledItems: state.scheduledItems.filter(s => s.id !== id)
  }));
  return true;
}

export async function listCampaigns(): Promise<CampaignItem[]> {
  const metadata = await getMetadataState();
  return metadata.campaigns;
}

export async function saveCampaign(campaign: Partial<CampaignItem>): Promise<CampaignItem> {
  const id = campaign.id || ('cmp-' + Date.now());
  const item: CampaignItem = {
    id,
    name: campaign.name || 'Campaña sin nombre',
    status: campaign.status || 'draft',
    messageTemplate: campaign.messageTemplate || '',
    mediaBase64: campaign.mediaBase64,
    recipients: campaign.recipients || [],
    scheduledFor: campaign.scheduledFor,
    progress: campaign.progress || { total: (campaign.recipients || []).length, sent: 0, failed: 0 },
    createdAt: campaign.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await updateMetadataState(state => {
    const exists = state.campaigns.some(c => c.id === id);
    const campaigns = exists
      ? state.campaigns.map(c => c.id === id ? item : c)
      : [item, ...state.campaigns];
    return { ...state, campaigns };
  });
  return item;
}

export async function listAutomationRules(): Promise<AutomationRule[]> {
  const metadata = await getMetadataState();
  return metadata.automations;
}

export async function saveAutomationRule(rule: Partial<AutomationRule>): Promise<AutomationRule> {
  const id = rule.id || ('auto-' + Date.now());
  const item: AutomationRule = {
    id,
    name: rule.name || 'Nueva regla',
    trigger: rule.trigger || 'keyword',
    keywordPattern: rule.keywordPattern,
    stageTrigger: rule.stageTrigger,
    inactivityDays: rule.inactivityDays,
    actionType: rule.actionType || 'send_message',
    actionPayload: rule.actionPayload || '',
    active: rule.active !== false,
    handoffToHuman: rule.handoffToHuman || false
  };
  await updateMetadataState(state => {
    const exists = state.automations.some(a => a.id === id);
    const automations = exists
      ? state.automations.map(a => a.id === id ? item : a)
      : [...state.automations, item];
    return { ...state, automations };
  });
  return item;
}

export async function toggleAutomationRule(id: string, active: boolean): Promise<boolean> {
  await updateMetadataState(state => ({
    ...state,
    automations: state.automations.map(a => a.id === id ? { ...a, active } : a)
  }));
  return true;
}

