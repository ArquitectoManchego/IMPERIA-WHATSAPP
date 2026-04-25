import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchGoogleContacts, createGoogleContact } from '@/lib/google-contacts';
import { getClients, saveClientFromGoogle } from '@/lib/firebase-server';

export async function GET() {
  const session: any = await getServerSession(authOptions);
  
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contacts = await fetchGoogleContacts(session.accessToken);
    
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
  const session: any = await getServerSession(authOptions);
  const body = await request.json();
  const { action, contacts, clients } = body;

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (action === 'bulk-edit') {
      const { selectedContacts, tagsToAdd, tagsToRemove } = body;
      const results = [];

      for (const contact of selectedContacts) {
        try {
          const currentTags = contact.tags || [];
          let newTags = [...currentTags];

          tagsToAdd.forEach((tag: string) => {
            if (!newTags.includes(tag)) newTags.push(tag);
          });

          newTags = newTags.filter((tag: string) => !tagsToRemove.includes(tag));

          // Use the restored name (which now has the new logic)
          await saveClientFromGoogle({
            ...contact,
            tags: newTags
          });
          results.push({ id: contact.id, success: true });
        } catch (err) {
          results.push({ id: contact.id, success: false, error: err });
        }
      }
      
      return NextResponse.json({ success: true, message: `Se actualizaron ${results.filter(r => r.success).length} contactos.` });
    }

    if (action === 'import') {
      // Selective Import (Google -> Taylor)
      for (const contact of contacts) {
        await saveClientFromGoogle(contact);
      }
      return NextResponse.json({ success: true, message: `${contacts.length} contactos importados.` });
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
