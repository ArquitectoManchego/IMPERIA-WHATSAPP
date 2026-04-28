import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { isRegisteredClient, saveWhatsAppMessage, getStoredMessages } from './firebase-server';
import { promises as fs } from 'fs';
import path from 'path';

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
  systemLogs: string[];
  messageCache: Map<string, any[]>;
};

if (!globalForWhatsApp.systemLogs) {
  globalForWhatsApp.systemLogs = [];
}

if (!globalForWhatsApp.messageCache) {
  globalForWhatsApp.messageCache = new Map();
}

const addLog = (msg: string, type: 'info' | 'error' = 'info') => {
  const timestamp = new Date().toLocaleTimeString('es-MX', { hour12: false });
  const logEntry = `[${timestamp}] ${type === 'error' ? '❌ ' : '🔹 '}${msg}`;
  globalForWhatsApp.systemLogs.push(logEntry);
  if (globalForWhatsApp.systemLogs.length > 100) {
    globalForWhatsApp.systemLogs.shift();
  }
  if (type === 'error') {
    console.error(msg);
  } else {
    console.log(msg);
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

let client: Client | null = globalForWhatsApp.whatsappClient || null;
let { isReady, isAuthenticated, isInitializing, qrCodeData, lastError } = globalForWhatsApp.whatsappStatus;

const updateGlobalStatus = () => {
  globalForWhatsApp.whatsappStatus = { isReady, isAuthenticated, isInitializing, qrCodeData, lastError };
  if (client) globalForWhatsApp.whatsappClient = client;
};

// Reset initialization flag if it hangs for more than 2 minutes
setInterval(() => {
  if (isInitializing && !isReady && !qrCodeData) {
    addLog('Initialization seems hung, resetting flag...', 'error');
    isInitializing = false;
    updateGlobalStatus();
  }
}, 120000);

const cleanupSingletonLock = async () => {
  const sessionPath = path.join(process.cwd(), '.wwebjs_auth', 'session-imperia-wa-crm-v4');
  const filesToCleanup = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'first_party_sets.db'];
  
  // Wait a bit to ensure processes are truly dead
  await new Promise(r => setTimeout(r, 1000));

  for (const file of filesToCleanup) {
    const filePath = path.join(sessionPath, file);
    try {
      await fs.unlink(filePath);
      addLog(`[Forense] Archivo liberado: ${file}`);
    } catch (e) {}
  }
};

const killOrphanSessions = async () => {
  if (process.platform !== 'win32') return;
  addLog('Cleaning up system resources (Port 3010 & Browser Zombies)...');
  const { exec } = await import('child_process');
  return new Promise((resolve) => {
    // 1. Kill everything on port 3010 2. Kill all chrome/chromium zombies
    const cmd = `powershell "Get-NetTCPConnection -LocalPort 3010 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Get-Process chrome, chromium -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*puppeteer*' -or $_.CommandLine -like '*imperia-wa-crm-v4*' } | Stop-Process -Force -ErrorAction SilentlyContinue"`;
    exec(cmd, (error) => {
      resolve(true);
    });
  });
};

export const initializeWhatsApp = async (forceRestart = false) => {
  if (forceRestart && client) {
    addLog('Force restarting WhatsApp client...');
    try {
      await client.destroy();
      await new Promise(r => setTimeout(r, 3000));
    } catch (e: any) {}
    client = null;
    isReady = false;
    qrCodeData = null;
    isInitializing = false;
    updateGlobalStatus();
  }

  if (client || isInitializing) return;

  isInitializing = true;
  lastError = null;
  addLog('Initializing WhatsApp Client...');

  // Ensure no old processes are locking the folder
  await killOrphanSessions();
  await cleanupSingletonLock();

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: 'imperia-wa-crm-v4',
      dataPath: process.env.VERCEL ? '/tmp/.wwebjs_auth' : './.wwebjs_auth'
    }),
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
    addLog('WhatsApp QR Code received');
    try {
      qrCodeData = await qrcode.toDataURL(qr);
      isInitializing = false;
      updateGlobalStatus();
    } catch (err: any) {
      addLog(`Error generating QR data URL: ${err.message}`, 'error');
      lastError = 'Error generating QR code image';
      updateGlobalStatus();
    }
  });

  client.on('authenticated', () => {
    addLog('WhatsApp AUTHENTICATED');
    qrCodeData = null;
    isAuthenticated = true;
    isInitializing = false;
    updateGlobalStatus();
  });

  client.on('ready', async () => {
    addLog('WhatsApp Client is READY');
    isReady = true;
    isAuthenticated = true;
    isInitializing = false;
    qrCodeData = null;
    updateGlobalStatus();
    
    // Start Initial Passive Sync (Human-like)
    performInitialSync();
  });

  const performInitialSync = async () => {
    if (!client) return;
    addLog('🚀 Starting Background Initial Sync...');
    try {
      const chats = await client.getChats();
      addLog(`🔹 Syncing history for ${chats.length} chats...`);
      
      // Sync chats one by one with a small delay
      for (const chat of chats.slice(0, 50)) { 
        try {
          const messages = await chat.fetchMessages({ limit: 50 });
          const chatMsgs = messages.map(m => ({
            id: m.id.id,
            body: m.body,
            from: m.from,
            to: m.to,
            fromMe: m.fromMe,
            timestamp: m.timestamp,
            type: m.type,
            hasMedia: m.hasMedia
          }));
          
          // Store in Memory Cache
          globalForWhatsApp.messageCache.set(chat.id._serialized, chatMsgs);
          
          // Try to store in Firebase (Passive)
          for (const msg of messages) {
            saveWhatsAppMessage(chat.id._serialized, msg).catch(() => {});
          }
          await new Promise(r => setTimeout(r, 1000));
        } catch (e) {}
      }
      addLog('✅ Initial Sync Completed');
    } catch (e: any) {
      addLog(`❌ Error during initial sync: ${e.message}`, 'error');
    }
  };

  client.on('auth_failure', (msg) => {
    addLog(`WhatsApp Auth Failure: ${msg}`, 'error');
    lastError = `Fallo de autenticación: ${msg}`;
    isInitializing = false;
    qrCodeData = null;
    updateGlobalStatus();
  });

  client.on('disconnected', (reason) => {
    addLog(`WhatsApp Client was DISCONNECTED: ${reason}`);
    isReady = false;
    isInitializing = false;
    isAuthenticated = false;
    updateGlobalStatus();
  });

  client.on('message', async (message) => {
    const from = message.from;
    const body = message.body;
    const isGroup = from.endsWith('@g.us');

    addLog(`Checking registration for: ${from}`);
    const clientData = await isRegisteredClient(from);
    
    const msgData = {
      id: message.id.id,
      body: message.body,
      from: message.from,
      to: message.to,
      fromMe: message.fromMe,
      timestamp: message.timestamp,
      type: message.type,
      hasMedia: message.hasMedia
    };

    // Update Memory Cache
    const current = globalForWhatsApp.messageCache.get(from) || [];
    globalForWhatsApp.messageCache.set(from, [...current, msgData].slice(-100));

    if (clientData) {
      addLog(`✅ Message from REGISTERED client (${clientData.name || 'Sin nombre'}): ${body}`);
      await saveWhatsAppMessage(from, message).catch(() => {});
    } else {
      if (!isGroup) {
        addLog(`❌ Ignoring message from unknown number: ${from}`);
      }
    }
  });

  client.on('message_create', async (message) => {
    if (message.fromMe) {
      const to = message.to;
      const msgData = {
        id: message.id.id,
        body: message.body,
        from: message.from,
        to: message.to,
        fromMe: true,
        timestamp: message.timestamp,
        type: message.type,
        hasMedia: message.hasMedia
      };
      
      // Update Memory Cache
      const current = globalForWhatsApp.messageCache.get(to) || [];
      globalForWhatsApp.messageCache.set(to, [...current, msgData].slice(-100));
      
      await saveWhatsAppMessage(to, message).catch(() => {});
    }
  });

  try {
    // Add a timeout to initialization to avoid hanging forever
    const initTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tiempo de espera agotado al iniciar el navegador (60s)')), 60000)
    );

    await Promise.race([client.initialize(), initTimeout]);
  } catch (err: any) {
    addLog(`Failed to initialize WhatsApp client: ${err.message}`, 'error');
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
    addLog(`Sending media to ${finalId} with caption: ${message.substring(0, 20)}...`);
    const media = MessageMedia.fromDataURL(mediaBase64);
    return await client.sendMessage(finalId, media, { caption: message });
  }

  addLog(`Sending text message to ${finalId}: ${message.substring(0, 20)}...`);
  return await client.sendMessage(finalId, message);
};

