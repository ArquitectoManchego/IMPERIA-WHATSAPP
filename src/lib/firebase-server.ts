import { database, crmPath } from './admin-db';
import { ensureContact, listContacts, contactsRef } from './crm-store';
import { phoneNumber, stableId } from './crm-domain';

export const getClients = listContacts;
export async function isRegisteredClient(phone: string) {
  const doc = await contactsRef().doc(stableId(phoneNumber(phone))).get();
  return doc.exists ? { ...doc.data(), id: doc.id } : null;
}
export async function saveClientFromGoogle(data: any) {
  const contact = await ensureContact(data.telefono, data.nombre, 'google');
  const fields: any = { updatedAt: new Date().toISOString(), googleSyncStatus: 'pending' };
  for (const key of ['nombre','email','tags','empresa','cargo','direccion','notas','birthday']) if (data[key] !== undefined) fields[key] = data[key];
  if (data.nombre) fields.nameConfirmed = true;
  if (typeof data.id === 'string' && data.id.startsWith('people/')) Object.assign(fields, { googleResourceName: data.id, googleSyncStatus: 'synced' });
  await contactsRef().doc(contact.id).update(fields); return contact.id;
}
export const upsertClient = saveClientFromGoogle;
export async function saveWhatsAppMessage(chatId: string, msg: any) {
  const id = msg.id?.id || msg.id?._serialized || msg.id;
  if (typeof id !== 'string' || !id) throw new Error('El mensaje no contiene un identificador estable');
  const ref = database().doc(`${crmPath}/conversations/${stableId(chatId)}`);
  const message = { id, body: msg.body || '', from: msg.from || '', to: msg.to || '', fromMe: !!msg.fromMe,
    timestamp: Number(msg.timestamp) || Math.floor(Date.now()/1000), type: msg.type || 'chat', hasMedia: !!msg.hasMedia || !!msg.media,
    ...(typeof msg.ack === 'number' ? { ack: msg.ack } : {}),
    ...(msg.quotedMessage ? { quotedMessage: { id: msg.quotedMessage.id || '', body: msg.quotedMessage.body || '' } } : {}),
    media: msg.media ? { mimetype: msg.media.mimetype || '', filename: msg.media.filename || '' } : null };
  await database().runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    tx.set(ref.collection('messages').doc(stableId(id)), message, { merge: true });
    if (!snapshot.exists || message.timestamp >= snapshot.data()!.timestamp) tx.set(ref, { id: chatId, timestamp: message.timestamp, lastMessage: message.body }, { merge: true });
  });
  return true;
}
export async function getStoredMessages(chatId: string, count = 100) {
  const rows = await database().collection(`${crmPath}/conversations/${stableId(chatId)}/messages`).orderBy('timestamp','desc').limit(Math.min(500,Math.max(1,count))).get();
  return rows.docs.map(d => d.data()).reverse();
}
export async function storedChats() {
  const rows = await database().collection(`${crmPath}/conversations`).orderBy('timestamp','desc').limit(200).get();
  return rows.docs.map(d => d.data());
}
