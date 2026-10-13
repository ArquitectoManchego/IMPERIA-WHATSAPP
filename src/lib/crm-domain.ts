import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export function phoneNumber(value: string): string {
  if (typeof value !== 'string' || /@(g\.us|lid|broadcast|newsletter)$/.test(value)) throw new Error('Se requiere un teléfono individual verificable');
  if (!/^[+\d\s().-]+(?:@(?:c\.us|s\.whatsapp\.net))?$/.test(value)) throw new Error('Formato de teléfono inválido');
  let digits = value.replace(/@(?:c\.us|s\.whatsapp\.net)$/, '').replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (/^521\d{10}$/.test(digits)) digits = '52' + digits.slice(3);
  if (/^\d{10}$/.test(digits)) digits = '52' + digits;
  if (!/^[1-9]\d{7,14}$/.test(digits)) throw new Error('Teléfono inválido');
  return '+' + digits;
}
export const stableId = (value: string) => createHash('sha256').update(value).digest('hex');
export function sameData(a: any, b: any): boolean {
  const canonical = (v: any): any => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k,canonical(v[k])])) : v;
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}
export function validSignature(raw: string, signature: string | null, secret: string) {
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const received = signature.replace(/^sha256=/, '');
  return /^[a-f0-9]{64}$/i.test(received) && timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
}
export function orderView(row: any) {
  const delivered = row.status === 'Entregado' || row.productionStatus?.entregado === true;
  const ready = !delivered && row.productionStatus?.listoEnTienda === true && !row.productionStatus?.requiereAjustes;
  const stage = delivered ? 'Entregado' : ready ? 'Listo para recoger' : row.productionStatus?.requiereAjustes ? 'En ajustes' : row.status || 'Pendiente';
  return { id: row.id, folio: row.nota_id || row.id, stage, ready, delivered,
    promisedDate: row.fecha_entrega_general || null, estimatedDate: row.fecha_estimada || null,
    shipped: row.enviado === true, tracking: row.guia || null, carrier: row.paqueteria || null,
    items: row.articulos || [], total: row.total || '', notes: row.notas_extra || '',
    deliveryDate: row.fecha_entrega_real || null, changeReason: row.motivo_cambio_fecha || null };
}
export function notificationFor(previous: any, current: any, today: string) {
  if (!previous || current.delivered) return null; // Initial import never sends historical notices.
  if (current.ready && !previous.ready) return { kind: 'ready', text: `Tu pedido ${current.folio} está listo para recoger. Contáctanos para coordinar la entrega.` };
  if (current.shipped && !previous.shipped) return { kind: 'shipped', text: `Tu pedido ${current.folio} salió a reparto.${current.tracking ? ' Guía: ' + current.tracking : ''}${current.estimatedDate ? ' Fecha estimada: ' + current.estimatedDate : ''}` };
  if (current.estimatedDate && current.estimatedDate !== previous.estimatedDate) return { kind: 'date', text: `La fecha estimada de tu pedido ${current.folio} es ${current.estimatedDate}.${current.changeReason ? ' ' + current.changeReason : ''}` };
  const overdue = current.promisedDate && current.promisedDate.slice(0, 10) < today && !current.ready && !current.shipped;
  if (overdue) return { kind: 'delayed', text: `Tu pedido ${current.folio} presenta un retraso respecto a la fecha comprometida.${current.estimatedDate ? ' Nueva fecha estimada: ' + current.estimatedDate : ' Estamos confirmando una nueva fecha de entrega.'}` };
  if (current.stage !== previous.stage) return { kind: 'stage', text: `Tu pedido ${current.folio} se encuentra en: ${current.stage}.${current.estimatedDate ? ' Fecha estimada: ' + current.estimatedDate : ''}` };
  return null;
}

// ==========================================
// Extensión CRM: Etapas, Oportunidades, Respuestas y Automatización
// ==========================================

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color?: string;
  isDefault?: boolean;
}

export const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'nuevo', name: 'Nuevo contacto', order: 0, color: 'sky', isDefault: true },
  { id: 'negociacion', name: 'Negociación', order: 1, color: 'amber', isDefault: true },
  { id: 'cliente', name: 'Cliente', order: 2, color: 'emerald', isDefault: true },
];

export interface OpportunityDeal {
  id: string;
  contactId: string;
  title: string;
  amount: number;
  currency: string;
  stage: string;
  status: 'abierta' | 'ganada' | 'perdida';
  createdAt: string;
  updatedAt: string;
  expectedDate?: string;
  notes?: string;
}

export interface QuickReply {
  id: string;
  title: string;
  shortcut: string;
  content: string;
  category: string;
  mediaType?: 'text' | 'image' | 'audio' | 'video' | 'document';
  mediaBase64?: string;
  mediaUrl?: string;
}

export interface ScheduledItem {
  id: string;
  contactId: string;
  phone: string;
  contactName?: string;
  type: 'whatsapp_message' | 'internal_reminder';
  title?: string;
  content: string;
  scheduledFor: string; // ISO en America/Mexico_City
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  executedAt?: string;
  error?: string;
  createdAt: string;
}

export interface CampaignItem {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'cancelled';
  messageTemplate: string;
  mediaBase64?: string;
  recipients: Array<{
    phone: string;
    name?: string;
    status: 'pending' | 'sent' | 'failed';
    error?: string;
    sentAt?: string;
  }>;
  scheduledFor?: string;
  progress: {
    total: number;
    sent: number;
    failed: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'keyword' | 'stage_changed' | 'order_status' | 'inactivity';
  keywordPattern?: string;
  stageTrigger?: string;
  inactivityDays?: number;
  actionType: 'send_message' | 'change_stage' | 'add_tag';
  actionPayload: string;
  active: boolean;
  handoffToHuman?: boolean;
}

export function isContactInactive(lastInteractionDate?: string | number, maxDays = 3): { inactive: boolean; days: number } {
  if (!lastInteractionDate) return { inactive: true, days: 999 };
  const lastTime = typeof lastInteractionDate === 'number' 
    ? (lastInteractionDate > 1e12 ? lastInteractionDate : lastInteractionDate * 1000)
    : new Date(lastInteractionDate).getTime();
  if (isNaN(lastTime)) return { inactive: true, days: 999 };
  const diffDays = Math.floor((Date.now() - lastTime) / (1000 * 60 * 60 * 24));
  return { inactive: diffDays >= maxDays, days: diffDays };
}

export function getMexicoCityDateTime(date = new Date()): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

