import { existsSync,readFileSync } from 'node:fs';
const required=['NEXT_PUBLIC_FIREBASE_PROJECT_ID','NEXTAUTH_URL','NEXTAUTH_SECRET','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_CONTACTS_OWNER_EMAIL','CRM_ALLOWED_EMAILS','OPENWA_API_KEY','WEBHOOK_SECRET','CRM_WORKER_SECRET'];
const missing=required.filter(key=>!process.env[key]);
if(!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS))) missing.push('GOOGLE_APPLICATION_CREDENTIALS (archivo existente)');
if(missing.length){console.error('Configuración pendiente:\n'+missing.map(key=>' - '+key).join('\n'));process.exitCode=1;}
else console.log('Variables obligatorias presentes. Aún debes verificar OAuth, permisos Firestore, reglas publicadas y conexión del gateway.');
console.log('Avisos automáticos: '+(process.env.CRM_AUTOMATIONS_ENABLED==='true'?'habilitados (requieren consentimiento individual)':'desactivados'));