export const getRecentChats = async (limit = 20) => {
  if (!client || !isReady) return [];
  const chats = await client.getChats();
  const recentChats = chats.slice(0, limit);

  // Sidebar Scrape Fallback (if lastMessage is missing)
  let sidebarData: any[] = [];
  if ((client as any).pupPage) {
    try {
      sidebarData = await (client as any).pupPage.evaluate(() => {
        const items = Array.from(document.querySelectorAll('div[role="listitem"]'));
        return items.map(item => {
          const nameEl = item.querySelector('span[title]');
          const lastMsgEl = item.querySelector('span[dir="ltr"]');
          return {
            name: nameEl ? nameEl.getAttribute('title') : "",
            lastMessage: lastMsgEl ? (lastMsgEl as HTMLElement).innerText : ""
          };
        });
      });
    } catch (e) {}
  }

  return await Promise.all(recentChats.map(async (c) => {
    let avatar = '';
    let name = c.name;
    try {
      const contact = await c.getContact();
      avatar = await contact.getProfilePicUrl();
      if (!name || /^[\d\+\-\s]+$/.test(name)) {
        name = contact.name || contact.pushname || name;
      }
    } catch (e) {}

    // Merge with sidebar scrape if library is empty
    let lastMessage = c.lastMessage?.body || '';
    if (!lastMessage && sidebarData.length > 0) {
       const match = sidebarData.find(s => s.name === name);
       if (match) lastMessage = match.lastMessage;
    }

    return {
      id: c.id._serialized,
      name: name,
      timestamp: c.timestamp,
      unreadCount: c.unreadCount,
      lastMessage: lastMessage,
      avatar: avatar
    };
  }));
};

