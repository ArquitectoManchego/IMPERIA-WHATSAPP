import { randomUUID, timingSafeEqual } from 'node:crypto';
import { database, crmPath, legacyPath } from './admin-db';
import { contactsRef, reconcileOrders } from './crm-store';
import { syncGoogleContacts } from './google-sync';
import { orderView, sameData, phoneNumber } from './crm-domain';
import { sendMessage, getWhatsAppStatus, chatIdentifier } from './whatsapp';
import { saveWhatsAppMessage } from './firebase-server';

export function workerAuthorized(header: string | null) {
  const secret = process.env.CRM_WORKER_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header); const b = Buffer.from('Bearer ' + secret);
  return a.length === b.length && timingSafeEqual(a,b);
}
export async function runWorker() {
  const db = database(); const lease = db.doc(`${crmPath}/integrations/worker`); const owner = randomUUID();
  const acquired = await db.runTransaction(async tx => {
    const old = (await tx.get(lease)).data();
    if (old?.lockedUntil > Date.now()) return false;
    tx.set(lease, { owner, lockedUntil: Date.now()+120000, startedAt: new Date().toISOString() }, { merge: true }); return true;
  });
  if (!acquired) return { busy: true };
  let lost = false;
  const heartbeat = setInterval(() => {
    db.runTransaction(async tx => { const old = await tx.get(lease); if (old.data()?.owner !== owner) { lost = true; return; } tx.update(lease, { lockedUntil: Date.now()+120000 }); }).catch(() => { lost = true; });
  },30000);
  const errors: string[] = [];
  try {
    const orders = await reconcileOrders();
    let whatsapp: any = null;
    if (!lost) {
      try { whatsapp = await getWhatsAppStatus(); }
      catch (error: any) { errors.push('WhatsApp: ' + error.message); }
    }
    let google: any;
    if (!lost) { try { google = await syncGoogleContacts(() => !lost); } catch (error: any) { errors.push('Google: ' + error.message); } }
    let sent = 0;
    if (process.env.CRM_AUTOMATIONS_ENABLED === 'true' && !lost) {
      const queue = await db.collection(`${crmPath}/notifications`).get();
      for (const job of queue.docs) {
        if (lost) break;
        const data = job.data();
        if (data.status === 'sending') { await job.ref.update({ status: 'uncertain', error: 'El proceso se interrumpió durante el envío; revisar conversación antes de reenviar' }); continue; }
        if (!['pending','retry'].includes(data.status) || data.nextAttemptAt > Date.now()) continue;
        const contact = (await contactsRef().doc(data.contactId).get()).data();
        if (!contact?.notificationsConsent) continue;
        const currentRow = await db.collection(legacyPath()).doc(data.orderId).get();
        const current = currentRow.exists ? orderView({ ...currentRow.data(), id: currentRow.id }) : null;
        if (!current || !sameData(current, data.expectedOrder)) { await job.ref.update({ status: 'cancelled', error: 'El pedido cambió desde la preparación del aviso' }); continue; }
        // Persist the send boundary. A crash beyond this point must be reviewed, never blindly retried.
        const claimed = await db.runTransaction(async tx => {
          const [lock, latest, person] = await Promise.all([tx.get(lease), tx.get(job.ref), tx.get(contactsRef().doc(data.contactId))]);
          if (lock.data()?.owner !== owner || !person.data()?.notificationsConsent || !['pending','retry'].includes(latest.data()?.status)) return false;
          tx.update(job.ref, { status: 'sending', attempts: data.attempts + 1, attemptedAt: new Date().toISOString() }); return true;
        });
        if (!claimed) continue;
        let providerAccepted = false;
        try {
          const result = await sendMessage(contact.telefono, data.text);
          providerAccepted = true;
          await job.ref.update({ status: 'sent', messageId: result.id.id, sentAt: new Date().toISOString(), error: null }); sent++;
        } catch (error: any) {
          const uncertain = providerAccepted || error.deliveryUncertain === true;
          await job.ref.update({ status: uncertain ? 'uncertain' : data.attempts >= 4 ? 'failed' : 'retry', error: error.message, nextAttemptAt: Date.now()+Math.min(3600000, 60000 * 2**data.attempts) });
        }
      }
    }
    let outboxResult = { processed: 0, errors: [] as string[] };
    let scheduledResult = { executed: 0 };
    if (!lost) {
      try {
        outboxResult = await processOutbox();
        if (outboxResult.errors?.length) errors.push(...outboxResult.errors);
      } catch (err: any) {
        errors.push('Outbox: ' + err.message);
      }
      try {
        scheduledResult = await processScheduledItems();
      } catch (err: any) {
        errors.push('Scheduled: ' + err.message);
      }
    }
    const result = { orders, whatsapp, outbox: outboxResult.processed, scheduled: scheduledResult.executed, google: google || null, sent, automationsEnabled: process.env.CRM_AUTOMATIONS_ENABLED === 'true', errors };
    await lease.set({ lastResult: result, completedAt: new Date().toISOString() }, { merge: true }); return result;
  } finally {
    clearInterval(heartbeat);
    await db.runTransaction(async tx => { const old = await tx.get(lease); if (old.data()?.owner === owner) tx.update(lease, { lockedUntil: 0 }); });
  }
}

