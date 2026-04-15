import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize for server-side use if dynamic variables are missing
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const PROJECT_ID = firebaseConfig.projectId;
const CLIENTS_PATH = `artifacts/${PROJECT_ID}/public/data/clients`;

export const getClients = async () => {
  console.log('[FirebaseServer] Project ID:', firebaseConfig.projectId);
  console.log('[FirebaseServer] Fetching from path:', CLIENTS_PATH);
  try {
    const clientsRef = collection(db, CLIENTS_PATH);
    const querySnapshot = await getDocs(clientsRef);
    console.log('[FirebaseServer] Documents found:', querySnapshot.size);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Aggregate note numbers: nota_id + any numero_nota in abonos
      const noteNumbers = new Set<string>();
      if (data.nota_id) noteNumbers.add(data.nota_id);
      if (Array.isArray(data.abonos)) {
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
    const clientsRef = collection(db, CLIENTS_PATH);
    
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

export const saveClientFromGoogle = async (clientData: any) => {
  try {
    const cleanPhone = clientData.telefono.replace(/\D/g, '');
    if (!cleanPhone) throw new Error('Phone number is required');

    // Check if exists
    const existing = await isRegisteredClient(cleanPhone);
    const clientsRef = collection(db, CLIENTS_PATH);

    if (existing && existing.id) {
      const docRef = doc(db, CLIENTS_PATH, existing.id);
      await setDoc(docRef, {
        ...existing,
        nombre: clientData.nombre || existing.nombre,
        email: clientData.email || existing.email || '',
        status: existing.status === 'Importado Google' ? 'Importado Google' : existing.status,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return existing.id;
    }

    const newDocRef = doc(clientsRef);
    const id = newDocRef.id;

    const dataToSave = {
      nombre: clientData.nombre,
      telefono: cleanPhone,
      email: clientData.email || '',
      id,
      genero: 'indefinido',
      status: 'Importado Google',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    await setDoc(newDocRef, dataToSave);
    return id;
  } catch (error) {
    console.error('Error saving client from Google:', error);
    throw error;
  }
};