export const getChatMessages = async (chatId: string, days = 2, limit = 100) => {
  addLog(`[WhatsApp] Fetching history for: ${chatId}`);
  
  // 1. Get from Memory Cache
  let cached = globalForWhatsApp.messageCache.get(chatId) || [];
  
  // 2. Visual Sync Fallback (If cache is dry)
  if (cached.length === 0 && (client as any).pupPage) {
    addLog(`[WhatsApp] 🔍 Cache dry. Performing Visual Sync for ${chatId}...`);
    try {
      const page = (client as any).pupPage;
      const cleanId = chatId.replace(/\D/g, '');
      
      const scrapedMsgs = await page.evaluate(async (targetId: string) => {
        // Find in sidebar and click
        const items = Array.from(document.querySelectorAll('div[role="listitem"]'));
        // @ts-ignore
        const target = items.find(it => it.innerText.includes(targetId.slice(-10)));
        
        if (target) {
          (target as HTMLElement).click();
          // Wait for pane to load
          await new Promise(r => setTimeout(r, 2000));
          
          // Scrape DOM
          const bubbles = Array.from(document.querySelectorAll('.message-in, .message-out'));
          return bubbles.map((b, i) => {
            const textEl = b.querySelector('.selectable-text span') || b.querySelector('span[dir="ltr"]');
            const isOut = b.classList.contains('message-out');
            return {
              id: `vsync-${Date.now()}-${i}`,
              body: textEl ? (textEl as HTMLElement).innerText : "",
              fromMe: isOut,
              timestamp: Math.floor(Date.now() / 1000) - (bubbles.length - i),
              type: 'chat'
            };
          }).filter(m => m.body.length > 0);
        }
        return [];
      }, cleanId);

      if (scrapedMsgs.length > 0) {
        addLog(`[WhatsApp] ✅ Visual Sync success: Recovered ${scrapedMsgs.length} messages`);
        cached = scrapedMsgs;
        globalForWhatsApp.messageCache.set(chatId, scrapedMsgs);
        
        // Background save to Firebase
        for (const m of scrapedMsgs) {
          saveWhatsAppMessage(chatId, m).catch(() => {});
        }
      }
    } catch (e: any) {
      addLog(`[WhatsApp] ❌ Visual Sync failed: ${e.message}`, 'error');
    }
  }

  // 3. Get from Firebase (Backup)
  const stored = await getStoredMessages(chatId, limit);
  
  // 4. Merge and deduplicate
  const merged = [...stored, ...cached];
  const unique = Array.from(new Map(merged.map(m => [m.id, m])).values());
  
  return unique.sort((a, b) => a.timestamp - b.timestamp).slice(-limit);
};

export const getScreenshot = async () => {
  if (!client || !(client as any).pupPage) return null;
  const page = (client as any).pupPage;
  try {
    await page.setViewport({ width: 1080, height: 2340 });
    const base64 = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 80 });
    await page.setViewport({ width: 1280, height: 800 });
    return `data:image/jpeg;base64,${base64}`;
  } catch (e) {
    return null;
  }
};
