import axios from 'axios';
import { isRegisteredClient, saveWhatsAppMessage, getStoredMessages } from './firebase-server';

// Reuse the globalThis logger so the dashboard's "Monitor de Motor WhatsApp" works!
const globalForWhatsApp = globalThis as unknown as {
  whatsappStatus: {
    isReady: boolean;
    isAuthenticated: boolean;
    isInitializing: boolean;
    qrCodeData: string | null;
    lastError: string | null;
  };
  systemLogs: string[];
  webhookRegistered?: boolean;
};

if (!globalForWhatsApp.systemLogs) {
  globalForWhatsApp.systemLogs = [];
}

const addLog = (msg: string, type: 'info' | 'error' = 'info') => {
  const timestamp = new Date().toLocaleTimeString('es-MX', { hour12: false });
  const prefix = type === 'error' ? '❌ [OPENWA-MIGRADO]' : '🔹 [OPENWA-MIGRADO]';
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

if (!globalForWhatsApp.whatsappStatus) {
  globalForWhatsApp.whatsappStatus = {
    isReady: false,
    isAuthenticated: false,
    isInitializing: false,
    qrCodeData: null,
    lastError: null
  };
}

// Config variables matching .env.local
const baseURL = process.env.OPENWA_URL || 'http://localhost:2785/api';
const apiKey = process.env.OPENWA_API_KEY || 'imperia_secret_token';
const sessionId = process.env.OPENWA_SESSION_ID || 'imperia-session';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-API-Key': apiKey,
});

const registerWebhookIfNeeded = async () => {
  const webhookUrl = `http://localhost:3010/api/webhooks/openwa`;
  try {
    addLog(`Verificando webhooks registrados para la sesión '${sessionId}'...`);
    const res = await axios.get(`${baseURL}/sessions/${sessionId}/webhooks`, {
      headers: getHeaders(),
      timeout: 5000
    });

    const webhooks = res.data;
    const exists = Array.isArray(webhooks) && webhooks.some((w: any) => w.url === webhookUrl);

    if (!exists) {
      addLog(`Webhook '${webhookUrl}' no registrado. Registrándolo ahora...`);
      await axios.post(`${baseURL}/sessions/${sessionId}/webhooks`, {
        url: webhookUrl,
        events: ['message.received', 'session.status'],
        secret: process.env.WEBHOOK_SECRET || '7f5e3e2b9c5a4d1e8c0b2d4e6f8a9b7c',
        retryCount: 3
      }, {
        headers: getHeaders()
      });
      addLog(`Webhook '${webhookUrl}' registrado exitosamente en OpenWA Gateway.`);
    } else {
      addLog(`Webhook '${webhookUrl}' ya está registrado.`);
    }
  } catch (error: any) {
    addLog(`Error al verificar/registrar webhook: ${error.message}`, 'error');
    throw error;
  }
};

export const initializeWhatsApp = async (forceRestart = false) => {
  if (globalForWhatsApp.whatsappStatus.isInitializing && !forceRestart) return;

  globalForWhatsApp.whatsappStatus.isInitializing = true;
  globalForWhatsApp.whatsappStatus.lastError = null;
  addLog('Iniciando sesión en OpenWA Gateway...');

  try {
    // Try to start the session.
    // OpenWA start endpoint: POST /sessions/{sessionId}/start
    addLog(`Enviando POST a ${baseURL}/sessions/${sessionId}/start`);
    const res = await axios.post(`${baseURL}/sessions/${sessionId}/start`, {}, {
      headers: getHeaders(),
      timeout: 10000
    });

    addLog(`Respuesta de inicio de OpenWA: ${JSON.stringify(res.data)}`);
    globalForWhatsApp.whatsappStatus.isInitializing = false;
    
    // Check status immediately
    await checkAndUpdateStatus();
  } catch (error: any) {
    // If session doesn't exist, we try to create it first
    if (error.response?.status === 404 || error.message?.includes('not found')) {
      addLog(`Sesión '${sessionId}' no encontrada. Creándola...`);
      try {
        await axios.post(`${baseURL}/sessions`, { name: sessionId }, { headers: getHeaders() });
        addLog(`Sesión '${sessionId}' creada con éxito. Iniciándola...`);
        
        await axios.post(`${baseURL}/sessions/${sessionId}/start`, {}, { headers: getHeaders() });
        globalForWhatsApp.whatsappStatus.isInitializing = false;
        await checkAndUpdateStatus();
        return;
      } catch (createErr: any) {
        addLog(`Fallo al crear o iniciar sesión: ${createErr.message}`, 'error');
        globalForWhatsApp.whatsappStatus.lastError = createErr.message;
      }
    } else {
      addLog(`Error al conectar con OpenWA: ${error.message}`, 'error');
      globalForWhatsApp.whatsappStatus.lastError = error.message;
    }
    
    globalForWhatsApp.whatsappStatus.isInitializing = false;
  }
};

