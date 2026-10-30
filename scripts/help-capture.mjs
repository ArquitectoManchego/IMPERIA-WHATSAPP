/**
 * Automated Help Screenshot & Video Generator using Playwright and Mock Data
 *
 * Usage:
 *   node scripts/help-capture.mjs
 *   node scripts/help-capture.mjs --headless
 */

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.APP_URL || 'http://localhost:3010';
const SHOTS_DIR = path.resolve('public/help/shots');
const VIDEOS_DIR = path.resolve('public/help/videos');

fs.mkdirSync(SHOTS_DIR, { recursive: true });
fs.mkdirSync(VIDEOS_DIR, { recursive: true });

// Mock Fictitious Data to protect real customer privacy
const MOCK_CLIENTS = [
  {
    id: '5212281002001@c.us',
    name: 'María González (UV Enfermería)',
    phone: '+52 228 100 2001',
    stage: 'Negociación',
    status: 'Activo',
    tags: ['Universidad Veracruzana', 'Facultad de Enfermería', 'Generación 2026'],
    avatar: 'https://images.unsplash.com/photo-1594824813639-450700d117a7?w=150',
    loyalty: {
      tierName: 'Oro',
      tierBadgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      currentPoints: 420,
      hasFrequentCard: true,
      currentBenefit: '10% de descuento directo en batas',
    },
  },
  {
    id: '5212281002002@c.us',
    name: 'Dr. Carlos Méndez (UV Medicina)',
    phone: '+52 228 100 2002',
    stage: 'Cotización',
    status: 'Pendiente',
    tags: ['Universidad Veracruzana', 'Facultad de Medicina'],
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    loyalty: {
      tierName: 'Plata',
      tierBadgeColor: 'bg-slate-400/10 text-slate-300 border-slate-400/20',
      currentPoints: 180,
      hasFrequentCard: true,
      currentBenefit: 'Bordado de nombre gratis',
    },
  },
];

async function run() {
  console.log('🚀 Iniciando generador de capturas Playwright con datos ficticios...');
  console.log(`📡 URL Objetivo: ${BASE_URL}`);

  const browser = await chromium.launch({
    headless: process.argv.includes('--headless'),
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: 'dark',
    recordVideo: {
      dir: VIDEOS_DIR,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  // Route interception for mock privacy protection
  await page.route('**/api/clients**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CLIENTS),
    });
  });

  await page.route('**/api/whatsapp/status**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ state: 'CONNECTED', isReady: true }),
    });
  });

  try {
    // 1. Capture Dashboard Main
    console.log('📸 Capturando Dashboard Principal...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const mainShotPath = path.join(SHOTS_DIR, 'dashboard-main.png');
    await page.screenshot({ path: mainShotPath, fullPage: false });
    console.log(`✅ Guardado: ${mainShotPath}`);

    // 2. Capture CRM Kanban
    console.log('📸 Capturando Pipeline CRM...');
    await page.goto(`${BASE_URL}/dashboard/crm`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const crmShotPath = path.join(SHOTS_DIR, 'crm-kanban.png');
    await page.screenshot({ path: crmShotPath, fullPage: false });
    console.log(`✅ Guardado: ${crmShotPath}`);

    // 3. Capture Campañas
    console.log('📸 Capturando Campañas Masivas...');
    await page.goto(`${BASE_URL}/dashboard/campanas`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const campanasShotPath = path.join(SHOTS_DIR, 'campanas-view.png');
    await page.screenshot({ path: campanasShotPath, fullPage: false });
    console.log(`✅ Guardado: ${campanasShotPath}`);

    console.log('🎉 Todas las capturas generadas exitosamente con datos ficticios.');
  } catch (err) {
    console.warn('⚠️ Nota sobre captura en vivo:', err.message);
  } finally {
    await context.close();
    await browser.close();
  }
}

run();
