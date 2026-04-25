import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { isRegisteredClient } from './firebase-server';

// Use globalThis to persist the client across hot reloads in Next.js dev mode
const globalForWhatsApp = globalThis as unknown as {
  whatsappClient: Client | null;
  whatsappStatus: {
    isReady: boolean;
    isAuthenticated: boolean;
    isInitializing: boolean;
    qrCodeData: string | null;
    lastError: string | null;
  };
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

let client: Client | null = globalForWhatsApp.whatsappClient || null;
let { isReady, isAuthenticated, isInitializing, qrCodeData, lastError } = globalForWhatsApp.whatsappStatus;

const updateGlobalStatus = () => {
  globalForWhatsApp.whatsappStatus = { isReady, isAuthenticated, isInitializing, qrCodeData, lastError };
  if (client) globalForWhatsApp.whatsappClient = client;
};

const killOrphanSessions = async () => {
  if (process.platform !== 'win32') return;
  console.log('Cleaning up orphan WhatsApp browser processes...');
  const { exec } = await import('child_process');
  return new Promise((resolve) => {
    // Kill any chrome process that has our session path in its command line
    const cmd = `powershell "Get-CimInstance Win32_Process -Filter \\"Name = 'chrome.exe'\\" | Where-Object { $_.CommandLine -like '*imperia-wa-crm-v4*' } | ForEach-Object { Stop-Process $_.ProcessId -Force -ErrorAction SilentlyContinue }"`;
    exec(cmd, (error) => {
      if (error) console.log('No orphan processes found or error during cleanup');
      resolve(true);
    });
  });
};

export const initializeWhatsApp = async (forceRestart = false) => {
  if (forceRestart && client) {
    console.log('Force restarting WhatsApp client...');
    try {
      await client.destroy();
      // Give the OS time to release file locks
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error('Error destroying client:', e);
    }
    client = null;
    isReady = false;
    qrCodeData = null;
    isInitializing = false;
  }

  if (client || isInitializing) return;

  isInitializing = true;
  lastError = null;
  console.log('Initializing WhatsApp Client...');

  // Ensure no old processes are locking the folder
  await killOrphanSessions();

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: 'imperia-wa-crm-v4',
      dataPath: process.env.VERCEL ? '/tmp/.wwebjs_auth' : './.wwebjs_auth'
    }),
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1018905202-alpha'
    },
    puppeteer: {
      headless: true,
      handleSIGINT: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--safebrowsing-disable-auto-update',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list'
      ]
    }
  });

  client.on('qr', async (qr) => {
    console.log('WhatsApp QR Code received');
    try {
      qrCodeData = await qrcode.toDataURL(qr);
      isInitializing = false;
      updateGlobalStatus();
    } catch (err) {
      console.error('Error generating QR data URL', err);
      lastError = 'Error generating QR code image';
      updateGlobalStatus();
    }
  });

  client.on('authenticated', () => {
    console.log('WhatsApp AUTHENTICATED');
    qrCodeData = null;
    isAuthenticated = true;
    isInitializing = false;
    updateGlobalStatus();
  });

  client.on('ready', () => {
    console.log('WhatsApp Client is READY');
    isReady = true;
    isAuthenticated = true;
    isInitializing = false;
    qrCodeData = null;
    updateGlobalStatus();
  });

  client.on('auth_failure', (msg) => {
    console.error('WhatsApp Auth Failure:', msg);
    lastError = `Fallo de autenticación: ${msg}`;
    isInitializing = false;
    qrCodeData = null;
    updateGlobalStatus();
  });

  client.on('disconnected', (reason) => {
    console.log('WhatsApp Client was DISCONNECTED:', reason);
    isReady = false;
    isInitializing = false;
    isAuthenticated = false;
    updateGlobalStatus();
  });

  client.on('message', async (message) => {
    const from = message.from;
    const body = message.body;

    console.log(`Checking registration for: ${from}`);
    const clientData = await isRegisteredClient(from);

    if (clientData) {
      console.log(`✅ Message from REGISTERED client (${clientData.name || 'Sin nombre'}): ${body}`);
      // Implementation of CRM logic will follow
    } else {
      console.log(`❌ Ignoring message from unknown number: ${from}`);
    }
  });

  try {
    // Add a timeout to initialization to avoid hanging forever
    const initTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tiempo de espera agotado al iniciar el navegador')), 45000)
    );

    await Promise.race([client.initialize(), initTimeout]);
  } catch (err: any) {
    console.error('Failed to initialize WhatsApp client:', err);
    lastError = `Error de inicio: ${err.message || 'Fallo desconocido'}`;
    isInitializing = false;
    
    // Cleanup on failure
    if (client) {
      try { await client.destroy(); } catch (e) {}
      client = null;
    }
  }
};

