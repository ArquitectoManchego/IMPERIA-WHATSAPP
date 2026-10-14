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
    mode?: 'local' | 'remote';
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

  const isVercel = process.env.VERCEL === '1';
  const isLocalhost = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');

  if (isVercel && isLocalhost) {
    globalForWhatsApp.whatsappStatus.isInitializing = false;
    globalForWhatsApp.whatsappStatus.lastError =
      'Gateway no conectado en la nube. Para usar WhatsApp desde Vercel, configura OPENWA_URL en las variables de entorno de Vercel con la URL pública de tu Gateway (ej. túnel Cloudflare/ngrok) o accede localmente en http://localhost:3010.';
    addLog(globalForWhatsApp.whatsappStatus.lastError, 'error');
    return;
  }

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
        if (createErr.response?.status === 409 || createErr.message?.includes('already exists')) {
          addLog(`La sesión '${sessionId}' ya existe en OpenWA. Continuando...`);
          globalForWhatsApp.whatsappStatus.isInitializing = false;
          await checkAndUpdateStatus();
          return;
        }
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
    const status = (session?.status || '').toLowerCase();
    addLog(`Estado de sesión en OpenWA: ${status}`);

    const isConnected = status === 'ready' || status === 'connected';
    const isScanQr = status === 'qr_ready' || status === 'scan_qr';
    const isStarting = status === 'starting' || status === 'initializing' || status === 'authenticating' || status === 'created';

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
        const qr = qrRes.data?.qrCode || qrRes.data?.qr || qrRes.data?.qrCodeData || (typeof qrRes.data === 'string' ? qrRes.data : null);
        globalForWhatsApp.whatsappStatus.qrCodeData = qr;
        addLog('Código QR obtenido de OpenWA, listo para escanear');
      } catch (qrErr: any) {
        addLog(`Error al obtener QR: ${qrErr.message}`, 'error');
      }
    } else {
      globalForWhatsApp.whatsappStatus.qrCodeData = null;
    }

  } catch (error: any) {
    const isVercel = process.env.VERCEL === '1';
    const isLocalhost = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');

    if (isVercel && isLocalhost) {
      globalForWhatsApp.whatsappStatus.lastError =
        'Gateway no conectado en la nube. Configura OPENWA_URL en Vercel con la URL pública de tu Gateway, o utiliza la app local en http://localhost:3010.';
    } else {
      addLog(`Error al consultar estado en OpenWA: ${error.message}`, 'error');
      globalForWhatsApp.whatsappStatus.lastError = error.message;
    }

    globalForWhatsApp.whatsappStatus.isReady = false;
    globalForWhatsApp.whatsappStatus.isAuthenticated = false;
    globalForWhatsApp.whatsappStatus.isInitializing = false;
    globalForWhatsApp.whatsappStatus.qrCodeData = null;
  }
};

