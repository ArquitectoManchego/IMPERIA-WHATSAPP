import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { fetchGoogleContacts, createGoogleContact } from '@/lib/google-contacts';
import { getClients, saveClientFromGoogle } from '@/lib/firebase-server';

export async function GET() {
  const session: any = await getServerSession();
  console.log('[SyncAPI] GET Request. Session authenticated:', !!session);
  if (session) {
    console.log('[SyncAPI] Scopes returned:', session.scope);
  }

  if (!session || !session.accessToken) {
    console.log('[SyncAPI] Error: Unauthorized (No Google Session)');
    return NextResponse.json({ error: 'Unauthorized (No Google Session)' }, { status: 401 });
  }

  try {
    console.log('[SyncAPI] Token present:', !!session.accessToken);
    const contacts = await fetchGoogleContacts(session.accessToken);
    console.log(`[SyncAPI] Raw Google connections found: ${contacts?.length || 0}`);
    console.log(`[SyncAPI] Raw Google connections: ${contacts.length}`);
    
    // Map Google contacts to a simpler format for the UI
    const mapped = contacts.map((c: any) => ({
      id: c.resourceName,
      nombre: c.names?.[0]?.displayName || 'Sin Nombre',
      telefono: c.phoneNumbers?.[0]?.value || 'Sin Teléfono',
      email: c.emailAddresses?.[0]?.value || '',
      source: 'google'
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('Error in Sync API GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session: any = await getServerSession();
  const { action, contacts, clients } = await request.json();

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (action === 'import') {
      // Selective Import (Google -> Taylor)
      for (const contact of contacts) {
        await saveClientFromGoogle(contact);
      }
      return NextResponse.json({ success: true, message: `${contacts.length} contactos importados a Taylor.` });
    }

    if (action === 'push') {
      // Automatic Push (Taylor -> Google)
      const taylorClients = await getClients();
      for (const client of taylorClients) {
        await createGoogleContact(session.accessToken, client);
      }
      return NextResponse.json({ success: true, message: 'Base de datos de Taylor sincronizada con Google Contacts.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in Sync API POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
