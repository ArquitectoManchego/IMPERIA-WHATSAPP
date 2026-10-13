import fs from 'node:fs';
import path from 'node:path';
import { database, crmPath } from './admin-db';
import {
  DEFAULT_STAGES,
  PipelineStage,
  OpportunityDeal,
  QuickReply,
  ScheduledItem,
  CampaignItem,
  AutomationRule,
} from './crm-domain';

export interface CrmMetadataState {
  stages: PipelineStage[];
  deals: OpportunityDeal[];
  quickReplies: QuickReply[];
  scheduledItems: ScheduledItem[];
  campaigns: CampaignItem[];
  automations: AutomationRule[];
  inactivitySettings: {
    urgentFollowUpDays: number;
    inactiveDays: number;
  };
  contactStages: Record<string, string>; // contactId -> stageId
  contactTags: Record<string, string[]>; // contactId -> tags[]
}

const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    id: 'qr-1',
    title: 'Saludo inicial',
    shortcut: '/hola',
    category: 'General',
    content: '¡Hola! 👋 Gracias por comunicarte con nosotros. ¿En qué podemos ayudarte hoy?',
    mediaType: 'text',
  },
  {
    id: 'qr-2',
    title: 'Agendar cita / medidas',
    shortcut: '/cita',
    category: 'Ventas',
    content: 'Con gusto te agendamos una cita para toma de medidas y selección de prendas. ¿Qué día y horario te conviene mejor?',
    mediaType: 'text',
  },
  {
    id: 'qr-3',
    title: 'Datos de pago',
    shortcut: '/pago',
    category: 'Cobranza',
    content: 'Te compartimos las opciones de pago:\n💳 Transferencia / Depósito\nBanco: BBVA\nCLABE: 012 905 00123456789 0\nA nombre de: IMPERIA\nPor favor envíanos tu comprobante al realizarlo.',
    mediaType: 'text',
  },
  {
    id: 'qr-4',
    title: 'Pedido listo en tienda',
    shortcut: '/listo',
    category: 'Entrega',
    content: '¡Buenas noticias! Tu pedido ya está terminado y listo para recoger en tienda. Nuestro horario es de 9:00 AM a 7:00 PM.',
    mediaType: 'text',
  },
  {
    id: 'qr-5',
    title: 'Seguimiento de cotización',
    shortcut: '/seguimiento',
    category: 'Ventas',
    content: '¡Hola! Quería dar seguimiento a la propuesta que te compartimos. ¿Pudiste revisarla o tienes alguna duda que podamos resolver?',
    mediaType: 'text',
  },
];

const DEFAULT_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'auto-1',
    name: 'Auto-saludo inicial',
    trigger: 'keyword',
    keywordPattern: '^(hola|buenos d[ií]as|buenas tardes|saludos)',
    actionType: 'send_message',
    actionPayload: '¡Hola! Bienvenido a IMPERIA. Un asesor te atenderá en unos momentos. ¿Qué modelo o prenda estás buscando?',
    active: false,
    handoffToHuman: true,
  },
  {
    id: 'auto-2',
    name: 'Etiquetar prospecto de graduación',
    trigger: 'keyword',
    keywordPattern: 'graduaci[oó]n|toga|birrete|anillo',
    actionType: 'add_tag',
    actionPayload: 'Graduación',
    active: true,
    handoffToHuman: false,
  },
];

const DEFAULT_METADATA_FILE = path.resolve(process.cwd(), 'src/data/crm_metadata.json');
const METADATA_FILE = process.env.VERCEL ? '/tmp/crm_metadata.json' : DEFAULT_METADATA_FILE;

function getInitialState(): CrmMetadataState {
  return {
    stages: DEFAULT_STAGES,
    deals: [],
    quickReplies: DEFAULT_QUICK_REPLIES,
    scheduledItems: [],
    campaigns: [],
    automations: DEFAULT_AUTOMATIONS,
    inactivitySettings: {
      urgentFollowUpDays: 3,
      inactiveDays: 7,
    },
    contactStages: {},
    contactTags: {},
  };
}

export function readLocalMetadata(): CrmMetadataState {
  try {
    const fileToRead = fs.existsSync(METADATA_FILE)
      ? METADATA_FILE
      : fs.existsSync(DEFAULT_METADATA_FILE)
      ? DEFAULT_METADATA_FILE
      : null;

    if (fileToRead) {
      const raw = fs.readFileSync(fileToRead, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        ...getInitialState(),
        ...parsed,
        stages: Array.isArray(parsed.stages) && parsed.stages.length > 0 ? parsed.stages : DEFAULT_STAGES,
        quickReplies: Array.isArray(parsed.quickReplies) && parsed.quickReplies.length > 0 ? parsed.quickReplies : DEFAULT_QUICK_REPLIES,
        automations: Array.isArray(parsed.automations) && parsed.automations.length > 0 ? parsed.automations : DEFAULT_AUTOMATIONS,
      };
    }
  } catch (err) {
    console.warn('[CRM Metadata] Error reading local metadata file:', err);
  }
  const initial = getInitialState();
  saveLocalMetadata(initial);
  return initial;
}

export function saveLocalMetadata(state: CrmMetadataState): void {
  try {
    const dir = path.dirname(METADATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(METADATA_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[CRM Metadata] Error saving local metadata:', err);
  }
}

// Memory cache
let cachedState: CrmMetadataState | null = null;

export async function getMetadataState(): Promise<CrmMetadataState> {
  if (!cachedState) {
    cachedState = readLocalMetadata();
  }

  // Attempt async sync from Firestore if available
  try {
    const docRef = database().doc(`${crmPath}/config/metadata`);
    const snap = await Promise.race([
      docRef.get(),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1200))
    ]);

    if (snap && (snap as any).exists) {
      const remoteData = (snap as any).data();
      cachedState = {
        ...cachedState,
        ...remoteData,
        stages: remoteData.stages || cachedState.stages,
        deals: remoteData.deals || cachedState.deals,
        quickReplies: remoteData.quickReplies || cachedState.quickReplies,
        scheduledItems: remoteData.scheduledItems || cachedState.scheduledItems,
        campaigns: remoteData.campaigns || cachedState.campaigns,
        automations: remoteData.automations || cachedState.automations,
      };
      saveLocalMetadata(cachedState);
    }
  } catch (_) {
    // Keep local cache
  }

  return cachedState;
}

export async function updateMetadataState(updater: (current: CrmMetadataState) => CrmMetadataState): Promise<CrmMetadataState> {
  const current = await getMetadataState();
  const next = updater(current);
  cachedState = next;
  saveLocalMetadata(next);

  // Background update to Firestore
  try {
    const docRef = database().doc(`${crmPath}/config/metadata`);
    docRef.set(next, { merge: true }).catch(() => {});
  } catch (_) {}

  return next;
}