export const getWhatsAppStatus = async () => {
  await checkAndUpdateStatus().catch(() => {});
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

const recentSends = new Map<string, { time: number; result: any }>();

export const sendMessage = async (
  chatId: string, 
  message: string, 
  mediaBase64?: string, 
  fallbackPhone?: string,
  options?: { isSticker?: boolean; isGif?: boolean }
) => {
  addLog(`Enviando mensaje a ${chatId}...`);
  
  const debounceKey = `${chatId}:${(message || '').trim()}:${options?.isSticker ? 'sticker' : (options?.isGif ? 'gif' : (mediaBase64 ? 'media' : 'text'))}:${mediaBase64 ? mediaBase64.slice(-30) : ''}`;
  const now = Date.now();
  const cachedSend = recentSends.get(debounceKey);
  if (cachedSend && (now - cachedSend.time) < 3000) {
    addLog(`Mensaje idéntico detectado a ${chatId} en menos de 3s. Evitando envío duplicado.`);
    return cachedSend.result;
  }

  const formatId = (id: string) => {
    let clean = (id || '').trim();
    if (!clean.includes('@')) {
      let digits = clean.replace(/\D/g, '');
      if (digits.length === 10 && !digits.startsWith('52')) {
        digits = '521' + digits;
      }
      return `${digits}@c.us`;
    }
    return clean;
  };

  let finalId = formatId(chatId);
  const phoneId = finalId.split('@')[0];

  const doSend = async (target: string) => {
    if (mediaBase64) {
      addLog(`Mensaje contiene archivo multimedia para ${target}...`);

      const isHttpUrl = mediaBase64.startsWith('http://') || mediaBase64.startsWith('https://');
      if (isHttpUrl) {
        const endpoint = options?.isSticker ? 'send-sticker' : (options?.isGif ? 'send-video' : 'send-image');
        return await axios.post(
          `${baseURL}/sessions/${sessionId}/messages/${endpoint}`,
          {
            chatId: target,
            url: mediaBase64,
            caption: options?.isSticker ? undefined : (message || undefined)
          },
          { headers: getHeaders(), timeout: 30000 }
        );
      }

      // Extract mimetype and raw clean base64 data
      const mimeMatch = mediaBase64.match(/^data:([^;]+);base64,/);
      const mimetype = mimeMatch ? mimeMatch[1] : (options?.isSticker ? 'image/webp' : 'image/jpeg');
      const cleanBase64 = mediaBase64.replace(/^data:[^;]+;base64,/, '');

      let endpoint = 'send-image';
      let extension = 'jpg';

      if (options?.isSticker) {
        endpoint = 'send-sticker';
        extension = 'webp';
      } else if (options?.isGif || mimetype.includes('gif')) {
        endpoint = 'send-video';
        extension = mimetype.split('/')[1] || 'mp4';
      } else if (mimetype.startsWith('video/')) {
        endpoint = 'send-video';
        extension = mimetype.split('/')[1] || 'mp4';
      } else if (mimetype.startsWith('audio/')) {
        endpoint = 'send-audio';
        extension = mimetype.split('/')[1] || 'mp3';
      } else if (mimetype.startsWith('image/')) {
        endpoint = 'send-image';
        extension = mimetype.split('/')[1] || 'jpg';
      } else {
        endpoint = 'send-document';
        extension = 'bin';
      }

      const payload = {
        chatId: target,
        base64: cleanBase64,
        mimetype,
        caption: options?.isSticker ? undefined : (message || undefined),
        filename: `attachment_${Date.now()}.${extension}`
      };

      addLog(`Enviando ${endpoint} (${mimetype}) a ${target}...`);
      return await axios.post(
        `${baseURL}/sessions/${sessionId}/messages/${endpoint}`,
        payload,
        { headers: getHeaders(), timeout: 30000 }
      );
    } else {
      addLog(`Enviando texto a ${target}...`);
      return await axios.post(
        `${baseURL}/sessions/${sessionId}/messages/send-text`,
        {
          chatId: target,
          text: message
        },
        { headers: getHeaders(), timeout: 15000 }
      );
    }
  };

  try {
    let response;
    try {
      response = await doSend(finalId);
    } catch (primaryErr: any) {
      if (fallbackPhone && fallbackPhone !== chatId) {
        const fallbackId = formatId(fallbackPhone);
        addLog(`Envío primario a ${finalId} falló: ${primaryErr.message}. Reintentando con fallback: ${fallbackId}...`);
        response = await doSend(fallbackId);
        finalId = fallbackId;
      } else {
        throw primaryErr;
      }
    }

    addLog(`Mensaje enviado con éxito a ${finalId}`);

    const msgId = response.data.messageId || response.data.id || `msg_sent_${Date.now()}`;
    const resultObj = { id: { id: msgId } };
    recentSends.set(debounceKey, { time: Date.now(), result: resultObj });

    // Clean old entries
    if (recentSends.size > 100) {
      const cutoff = Date.now() - 10000;
      for (const [k, v] of recentSends.entries()) {
        if (v.time < cutoff) recentSends.delete(k);
      }
    }

    const mockMsg = {
      id: msgId,
      body: message,
      from: 'me',
      to: finalId,
      fromMe: true,
      timestamp: Math.floor(Date.now() / 1000),
      type: options?.isSticker ? 'sticker' : (options?.isGif ? 'video' : (mediaBase64 ? 'image' : 'chat')),
      hasMedia: !!mediaBase64,
      mediaUrl: mediaBase64,
      isSticker: !!options?.isSticker,
      isGif: !!options?.isGif
    };

    // Update in-memory cache for all associated identifiers
    if (!globalCache.messageCache) globalCache.messageCache = {};
    const targets = new Set([chatId, finalId, fallbackPhone].filter(Boolean) as string[]);
    targets.forEach(t => {
      if (!globalCache.messageCache![t]) globalCache.messageCache![t] = [];
      const list = globalCache.messageCache![t];
      if (!list.some((m: any) => (m.id?._serialized || m.id?.id || m.id) === msgId)) {
        list.push(mockMsg);
      }
    });

    saveWhatsAppMessage(finalId, mockMsg).catch(() => {});

    return resultObj;
  } catch (error: any) {
    addLog(`Error al enviar mensaje vía OpenWA: ${error.message}`, 'error');
    throw new Error(error.response?.data?.error || error.message || 'Error al enviar mensaje');
  }
};

// In-memory cache & sync status
const globalCache = globalThis as unknown as {
  messageCache?: Record<string, any[]>;
  syncedChats?: any[];
  syncStatus?: {
    inProgress: boolean;
    progress: number;
    total: number;
    currentChat: string;
    lastSyncTime: number | null;
    totalMessagesSynced: number;
    error: string | null;
  };
};

if (!globalCache.messageCache) globalCache.messageCache = {};
if (!globalCache.syncedChats) globalCache.syncedChats = [];
if (!globalCache.syncStatus) {
  globalCache.syncStatus = {
    inProgress: false,
    progress: 0,
    total: 0,
    currentChat: '',
    lastSyncTime: null,
    totalMessagesSynced: 0,
    error: null,
  };
}

export const getRecentChats = async (limit = 200) => {
  addLog(`Obteniendo chats recientes (límite: ${limit})...`);
  try {
    const res = await axios.get(`${baseURL}/sessions/${sessionId}/chats`, {
      headers: getHeaders(),
      timeout: 10000
    });

    const chats = res.data;
    if (Array.isArray(chats)) {
      const mapped = chats.slice(0, limit).map((c: any) => ({
        id: c.id || c.chatId || c.jid,
        name: c.name || c.pushname || c.id?.split('@')[0] || 'Sin Nombre',
        phone: c.phone || (c.id?.endsWith('@c.us') ? c.id.split('@')[0] : c.id?.split('@')[0]),
        timestamp: c.timestamp || Math.floor(Date.now() / 1000),
        unreadCount: c.unreadCount || 0,
        lastMessage: c.lastMessage?.body || c.lastMessage || '',
        avatar: c.avatar || ''
      }));
      globalCache.syncedChats = mapped;
      return mapped;
    }
  } catch (error: any) {
    addLog(`Fallo al consultar chats desde OpenWA: ${error.message}. Usando caché.`, 'error');
  }
  return globalCache.syncedChats || [];
};

export const getChatMessages = async (chatId: string, days = 2, limit = 100) => {
  addLog(`Consultando mensajes para ${chatId} (límite: ${limit})...`);

  // 1. Fetch directly from OpenWA Gateway for fresh/live messages
  try {
    const gatewayRes = await axios.get(
      `${baseURL}/sessions/${sessionId}/history?chatId=${encodeURIComponent(chatId)}&limit=${limit}`,
      { headers: getHeaders(), timeout: 8000 }
    );

    if (Array.isArray(gatewayRes.data) && gatewayRes.data.length > 0) {
      const liveMessages = gatewayRes.data.map((m: any) => ({
        id: m.id,
        body: m.body || '',
        from: m.from,
        to: m.to,
        fromMe: Boolean(m.fromMe),
        timestamp: Number(m.timestamp || Math.floor(Date.now() / 1000)),
        type: m.type || 'chat',
        hasMedia: Boolean(m.hasMedia)
      })).sort((a: any, b: any) => a.timestamp - b.timestamp);

      if (!globalCache.messageCache) globalCache.messageCache = {};
      globalCache.messageCache[chatId] = liveMessages;

      // Save to Firestore asynchronously
      liveMessages.forEach((msg: any) => {
        saveWhatsAppMessage(chatId, msg).catch(() => {});
      });

      return liveMessages;
    }
  } catch (gwErr: any) {
    addLog(`Consulta a OpenWA Gateway para ${chatId} falló: ${gwErr.message}. Usando caché.`, 'error');
  }

  // 2. Fallback to in-memory cache if available
  if (globalCache.messageCache?.[chatId]?.length) {
    return globalCache.messageCache[chatId].slice(-limit);
  }

  // 3. Fallback to Firestore stored messages
  try {
    const messages = await getStoredMessages(chatId, limit);
    if (messages.length > 0) {
      if (!globalCache.messageCache) globalCache.messageCache = {};
      globalCache.messageCache[chatId] = messages;
      return messages;
    }
  } catch (error: any) {
    addLog(`Error al recuperar mensajes de Firestore: ${error.message}`, 'error');
  }

  return [];
};

export const syncRecentHistory = async (months = 2, minMessages = 50) => {
  if (globalCache.syncStatus?.inProgress) {
    return {
      status: 'in_progress',
      message: 'Sincronización en curso',
      ...globalCache.syncStatus
    };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const twoMonthsAgoSec = nowSec - (months * 30 * 24 * 3600);

  globalCache.syncStatus = {
    inProgress: true,
    progress: 0,
    total: 0,
    currentChat: 'Obteniendo lista de chats...',
    lastSyncTime: null,
    totalMessagesSynced: 0,
    error: null,
  };

  addLog(`Iniciando sincronización masiva de los últimos ${months} meses (>= ${minMessages} msgs/contacto)...`);

  try {
    const chats = await getRecentChats(500);
    const qualifying = chats.filter((c: any) => c.timestamp >= twoMonthsAgoSec);

    globalCache.syncStatus.total = qualifying.length;
    addLog(`Se encontraron ${qualifying.length} contactos con actividad en los últimos ${months} meses.`);

    let totalMsgs = 0;
    const syncedData: any[] = [];

    for (let i = 0; i < qualifying.length; i++) {
      const chat = qualifying[i];
      globalCache.syncStatus.progress = i + 1;
      globalCache.syncStatus.currentChat = chat.name || chat.phone || chat.id;

      try {
        const res = await axios.get(
          `${baseURL}/sessions/${sessionId}/history?chatId=${encodeURIComponent(chat.id)}&limit=${minMessages}`,
          { headers: getHeaders(), timeout: 10000 }
        );

        const msgs = Array.isArray(res.data) ? res.data : [];
        if (!globalCache.messageCache) globalCache.messageCache = {};
        globalCache.messageCache[chat.id] = msgs;
        totalMsgs += msgs.length;

        syncedData.push({
          chatId: chat.id,
          name: chat.name,
          phone: chat.phone,
          lastActivity: chat.timestamp,
          messageCount: msgs.length,
          messages: msgs
        });

        // Background write to Firestore (throttled/non-blocking)
        msgs.forEach((m: any) => {
          saveWhatsAppMessage(chat.id, m).catch(() => {});
        });

      } catch (chatErr: any) {
        addLog(`Error al sincronizar chat ${chat.id}: ${chatErr.message}`, 'error');
      }

      // Small 15ms pause between chats to ensure smooth async I/O
      await new Promise(r => setTimeout(r, 15));
    }

    globalCache.syncStatus.inProgress = false;
    globalCache.syncStatus.lastSyncTime = Date.now();
    globalCache.syncStatus.totalMessagesSynced = totalMsgs;
    globalCache.syncStatus.currentChat = 'Completado';

    addLog(`✅ Sincronización completada: ${qualifying.length} contactos y ${totalMsgs} mensajes descargados.`);

    return {
      success: true,
      totalContacts: qualifying.length,
      totalMessages: totalMsgs,
      syncedAt: new Date().toISOString(),
      contacts: syncedData.map(c => ({
        chatId: c.chatId,
        name: c.name,
        phone: c.phone,
        messageCount: c.messageCount
      }))
    };
  } catch (error: any) {
    globalCache.syncStatus.inProgress = false;
    globalCache.syncStatus.error = error.message;
    addLog(`❌ Error en sincronización masiva: ${error.message}`, 'error');
    throw error;
  }
};

export const getSyncStatus = () => {
  return globalCache.syncStatus || { inProgress: false, progress: 0, total: 0 };
};

export const getAllSyncedData = () => {
  const chats = globalCache.syncedChats || [];
  return chats.map(c => ({
    chatId: c.id,
    name: c.name,
    phone: c.phone,
    timestamp: c.timestamp,
    messages: globalCache.messageCache?.[c.id] || []
  }));
};

export const getScreenshot = async () => {
  return null;
};

export const downloadMedia = async (messageId: string): Promise<{ data: string; mimetype: string }> => {
  const res = await axios.get(`${baseURL}/sessions/${sessionId}/media/${encodeURIComponent(messageId)}`, {
    headers: getHeaders(),
    timeout: 30000,
  });
  return res.data;
};

export const chatIdentifier = (chatId: string) => {
  if (!chatId) return '';
  if (chatId.includes('@')) return chatId;
  const digits = chatId.replace(/\D/g, '');
  if (digits.length === 10 && !digits.startsWith('52')) {
    return `521${digits}@c.us`;
  }
  return `${digits}@c.us`;
};
