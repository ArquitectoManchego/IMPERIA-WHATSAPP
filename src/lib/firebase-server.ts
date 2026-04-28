import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize for server-side use if dynamic variables are missing
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const getClientsPath = () => {
  const projectId = firebaseConfig.projectId;
  return `artifacts/${projectId}/public/data/clients`;
};

export const getClients = async () => {
  const clientsPath = getClientsPath();
  
  console.log('[FirebaseServer] Project ID:', firebaseConfig.projectId);
  console.log('[FirebaseServer] Fetching from path:', clientsPath);
  
  if (!firebaseConfig.projectId) {
    console.error('[FirebaseServer] Error: projectId is undefined');
    return [];
  }

  try {
    const clientsRef = collection(db, clientsPath);
    const querySnapshot = await getDocs(clientsRef);
    console.log('[FirebaseServer] Documents found:', querySnapshot.size);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Aggregate note numbers: nota_id + any numero_nota in abonos
      const noteNumbers = new Set<string>();
      if (data.nota_id) noteNumbers.add(data.nota_id);
      if (data.abonos && Array.isArray(data.abonos)) {
        data.abonos.forEach((a: any) => {
          if (a.numero_nota) noteNumbers.add(a.numero_nota);
        });
      }

      return {
        id: doc.id,
        ...data,
        compiledNotes: Array.from(noteNumbers).join(', ')
      };
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
};

export const isRegisteredClient = async (phoneNumber: string) => {
  try {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const clientsPath = getClientsPath();
    const clientsRef = collection(db, clientsPath);
    
    const q = query(clientsRef, where('telefono', '==', cleanNumber));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    
    // Check by last 10 digits as fallback
    if (cleanNumber.length >= 10) {
      const last10 = cleanNumber.slice(-10);
      const qAlt = query(clientsRef, where('telefono', '>=', last10), where('telefono', '<=', last10 + '\uf8ff'));
      const altSnapshot = await getDocs(qAlt);
      if (!altSnapshot.empty) {
        return altSnapshot.docs[0].data();
      }
    }

    return null;
  } catch (error) {
    console.error('Error checking client registration:', error);
    return null;
  }
};

// We rename it back to the original name but keep the new logic
export const saveClientFromGoogle = async (clientData: any) => {
  try {
    const cleanPhone = clientData.telefono?.replace(/\D/g, '') || '';
    if (!cleanPhone && !clientData.id) throw new Error('Phone or ID is required');

    // Check if exists in Taylor by phone
    const existing = cleanPhone ? await isRegisteredClient(cleanPhone) : null;
    const clientsPath = getClientsPath();
    
    let docRef;
    let dataToSave: any = {
      updatedAt: serverTimestamp(),
    };

    if (existing) {
      // Update existing
      docRef = doc(db, clientsPath, existing.id);
      dataToSave = {
        ...existing,
        ...dataToSave,
        nombre: clientData.nombre || existing.nombre,
        email: clientData.email || existing.email || '',
        tags: clientData.tags || existing.tags || [],
        empresa: clientData.empresa ?? existing.empresa ?? '',
        cargo: clientData.cargo ?? existing.cargo ?? '',
        direccion: clientData.direccion ?? existing.direccion ?? '',
        notas: clientData.notas ?? existing.notas ?? '',
        birthday: clientData.birthday ?? existing.birthday ?? '',
      };
    } else {
      // Create new (Import from Google or Manual)
      const cleanId = clientData.id ? clientData.id.replace(/\//g, '_') : doc(collection(db, clientsPath)).id;
      docRef = doc(db, clientsPath, cleanId);
      dataToSave = {
        nombre: clientData.nombre || 'Sin Nombre',
        telefono: cleanPhone,
        email: clientData.email || '',
        id: cleanId,
        genero: 'indefinido',
        status: 'Importado Google',
        tags: clientData.tags || [],
        empresa: clientData.empresa || '',
        cargo: clientData.cargo || '',
        direccion: clientData.direccion || '',
        notas: clientData.notas || '',
        birthday: clientData.birthday || '',
        createdAt: serverTimestamp(),
        ...dataToSave,
      };
    }

    await setDoc(docRef, dataToSave, { merge: true });
    return docRef.id;
  } catch (error) {
    console.error('Error in saveClientFromGoogle:', error);
    throw error;
  }
};

// Maintain alias just in case
export const upsertClient = saveClientFromGoogle;

export const saveWhatsAppMessage = async (chatId: string, msg: any) => {
  try {
    const clientsPath = getClientsPath();
    const cleanId = chatId.replace(/\D/g, '');
    
    // Find client by phone to get the correct document ID
    const client = await isRegisteredClient(cleanId);
    const targetId = client ? client.id : cleanId;
    
    const messageId = msg.id?.id || msg.id || doc(collection(db, 'tmp')).id;
    const msgRef = doc(db, `${clientsPath}/${targetId}/whatsapp_messages`, messageId);
    
    await setDoc(msgRef, {
      body: msg.body || '',
      from: msg.from?._serialized || msg.from,
      to: msg.to?._serialized || msg.to,
      fromMe: !!msg.fromMe,
      timestamp: msg.timestamp || msg.t || Math.floor(Date.now() / 1000),
      type: msg.type || 'chat',
      hasMedia: !!msg.hasMedia || !!msg.mediaData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('[Firebase] Error saving message:', error);
    return false;
  }
};

export const getStoredMessages = async (chatId: string, limitCount = 50) => {
  try {
    const clientsPath = getClientsPath();
    const cleanId = chatId.replace(/\D/g, '');
    const client = await isRegisteredClient(cleanId);
    const targetId = client ? client.id : cleanId;
    
    const msgsRef = collection(db, `${clientsPath}/${targetId}/whatsapp_messages`);
    const q = query(msgsRef); // You might want to order by timestamp but for simplicity now:
    const snapshot = await getDocs(q);
    
    return snapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-limitCount);
  } catch (error) {
    console.error('[Firebase] Error fetching messages:', error);
    return [];
  }
};
