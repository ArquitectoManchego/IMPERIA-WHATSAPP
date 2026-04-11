import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { isRegisteredClient } from './firebase-server';

let client: Client | null = null;
let qrCodeData: string | null = null;
let isReady = false;
let isInitializing = false;
let lastError: string | null = null;

export const initializeWhatsApp = async (forceRestart = false) => {
  if (forceRestart && client) {
    console.log('Force restarting WhatsApp client...');
    try {
      await client.destroy();
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

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: 'imperia-wa-crm',
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
        '--disable-extensions'
      ]
    }
  });

  client.on('qr', async (qr) => {
    console.log('WhatsApp QR Code received');
    try {
      qrCodeData = await qrcode.toDataURL(qr);
      isInitializing = false;
    } catch (err) {
      console.error('Error generating QR data URL', err);
      lastError = 'Error generating QR code image';
    }
  });

  client.on('ready', () => {
    console.log('WhatsApp Client is READY');
    isReady = true;
    isInitializing = false;
    qrCodeData = null;
  });

  client.on('auth_failure', (msg) => {
    console.error('WhatsApp Auth Failure:', msg);
    lastError = `Authentication failure: ${msg}`;
    isInitializing = false;
  });

  client.on('disconnected', (reason) => {
    console.log('WhatsApp Client was DISCONNECTED:', reason);
    isReady = false;
    isInitializing = false;
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
    await client.initialize();
  } catch (err: any) {
    console.error('Failed to initialize WhatsApp client:', err);
    lastError = err.message || 'Initialization failed';
    isInitializing = false;
    client = null;
  }
};

export const getWhatsAppStatus = () => ({
  isReady,
  qrCodeData,
  isInitializing,
  lastError
});