export async function processOutbox() {
  const db = database();
  const queue = await db.collection(`${crmPath}/outbox`)
    .where('status', 'in', ['pending', 'retry'])
    .limit(20)
    .get();

  if (queue.empty) return { processed: 0, errors: [] as string[] };
  let processed = 0;
  const errors: string[] = [];

  for (const doc of queue.docs) {
    const data = doc.data();
    if (data.status === 'sending') continue;
    if (data.nextAttemptAt && data.nextAttemptAt > Date.now()) continue;

    // Safety restriction in test mode: only authorized test phone is allowed!
    if (process.env.CRM_AUTOMATIONS_ENABLED !== 'true') {
      const testPhone = process.env.CRM_TEST_PHONE;
      let isAllowed = false;
      try {
        if (testPhone && phoneNumber(data.chatId) === phoneNumber(testPhone)) isAllowed = true;
      } catch {
        isAllowed = false;
      }
      if (!isAllowed) {
        await doc.ref.update({
          status: 'blocked',
          error: `Envío bloqueado en modo prueba: destinatario no autorizado por CRM_TEST_PHONE (${testPhone || 'no configurado'})`,
          updatedAt: new Date().toISOString()
        });
        errors.push(`Bloqueado envío a ${data.chatId}: no coincide con CRM_TEST_PHONE`);
        continue;
      }
    }

    // Atomically claim the item
    const claimed = await db.runTransaction(async tx => {
      const snap = await tx.get(doc.ref);
      if (!['pending', 'retry'].includes(snap.data()?.status)) return false;
      tx.update(doc.ref, {
        status: 'sending',
        attempts: (data.attempts || 0) + 1,
        attemptedAt: new Date().toISOString()
      });
      return true;
    });

    if (!claimed) continue;

    let providerAccepted = false;
    try {
      const result = await sendMessage(data.chatId, data.message, data.mediaBase64, data.quotedId);
      providerAccepted = true;
      const messageId = result.id.id;

      await doc.ref.update({
        status: 'sent',
        messageId,
        sentAt: new Date().toISOString(),
        error: null
      });

      // Update sendRequest if exists
      const sendReqRef = db.doc(`${crmPath}/sendRequests/${doc.id}`);
      await sendReqRef.set({ status: 'sent', messageId, sentAt: new Date().toISOString() }, { merge: true }).catch(() => {});

      // Record in conversation
      const msgId = chatIdentifier(data.chatId);
      await saveWhatsAppMessage(msgId, {
        id: messageId,
        body: data.message,
        fromMe: true,
        from: 'me',
        to: msgId,
        timestamp: Math.floor(Date.now() / 1000),
        type: data.mediaBase64 ? 'media' : 'chat',
        hasMedia: !!data.mediaBase64,
        deliveryStatus: 'sent'
      });

      processed++;
    } catch (err: any) {
      const uncertain = providerAccepted || err.deliveryUncertain === true;
      const attempts = (data.attempts || 0) + 1;
      await doc.ref.update({
        status: uncertain ? 'uncertain' : attempts >= 3 ? 'failed' : 'retry',
        error: err.message,
        nextAttemptAt: Date.now() + Math.min(300000, 15000 * 2 ** attempts)
      });
      errors.push(`Error en outbox ${doc.id}: ${err.message}`);
    }
  }

  return { processed, errors };
}

export async function processScheduledItems() {
  const { listScheduledItems, updateScheduledItem } = await import('./crm-store');
  const items = await listScheduledItems();
  const now = new Date().toISOString();
  let executed = 0;

  for (const item of items) {
    if (item.status === 'pending' && item.scheduledFor <= now) {
      if (item.type === 'internal_reminder') {
        await updateScheduledItem(item.id, {
          status: 'sent',
          executedAt: new Date().toISOString()
        });
        executed++;
      } else if (item.type === 'whatsapp_message') {
        const automationsEnabled = process.env.CRM_AUTOMATIONS_ENABLED === 'true';
        const testPhone = process.env.CRM_TEST_PHONE;

        if (!automationsEnabled && testPhone && !item.phone.includes(testPhone.replace(/\D/g, '').slice(-10))) {
          await updateScheduledItem(item.id, {
            status: 'failed',
            error: 'Modo seguro: Envíos programados restringidos al teléfono de pruebas autorizado.'
          });
          continue;
        }

        try {
          const { sendMessage } = await import('./whatsapp');
          await sendMessage(item.phone, item.content);
          await updateScheduledItem(item.id, {
            status: 'sent',
            executedAt: new Date().toISOString()
          });
          executed++;
        } catch (err: any) {
          await updateScheduledItem(item.id, {
            status: 'failed',
            error: err.message
          });
        }
      }
    }
  }
  return { executed };
}