const checkAndUpdateStatus = async () => {
  try {
    const res = await axios.get(`${baseURL}/sessions/${sessionId}`, {
      headers: getHeaders(),
      timeout: 5000
    });

    const session = res.data;
    // Possible OpenWA session states: 'CONNECTED', 'SCAN_QR', 'STARTING', 'INITIALIZING', 'DISCONNECTED'
    const status = session.status;
    addLog(`Estado de sesión en OpenWA: ${status}`);

    const isConnected = status === 'CONNECTED';
    const isScanQr = status === 'SCAN_QR';
    const isStarting = status === 'STARTING' || status === 'INITIALIZING';

    globalForWhatsApp.whatsappStatus.isReady = isConnected;
    globalForWhatsApp.whatsappStatus.isAuthenticated = isConnected;
    globalForWhatsApp.whatsappStatus.isInitializing = isStarting;
    
    if (isConnected && !globalForWhatsApp.webhookRegistered) {
      registerWebhookIfNeeded().then(() => {
        globalForWhatsApp.webhookRegistered = true;
      }).catch(() => {});
    }

    if (isScanQr) {
      // Fetch the QR code
      try {
        const qrRes = await axios.get(`${baseURL}/sessions/${sessionId}/qr`, {
          headers: getHeaders(),
          timeout: 5000
        });
        globalForWhatsApp.whatsappStatus.qrCodeData = qrRes.data.qr || qrRes.data.qrCodeData || qrRes.data;
        addLog('Código QR obtenido de OpenWA, listo para escanear');
      } catch (qrErr: any) {
        addLog(`Error al obtener QR: ${qrErr.message}`, 'error');
      }
    } else {
      globalForWhatsApp.whatsappStatus.qrCodeData = null;
    }

  } catch (error: any) {
    addLog(`Error al consultar estado en OpenWA: ${error.message}`, 'error');
    globalForWhatsApp.whatsappStatus.isReady = false;
    globalForWhatsApp.whatsappStatus.isAuthenticated = false;
    globalForWhatsApp.whatsappStatus.isInitializing = false;
    globalForWhatsApp.whatsappStatus.qrCodeData = null;
  }
};

export const getWhatsAppStatus = () => {
  // Trigger an async background status update to keep it fresh
  checkAndUpdateStatus().catch(() => {});
  return globalForWhatsApp.whatsappStatus;
};

export const getWhatsAppClient = () => {
  // Return a dummy object with getChatById so debug route doesn't crash
  return {
    getChatById: async (chatId: string) => {
      return {
        name: chatId.split('@')[0],
        isGroup: chatId.includes('@g.us'),
        messages: [] as any[],
        lastMessage: null as any,
        fetchMessages: async (options?: { limit?: number }) => [] as any[]
      };
    },
    searchMessages: async (query: string, options?: { chatId?: string; limit?: number }) => [] as any[]
  };
};

export const sendMessage = async (chatId: string, message: string, mediaBase64?: string) => {
  addLog(`Enviando mensaje a ${chatId}...`);
  
  // Format chatId if needed
  let finalId = chatId;
  if (!finalId.includes('@')) {
    let cleanPhone = finalId.replace(/\D/g, '');
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('52')) {
      cleanPhone = '521' + cleanPhone;
    }
    finalId = `${cleanPhone}@c.us`;
  }

  const phoneId = finalId.split('@')[0];

  try {
    let response;
    if (mediaBase64) {
      addLog(`Mensaje contiene multimedia base64. Subiendo y enviando...`);
      response = await axios.post(`${baseURL}/sessions/${sessionId}/messages/send-file`, {
        chatId: finalId,
        url: mediaBase64,
        caption: message
      }, { headers: getHeaders() });
    } else {
      response = await axios.post(`${baseURL}/sessions/${sessionId}/messages/send-text`, {
        chatId: finalId,
        text: message
      }, { headers: getHeaders() });
    }

    addLog(`Mensaje enviado con éxito a ${finalId}`);

    // Firestore Integration: Save sent message immediately for optimistic UI!
    const msgId = response.data.messageId || response.data.id || `msg_sent_${Date.now()}`;
    const mockMsg = {
      id: { id: msgId },
      body: message,
      from: 'me',
      to: finalId,
      fromMe: true,
      timestamp: Math.floor(Date.now() / 1000),
      type: mediaBase64 ? 'image' : 'chat',
      hasMedia: !!mediaBase64
    };

    // Save to Firestore asynchronously
    saveWhatsAppMessage(finalId, mockMsg)
      .then(() => addLog(`Mensaje saliente guardado en Firestore para ${phoneId}`))
      .catch((err) => addLog(`Error al guardar mensaje en Firestore: ${err.message}`, 'error'));

    return {
      id: { id: msgId }
    };
  } catch (error: any) {
    addLog(`Error al enviar mensaje vía OpenWA: ${error.message}`, 'error');
    throw new Error(error.response?.data?.error || error.message || 'Error al enviar mensaje');
  }
};

export const getRecentChats = async (limit = 20) => {
  addLog('Obteniendo chats recientes...');
  try {
    const res = await axios.get(`${baseURL}/sessions/${sessionId}/chats`, {
      headers: getHeaders(),
      timeout: 5000
    });

    const chats = res.data;
    if (Array.isArray(chats)) {
      return chats.slice(0, limit).map((c: any) => ({
        id: c.id || c.chatId || c.jid,
        name: c.name || c.pushname || c.id?.split('@')[0] || 'Sin Nombre',
        timestamp: c.timestamp || Math.floor(Date.now() / 1000),
        unreadCount: c.unreadCount || 0,
        lastMessage: c.lastMessage?.body || c.lastMessage || '',
        avatar: c.avatar || ''
      }));
    }
  } catch (error: any) {
    addLog(`Fallo al consultar chats desde OpenWA: ${error.message}. Usando Firestore.`, 'error');
  }
  return [];
};

export const getChatMessages = async (chatId: string, days = 2, limit = 100) => {
  addLog(`Obteniendo historial de Firestore para ${chatId}`);
  try {
    const messages = await getStoredMessages(chatId, limit);
    addLog(`Historial recuperado con éxito de Firestore: ${messages.length} mensajes.`);
    return messages;
  } catch (error: any) {
    addLog(`Error al recuperar mensajes de Firestore: ${error.message}`, 'error');
    return [];
  }
};

export const getScreenshot = async () => {
  return null;
};