export const getWhatsAppStatus = () => {
  updateGlobalStatus();
  return globalForWhatsApp.whatsappStatus;
};

export const sendMessage = async (chatId: string, message: string, mediaBase64?: string) => {
  if (!client || !isReady) {
    throw new Error('WhatsApp client is not ready. Please verify connection.');
  }
  
  // If it's just a number, format it
  let finalId = chatId;
  if (!finalId.includes('@')) {
    let cleanPhone = finalId.replace(/\D/g, '');
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('52')) {
      cleanPhone = '521' + cleanPhone;
    }
    finalId = `${cleanPhone}@c.us`;
  }
  
  if (mediaBase64) {
    console.log(`Sending media to ${finalId} with caption: ${message.substring(0, 20)}...`);
    const media = MessageMedia.fromDataURL(mediaBase64);
    return await client.sendMessage(finalId, media, { caption: message });
  }

  console.log(`Sending text message to ${finalId}: ${message.substring(0, 20)}...`);
  return await client.sendMessage(finalId, message);
};

export const getRecentChats = async (limit = 20) => {
  if (!client || !isReady) return [];
  const chats = await client.getChats();
  const recentChats = chats.slice(0, limit);

  return await Promise.all(recentChats.map(async (c) => {
    let avatar = '';
    try {
      const contact = await c.getContact();
      avatar = await contact.getProfilePicUrl();
    } catch (e) {
      // Ignore avatar errors
    }

    return {
      id: c.id._serialized,
      name: c.name,
      timestamp: c.timestamp,
      unreadCount: c.unreadCount,
      lastMessage: c.lastMessage?.body || '',
      avatar: avatar
    };
  }));
};

export const getChatMessages = async (chatId: string, days = 2, limit = 100) => {
  if (!client || !isReady) return [];
  
  let finalId = chatId;
  if (!finalId.includes('@')) {
    let cleanPhone = finalId.replace(/\D/g, '');
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('52')) {
      cleanPhone = '521' + cleanPhone;
    }
    finalId = `${cleanPhone}@c.us`;
  }

  console.log(`[WhatsApp] Fetching messages for: ${finalId} (days=${days}, limit=${limit})`);
  
  try {
    const chat = await client.getChatById(finalId);
    let messages = await chat.fetchMessages({ limit });
    console.log(`[WhatsApp] Plan A - Raw messages fetched: ${messages.length}`);
    
    // Plan B: If Plan A returns nothing, use searchMessages to force a server-side fetch
    if (messages.length === 0) {
      console.log(`[WhatsApp] Plan B - Triggering searchMessages for ${finalId}`);
      const searched = await client.searchMessages('', { chatId: finalId, limit });
      if (searched.length > 0) {
        console.log(`[WhatsApp] Plan B - Recovered ${searched.length} messages`);
        messages = searched;
      }
    }
    
    const cutoff = days === 0 ? 0 : Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    if (days > 0) console.log(`[WhatsApp] Cutoff timestamp: ${cutoff} (${new Date(cutoff * 1000).toLocaleString()})`);
    
    const filtered = messages
      .filter(m => days === 0 || m.timestamp >= cutoff)
      .map(m => ({
        id: m.id.id,
        body: m.body,
        from: m.from,
        to: m.to,
        fromMe: m.fromMe,
        timestamp: m.timestamp,
        type: m.type,
        hasMedia: m.hasMedia
      }))
      .sort((a, b) => a.timestamp - b.timestamp); // Ensure chronological order
      
    console.log(`[WhatsApp] Final filtered messages: ${filtered.length}`);
    return filtered;
  } catch (err: any) {
    console.error(`[WhatsApp] Error fetching messages for ${finalId}:`, err.message);
    throw err;
  }
};
