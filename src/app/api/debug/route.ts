import { NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

export async function GET() {
  const PROJECT_ID = firebaseConfig.projectId;
  const paths = [
    `artifacts/${PROJECT_ID}/public/data/clients`,
    `artifacts/${PROJECT_ID}/public/data/clientes`,
    'clients',
    'clientes',
    'data/clients'
  ];
  
  const results: any = {};

  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);

    for (const p of paths) {
      try {
        const ref = collection(db, p);
        const snap = await getDocs(ref);
        results[p] = snap.size;
      } catch (e: any) {
        results[p] = "Error: " + e.message;
      }
    }
    
    return NextResponse.json({
      projectId: PROJECT_ID,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, results }, { status: 500 });
  }
}
