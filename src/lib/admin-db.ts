import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function database() {
  const name = 'imperia-crm-server';
  const existing = getApps().find(app => app.name === name);
  const app = existing || initializeApp({
    credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) : applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  }, name);
  return getFirestore(app);
}
export function legacyPath() {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!project) throw new Error('Falta NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  return `artifacts/${project}/public/data/clients`;
}
// Separate server-only namespace: existing order documents are never rewritten.
export const crmPath = 'imperiaCrm/main';
