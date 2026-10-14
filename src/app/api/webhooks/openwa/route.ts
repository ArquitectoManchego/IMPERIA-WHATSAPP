import { NextRequest, NextResponse } from 'next/server';
import { validSignature } from '@/lib/crm-domain';
import { ensureContact } from '@/lib/crm-store';
import { saveWhatsAppMessage } from '@/lib/firebase-server';
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get('x-openwa-signature'), process.env.WEBHOOK_SECRET || '')) return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  try {
    const { event, data } = JSON.parse(raw);
    if (event !== 'message.received') return NextResponse.json({ ignored: true });
    if (!data?.id || !data?.from) return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });
    const parsedTs = data.timestamp ? (typeof data.timestamp === 'number' ? data.timestamp : Math.floor(new Date(data.timestamp).getTime() / 1000)) : Math.floor(Date.now() / 1000);
    data.timestamp = Number.isFinite(parsedTs) ? parsedTs : Math.floor(Date.now() / 1000);
    if (data.isGroup || /@(g\.us|broadcast|newsletter)$/.test(data.from)) return NextResponse.json({ ignored: true });
    // LID is a WhatsApp identity, never a phone. Gateway supplies resolved phone when possible.
    const identity = data.fromMe ? data.to : data.from;
    const phone = data.phoneNumber || (!identity.endsWith('@lid') ? identity : null);
    if (phone) await ensureContact(phone, data.pushName);
    await saveWhatsAppMessage(data.chatId || data.from, data);

    // Automation & Chatbot Rules evaluation
    if (!data.fromMe && data.body) {
      try {
        const { listAutomationRules, updateContactTags, updateContactStage } = await import('@/lib/crm-store');
        const rules = await listAutomationRules();
        for (const rule of rules) {
          if (!rule.active) continue;
          let matches = false;
          if (rule.trigger === 'keyword' && rule.keywordPattern) {
            try {
              const regex = new RegExp(rule.keywordPattern, 'i');
              matches = regex.test(data.body);
            } catch (_) {}
          }
          if (matches) {
            const targetPhone = phone || identity;
            if (rule.actionType === 'add_tag' && targetPhone) {
              await updateContactTags(targetPhone, [rule.actionPayload]);
            } else if (rule.actionType === 'change_stage' && targetPhone) {
              await updateContactStage(targetPhone, rule.actionPayload);
            } else if (rule.actionType === 'send_message') {
              if (process.env.CRM_AUTOMATIONS_ENABLED === 'true') {
                const { sendMessage } = await import('@/lib/whatsapp');
                await sendMessage(data.chatId || data.from, rule.actionPayload);
              }
            }
          }
        }
      } catch (autoErr) {
        console.warn('[Webhook] Error evaluando reglas de automatización:', autoErr);
      }
    }

    return NextResponse.json({ success: true, unresolvedPhone: !phone });
  } catch (error) {
    console.error('Webhook persistence failed', error);
    return NextResponse.json({ error: 'No se pudo guardar el mensaje; se requiere reintento' }, { status: 503 });
  }
}
