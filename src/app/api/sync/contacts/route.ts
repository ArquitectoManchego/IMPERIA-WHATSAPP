import { NextResponse } from 'next/server';
import { readGoogleContacts } from '@/lib/google-sync';
import { saveClientFromGoogle } from '@/lib/firebase-server';
import { runWorker } from '@/lib/crm-worker';
export async function GET() {
  try { return NextResponse.json((await readGoogleContacts()).map(c => ({ id:c.resourceName, nombre:c.names?.[0]?.displayName || 'Sin nombre', telefono:c.phoneNumbers?.[0]?.value || '', email:c.emailAddresses?.[0]?.value || '', source:'google' }))); }
  catch (error:any) { return NextResponse.json({error:error.message},{status:503}); }
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === 'push') { const result = await runWorker(); return NextResponse.json({ success:true, message:'Sincronización procesada; consulta los errores por contacto.', ...result }); }
    if (body.action === 'import') { for(const contact of (body.contacts || []).slice(0,1000)) await saveClientFromGoogle(contact); return NextResponse.json({success:true,message:'Contactos importados'}); }
    if (body.action === 'bulk-edit') { for (const contact of (body.selectedContacts || []).slice(0,1000)) await saveClientFromGoogle({...contact,tags:[...new Set([...(contact.tags || []),...(body.tagsToAdd || [])])].filter(t=>!(body.tagsToRemove || []).includes(t))}); return NextResponse.json({success:true,message:'Contactos actualizados'}); }
    return NextResponse.json({error:'Acción inválida'},{status:400});
  } catch(error:any) { return NextResponse.json({error:error.message},{status:503}); }
}
