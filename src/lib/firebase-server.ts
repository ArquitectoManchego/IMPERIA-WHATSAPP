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
