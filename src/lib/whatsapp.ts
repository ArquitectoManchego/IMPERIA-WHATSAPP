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
  const prefix = type === 'error' ? '❌ [WA-ENGINE]' : '🔹 [WA-ENGINE]';
  const logEntry = `[${timestamp}] ${prefix} ${msg}`;
  
  globalForWhatsApp.systemLogs.push(logEntry);
  if (globalForWhatsApp.systemLogs.length > 100) {
    globalForWhatsApp.systemLogs.shift();
  }

  // Ensure it goes to process.stdout/stderr for the Launcher to see
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
  addLog('Cleaning up browser zombies...');
  const { exec } = await import('child_process');
  return new Promise((resolve) => {
    // Kill only chrome/chromium processes related to our project
    const cmd = `powershell "Get-Process chrome, chromium -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*puppeteer*' -or $_.CommandLine -like '*imperia-wa-crm-v4*' } | Stop-Process -Force -ErrorAction SilentlyContinue"`;
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
    const isStatus = from === 'status@broadcast';

    if (isStatus) return; // Ignore status updates silently

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

    // Update Memory Cache (ALWAYS, even if not registered, to allow real-time view)
    const current = globalForWhatsApp.messageCache.get(from) || [];
    globalForWhatsApp.messageCache.set(from, [...current, msgData].slice(-100));

    if (clientData) {
      addLog(`✅ Message from REGISTERED client (${clientData.nombre || 'Sin nombre'}): ${body}`);
      await saveWhatsAppMessage(from, message).catch(() => {});
    } else {
      if (!isGroup) {
        addLog(`🔹 Message from untracked number: ${from}. Cached for UI.`);
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
      const chat = await client?.getChatById(chatId);
      const chatName = chat?.name || '';
      const cleanId = chatId.replace(/\D/g, '');
      
      const scrapedMsgs = await page.evaluate(async (targetId: string, targetName: string) => {
        // Wait for stability
        await new Promise(r => setTimeout(r, 1500));
        
        const tryFindAndClick = async () => {
          const items = Array.from(document.querySelectorAll('div[role="listitem"], div._ak8l, div._ak8o, div._aa4m'));
          let target = items.find(it => (it as HTMLElement).innerText.includes(targetId.slice(-10)));
          if (!target && targetName) {
            target = items.find(it => (it as HTMLElement).innerText.toLowerCase().includes(targetName.toLowerCase()));
          }

          if (!target && targetName) {
            const allSpans = Array.from(document.querySelectorAll('span[title], span._ao3e, span.x1iyjqo2'));
            const spanMatch = allSpans.find(s => (s as HTMLElement).innerText.toLowerCase().includes(targetName.toLowerCase()));
            if (spanMatch) {
              target = spanMatch.closest('div[role="listitem"]') || spanMatch.closest('div._ak8l') || spanMatch.parentElement;
            }
          }

          if (target) {
            const rect = (target as HTMLElement).getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
               (target as HTMLElement).click();
               return true;
            }
          }
          return false;
        };

        // 1. Try to find in current list
        let found = await tryFindAndClick();

        // 2. Fallback: Use Search Bar if not found
        if (!found && targetName) {
          const searchInput = document.querySelector('div[contenteditable="true"][role="textbox"], div.lexical-rich-text-input, [data-tab="3"]');
          if (searchInput) {
            (searchInput as HTMLElement).focus();
            // Clear existing text if any
            (searchInput as HTMLElement).innerText = "";
            return { action: 'search', name: targetName };
          }
        }
        
        if (found) {
          await new Promise(r => setTimeout(r, 4000));
          const bubbles = Array.from(document.querySelectorAll('div.message-in, div.message-out, div._akbu, div._akbv, div._nm4, [role="row"]'));
          return bubbles.map((b, i) => {
            // Find all possible text spans
            const allSpans = Array.from(b.querySelectorAll('span.selectable-text, .copyable-text [dir="ltr"], span._ao3e'));
            
            // Filter: In groups, the first span is often the name and has a color style
            // We want the span that contains the ACTUAL message text
            const actualTextEl = allSpans.find(el => {
               const style = window.getComputedStyle(el);
               const hasColor = el.getAttribute('style')?.includes('color') || (el as HTMLElement).style.color !== "";
               const text = (el as HTMLElement).innerText;
               // If it's a very short span with color, it's probably a name
               if (hasColor && text.length < 40) return false;
               return true;
            });

            const isOut = b.classList.contains('message-out') || b.innerHTML.includes('message-out') || b.closest('.message-out');
            return {
              id: `vsync-${Date.now()}-${i}`,
              body: actualTextEl ? (actualTextEl as HTMLElement).innerText : "",
              fromMe: !!isOut,
              timestamp: Math.floor(Date.now() / 1000) - (bubbles.length - i),
              type: 'chat'
            };
          }).filter(m => m.body.length > 0);
        }
        return [];
      }, cleanId, chatName);

    const self = this;
    try {
      // Handle the search action outside page.evaluate if needed
      if ((scrapedMsgs as any).action === 'search') {
        const targetName = (scrapedMsgs as any).name;
        addLog(`[WA-ENGINE] [WhatsApp] 🔍 Chat not in view. Searching for: ${targetName}...`);
        await page.keyboard.type(targetName, { delay: 100 });
        await new Promise(r => setTimeout(r, 4000));
        
        // Re-run extraction now that results are shown
        return await self.getChatMessages(chatId, chatName);
      }
    } catch (err: any) {
      addLog(`[WA-ENGINE] [WhatsApp] ⚠️ Search fallback failed: ${err.message}`, 'error');
      return [];
    }

      if (scrapedMsgs.length > 0) {
        addLog(`[WhatsApp] ✅ Visual Sync success: Recovered ${scrapedMsgs.length} messages`);
        cached = scrapedMsgs;
        globalForWhatsApp.messageCache.set(chatId, scrapedMsgs);
        
        saveWhatsAppMessage(chatId, scrapedMsgs[scrapedMsgs.length-1]).catch(() => {});
      } else {
        addLog(`[WhatsApp] ⚠️ Visual Sync could not find chat: ${chatName}. Check if it's visible in monitor.`);
      }
    } catch (e: any) {
      addLog(`[WhatsApp] ❌ Visual Sync failed: ${e.message}`, 'error');
    }
  }

  // 3. Library Deep Sync (Last Resort - only if Visual Sync failed and library is stable)
  if (cached.length === 0 && client && isReady) {
     // ... (rest of logic remains but we silence the waitForChatLoading error if possible)
     try {
       const chat = await client.getChatById(chatId);
       // Skip fetchMessages if it's known to be broken by Meta updates
       // We'll try it once, but if it fails with specific error, we don't spam it.
       const messages = await chat.fetchMessages({ limit: limit });
       // ...
      cached = messages.map(m => ({
        id: m.id.id,
        body: m.body,
        from: m.from,
        to: m.to,
        fromMe: m.fromMe,
        timestamp: m.timestamp,
        type: m.type,
        hasMedia: m.hasMedia
      }));
      globalForWhatsApp.messageCache.set(chatId, cached);
      addLog(`[WhatsApp] ✅ Deep Sync success: Found ${cached.length} messages`);
    } catch (e: any) {
      addLog(`[WhatsApp] ❌ Deep Sync failed: ${e.message}`, 'error');
    }
  }

  // 4. Get from Firebase (Backup)
  let stored: any[] = [];
  try {
    stored = await getStoredMessages(chatId, limit);
  } catch (e) {}
  
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
