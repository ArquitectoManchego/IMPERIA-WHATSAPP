import { google } from 'googleapis';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { database, crmPath } from './admin-db';
import { contactsRef } from './crm-store';
import { phoneNumber } from './crm-domain';

function encryptionKey() {
  if (!process.env.NEXTAUTH_SECRET) throw new Error('Falta NEXTAUTH_SECRET');
  return createHash('sha256').update(process.env.NEXTAUTH_SECRET).digest();
}
function encrypt(value: string) {
  const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
}
function decrypt(value: string) {
  const data = Buffer.from(value, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), data.subarray(0,12));
  decipher.setAuthTag(data.subarray(12,28));
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8');
}
const credentialsRef = () => database().doc(`${crmPath}/integrations/google`);
export async function saveGoogleCredentials(account: any) {
  if (account.refresh_token) await credentialsRef().set({ refreshToken: encrypt(account.refresh_token), owner: process.env.GOOGLE_CONTACTS_OWNER_EMAIL, updatedAt: new Date().toISOString() }, { merge: true });
}
export async function googlePeople() {
  const stored = (await credentialsRef().get()).data();
  if (!stored?.refreshToken || stored.owner !== process.env.GOOGLE_CONTACTS_OWNER_EMAIL) throw new Error('Conecta la cuenta principal de Google Contacts');
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: decrypt(stored.refreshToken) });
  return google.people({ version: 'v1', auth });
}
export async function readGoogleContacts() {
  const people = await googlePeople(); const contacts: any[] = []; let pageToken: string | undefined;
  do {
    const result = await people.people.connections.list({ resourceName: 'people/me', pageSize: 1000, pageToken, personFields: 'names,phoneNumbers,emailAddresses,metadata,userDefined' });
    contacts.push(...(result.data.connections || [])); pageToken = result.data.nextPageToken || undefined;
  } while (pageToken);
  return contacts;
}
export async function syncGoogleContacts(shouldContinue = () => true) {
  const people = await googlePeople(); const googleContacts = await readGoogleContacts();
  const local = await contactsRef().get(); let synced = 0; let failed = 0;
  for (const row of local.docs) {
    if (!shouldContinue()) throw new Error('Se perdió el bloqueo del worker; sincronización detenida');
    const contact = row.data(); if (contact.googleSyncStatus === 'synced') continue;
    try {
      const matches = googleContacts.filter(c => c.resourceName === contact.googleResourceName || (c.phoneNumbers || []).some((p: any) => { try { return phoneNumber(p.value) === contact.telefono; } catch { return false; } }));
      if (matches.length > 1) throw new Error('Hay varios contactos de Google con este teléfono; revisa los duplicados');
      let person = matches[0];
      if (!person && ['creating','uncertain'].includes(contact.googleSyncStatus)) throw new Error('Creación anterior sin confirmar: revisa Google Contacts antes de reintentar');
      if (person) {
        const fresh = (await people.people.get({ resourceName: person.resourceName, personFields: 'names,phoneNumbers,metadata,userDefined' })).data;
        // Only update names for CRM-owned entries. Preserve personal names on linked existing contacts.
        if (contact.googleManaged) person = (await people.people.updateContact({ resourceName: person.resourceName, updatePersonFields: 'names', requestBody: { etag: fresh.etag, metadata: fresh.metadata, names: [{ givenName: `${contact.nombre} · IMPERIA` }] } })).data;
      } else {
        await row.ref.update({ googleSyncStatus: 'creating' });
        try {
          person = (await people.people.createContact({ requestBody: { names: [{ givenName: `${contact.nombre} · IMPERIA` }], phoneNumbers: [{ value: contact.telefono }], userDefined: [{ key: 'imperiaContactId', value: row.id }] } })).data;
        } catch (error) { await row.ref.update({ googleSyncStatus: 'uncertain' }); throw error; }
        googleContacts.push(person);
        await row.ref.update({ googleManaged: true });
      }
      await database().runTransaction(async tx => {
        const current = await tx.get(row.ref);
        tx.update(row.ref, { googleResourceName: person.resourceName, googleSyncStatus: current.data()?.updatedAt === contact.updatedAt ? 'synced' : 'pending', googleSyncError: null, googleSyncedAt: new Date().toISOString() });
      }); synced++;
    } catch (error: any) {
      await row.ref.update({ googleSyncError: error.message }); failed++;
    }
  }
  return { synced, failed };
}
