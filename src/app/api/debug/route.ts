import { getClients } from '@/lib/firebase-server';
import { firebaseConfig } from '@/firebase/config';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const PROJECT_ID = firebaseConfig.projectId;
  const CLIENTS_PATH = `artifacts/${PROJECT_ID}/public/data/clients`;
  
  const debugInfo = {
    projectId: PROJECT_ID,
    path: CLIENTS_PATH,
    envProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    timestamp: new Date().toISOString()
  };

  try {
    const clients = await getClients();
    const result = {
      ...debugInfo,
      count: clients.length,
      sample: clients.slice(0, 1)
    };
    
    // Write results to a file for the agent to read
    fs.writeFileSync(path.join(process.cwd(), 'debug_results.json'), JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);
  } catch (error: any) {
    const errResult = {
      ...debugInfo,
      error: error.message
    };
    fs.writeFileSync(path.join(process.cwd(), 'debug_results.json'), JSON.stringify(errResult, null, 2));
    return NextResponse.json(errResult, { status: 500 });
  }
}
