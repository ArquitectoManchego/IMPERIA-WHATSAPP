export interface VariableContext {
  name?: string;
  phone?: string;
  stage?: string;
  company?: string;
  loyalty?: {
    cardNumber?: string;
    currentPoints?: number;
    availableRewards?: Array<{ title: string; costPoints: number }>;
  };
}

export interface VariableDescriptor {
  tag: string;
  label: string;
  example: string;
}

export const AVAILABLE_TEMPLATE_VARIABLES: VariableDescriptor[] = [
  { tag: '{nombre}', label: 'Nombre completo', example: 'Dr. Alejandro Morales' },
  { tag: '{primer_nombre}', label: 'Primer nombre', example: 'Alejandro' },
  { tag: '{telefono}', label: 'Teléfono', example: '2291234567' },
  { tag: '{tarjeta}', label: 'Tarjeta frecuente', example: 'IMP-749210' },
  { tag: '{puntos}', label: 'Puntos lealtad', example: '450 PTS' },
  { tag: '{beneficio}', label: 'Beneficio activo', example: 'Bordado Institucional Gratis' },
  { tag: '{etapa}', label: 'Etapa CRM', example: 'Cotización Enviada' },
  { tag: '{empresa}', label: 'Institución / Empresa', example: 'Universidad Veracruzana' },
];

/**
 * Replaces dynamic placeholders in a message template with actual contact and loyalty data.
 */
export function replaceTemplateVariables(template: string, ctx: VariableContext): string {
  if (!template) return '';

  const fullName = ctx.name?.trim() || 'Cliente';
  const firstName = fullName.split(' ')[0] || 'Cliente';
  const phone = ctx.phone?.replace(/\D/g, '') || '';
  const cardNumber = ctx.loyalty?.cardNumber || 'IMP-000000';
  const points = ctx.loyalty?.currentPoints !== undefined ? `${ctx.loyalty.currentPoints} PTS` : '0 PTS';
  const benefit = ctx.loyalty?.availableRewards?.[0]?.title || 'Beneficio disponible en su próxima visita';
  const stage = ctx.stage || 'En atención';
  const company = ctx.company || 'Imperia Uniformes';

  return template
    .replace(/{nombre}/gi, fullName)
    .replace(/{primer_nombre}/gi, firstName)
    .replace(/{telefono}/gi, phone)
    .replace(/{tarjeta}/gi, cardNumber)
    .replace(/{puntos}/gi, points)
    .replace(/{beneficio}/gi, benefit)
    .replace(/{etapa}/gi, stage)
    .replace(/{empresa}/gi, company);
}
