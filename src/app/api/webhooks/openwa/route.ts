import { NextRequest, NextResponse } from 'next/server';
import { isRegisteredClient, saveWhatsAppMessage, saveClientFromGoogle } from '@/lib/firebase-server';

const addLog = (msg: string, type: 'info' | 'error' = 'info') => {
  const globalForWhatsApp = globalThis as unknown as { systemLogs: string[] };
  if (!globalForWhatsApp.systemLogs) globalForWhatsApp.systemLogs = [];
  
  const timestamp = new Date().toLocaleTimeString('es-MX', { hour12: false });
  const prefix = type === 'error' ? '❌ [WEBHOOK]' : '🔹 [WEBHOOK]';
  const logEntry = `[${timestamp}] ${prefix} ${msg}`;
  
  globalForWhatsApp.systemLogs.push(logEntry);
  if (globalForWhatsApp.systemLogs.length > 100) {
    globalForWhatsApp.systemLogs.shift();
  }
  
  if (type === 'error') {
    console.error(`${prefix} ${msg}`);
  } else {
    process.stdout.write(`${prefix} ${msg}\n`);
  }
};

export async function POST(req: NextRequest) {
  try {
    // 1. Authorization
    const authHeader = req.headers.get('x-api-key') || req.headers.get('authorization');
    const secret = process.env.WEBHOOK_SECRET || '7f5e3e2b9c5a4d1e8c0b2d4e6f8a9b7c';
    
    if (authHeader !== secret) {
      addLog('Acceso denegado: Firma / Secret no válido.', 'error');
      return NextResponse.json({ error: 'Acceso Denegado' }, { status: 401 });
    }

    const body = await req.json();
    const { event, payload } = body;
    
    addLog(`Evento recibido de OpenWA: '${event}'`);

    // 2. Process message.received event
    if (event === 'message.received') {
      const { from, text, timestamp, messageId, hasMedia, mediaUrl } = payload;
      
      if (!from) {
        addLog('Error: El remitente (from) está vacío en el payload.', 'error');
        return NextResponse.json({ error: 'Remitente requerido' }, { status: 400 });
      }

      // OpenWA from standard format is "5215555555555@c.us"
      const phoneId = from.split('@')[0];
      addLog(`Mensaje de: ${phoneId} | Texto: ${text ? text.substring(0, 30) + '...' : '[Multimedia]'}`);

      // A. Sync Google Contacts / Lead Ingestion
      const existingClient = await isRegisteredClient(phoneId);
      if (!existingClient) {
        addLog(`Lead nuevo detectado (${phoneId}). Creando en Firestore...`);
        try {
          await saveClientFromGoogle({
            nombre: `Lead OpenWA ${phoneId}`,
            telefono: phoneId,
            tags: ['OpenWA Lead'],
            notas: 'Registrado automáticamente vía Webhook de OpenWA Gateway.'
          });
          addLog(`Lead creado con éxito para el teléfono ${phoneId}`);
        } catch (dbErr: any) {
          addLog(`Error al auto-registrar lead en Firestore: ${dbErr.message}`, 'error');
        }
      } else {
        addLog(`Cliente ya registrado: ${existingClient.nombre || 'Sin Nombre'}`);
      }

      // B. Save Message to Firestore Subcollection
      const msgData = {
        id: { id: messageId || `msg_${Date.now()}` },
        body: text || '',
        from: from,
        to: 'me',
        fromMe: false,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        type: hasMedia ? 'image' : 'chat',
        hasMedia: !!hasMedia
      };

      try {
        await saveWhatsAppMessage(from, msgData);
        addLog(`Mensaje de ${phoneId} guardado con éxito en Firestore.`);
      } catch (dbErr: any) {
        addLog(`Error al guardar mensaje en Firestore: ${dbErr.message}`, 'error');
      }

      return NextResponse.json({ success: true, message: 'Mensaje procesado' });
    }

    return NextResponse.json({ success: true, message: 'Evento ignorado de forma segura' });
  } catch (error: any) {
    addLog(`Error crítico en Webhook handler: ${error.message}`, 'error');
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
