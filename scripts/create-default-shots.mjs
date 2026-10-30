import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SHOTS_DIR = path.resolve('public/help/shots');
fs.mkdirSync(SHOTS_DIR, { recursive: true });

async function generate() {
  console.log('🎨 Generando capturas base de interfaz con Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // 1. Dashboard Main Shot
  const dashboardHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; background: #030712; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; height: 1080px; width: 1920px; overflow: hidden; }
        .sidebar { width: 80px; background: #020617; border-right: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; align-items: center; padding: 24px 0; gap: 20px; }
        .brand { width: 44px; height: 44px; background: #059669; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; box-shadow: 0 4px 20px rgba(16,185,129,0.3); }
        .nav-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 18px; }
        .nav-icon.active { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
        .chat-list { width: 420px; background: #090d16; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; }
        .chat-header { height: 80px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .tabs-bar { display: flex; gap: 6px; padding: 12px 18px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.05); overflow-x: auto; }
        .tab-btn { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.05); white-space: nowrap; }
        .tab-btn.active { background: rgba(16,185,129,0.2); color: #34d399; border-color: rgba(16,185,129,0.4); }
        .chat-card { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; gap: 14px; align-items: center; cursor: pointer; }
        .chat-card.active { background: rgba(16,185,129,0.08); border-left: 4px solid #10b981; }
        .avatar { width: 48px; height: 48px; border-radius: 14px; background: #1e293b; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #10b981; font-size: 16px; border: 2px solid rgba(16,185,129,0.3); }
        .card-info { flex: 1; min-width: 0; }
        .card-name { font-weight: 800; font-size: 14px; color: #fff; margin-bottom: 2px; }
        .card-phone { font-size: 11px; color: #64748b; font-family: monospace; }
        .card-tag { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; background: rgba(16,185,129,0.15); color: #34d399; margin-top: 4px; border: 1px solid rgba(16,185,129,0.25); }
        .chat-view { flex: 1; display: flex; flex-direction: column; background: #030712; }
        .view-header { height: 80px; padding: 0 32px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; background: rgba(15,23,42,0.4); }
        .loyalty-badge { padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 900; background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); margin-left: 12px; }
        .messages-area { flex: 1; padding: 32px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
        .bubble { max-width: 60%; padding: 14px 18px; border-radius: 18px; font-size: 13px; line-height: 1.5; }
        .bubble.in { align-self: flex-start; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); border-top-left-radius: 4px; }
        .bubble.out { align-self: flex-end; background: #059669; color: #fff; border-top-right-radius: 4px; box-shadow: 0 6px 20px rgba(5,150,105,0.3); }
        .audio-player { display: flex; align-items: center; gap: 12px; padding: 6px 0; }
        .mic-circle { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .chat-footer { padding: 18px 32px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(15,23,42,0.5); display: flex; flex-direction: column; gap: 10px; }
        .sig-bar { display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
        .sig-pill { padding: 2px 8px; border-radius: 6px; background: rgba(16,185,129,0.15); color: #34d399; font-weight: 800; font-size: 10px; border: 1px solid rgba(16,185,129,0.3); }
        .input-row { display: flex; align-items: center; gap: 12px; }
        .action-btn { width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 16px; color: #94a3b8; }
        .action-btn.schedule { color: #38bdf8; background: rgba(56,189,248,0.1); border-color: rgba(56,189,248,0.3); }
        .action-btn.ptt { color: #ef4444; background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); }
        .text-input { flex: 1; height: 44px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 0 18px; color: #fff; font-size: 13px; }
        .send-btn { width: 44px; height: 44px; border-radius: 14px; background: #10b981; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; border: none; box-shadow: 0 4px 15px rgba(16,185,129,0.4); }
        .crm-aside { width: 320px; background: #060912; border-left: 1px solid rgba(255,255,255,0.06); padding: 24px; display: flex; flex-direction: column; gap: 16px; }
      </style>
    </head>
    <body>
      <div class="sidebar">
        <div class="brand">I</div>
        <div class="nav-icon active">💬</div>
        <div class="nav-icon">📊</div>
        <div class="nav-icon">📢</div>
        <div class="nav-icon">🤖</div>
        <div class="nav-icon">📦</div>
        <div class="nav-icon" style="margin-top:auto;">❓</div>
      </div>

      <div class="chat-list">
        <div class="chat-header">
          <h2 style="font-size: 20px; font-weight: 900; margin: 0;">Mensajes</h2>
          <div style="font-size: 18px; color: #10b981;">👁️</div>
        </div>

        <div class="tabs-bar">
          <div class="tab-btn active">Todos 142</div>
          <div class="tab-btn">No leídos 8</div>
          <div class="tab-btn">Con Pedidos 36</div>
          <div class="tab-btn">Fidelidad VIP 24</div>
          <div class="tab-btn">Grupos 5</div>
        </div>

        <div class="chat-card active">
          <div class="avatar">MG</div>
          <div class="card-info">
            <div class="card-name">María González (UV Enfermería)</div>
            <div class="card-phone">+52 228 100 2001</div>
            <div class="card-tag">Universidad Veracruzana</div>
          </div>
        </div>

        <div class="chat-card">
          <div class="avatar" style="border-color: rgba(56,189,248,0.4); color: #38bdf8;">CM</div>
          <div class="card-info">
            <div class="card-name">Dr. Carlos Méndez (UV Medicina)</div>
            <div class="card-phone">+52 228 100 2002</div>
            <div class="card-tag" style="background: rgba(56,189,248,0.15); color: #38bdf8; border-color: rgba(56,189,248,0.3);">UV Medicina</div>
          </div>
        </div>

        <div class="chat-card">
          <div class="avatar" style="border-color: rgba(245,158,11,0.4); color: #fbbf24;">RO</div>
          <div class="card-info">
            <div class="card-name">Lic. Roberto Morales</div>
            <div class="card-phone">+52 228 100 2003</div>
            <div class="card-tag" style="background: rgba(245,158,11,0.15); color: #fbbf24; border-color: rgba(245,158,11,0.3);">UV Odontología</div>
          </div>
        </div>
      </div>

      <div class="chat-view">
        <div class="view-header">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div class="avatar">MG</div>
            <div>
              <div style="font-weight: 800; font-size: 16px; display: flex; align-items: center;">
                María González (UV Enfermería)
                <span class="loyalty-badge">Nivel Oro • 420 pts</span>
              </div>
              <div style="font-size: 12px; color: #64748b; font-family: monospace;">+52 228 100 2001</div>
            </div>
          </div>

          <div style="display: flex; gap: 10px;">
            <div class="action-btn">🔍</div>
            <div class="action-btn">📅</div>
            <div class="action-btn">❓</div>
          </div>
        </div>

        <div class="messages-area">
          <div class="bubble in">
            ¡Hola! Quería preguntar si ya tienen las batas con el bordado oficial de la Facultad de Enfermería UV.
          </div>
          <div class="bubble out">
            ¡Hola María! Sí, contamos con existencias en todas las tallas con el escudo oficial actualizado.
          </div>
          <div class="bubble out" style="width: 260px;">
            <div class="audio-player">
              <div class="mic-circle">🎙️</div>
              <div style="flex:1;">
                <div style="height: 6px; background: rgba(255,255,255,0.3); border-radius: 4px; width: 100%; position: relative;">
                  <div style="height: 6px; background: #fff; width: 65%; border-radius: 4px;"></div>
                </div>
                <div style="font-size: 10px; margin-top: 4px; opacity: 0.8;">0:42 • Nota de Voz PTT</div>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-footer">
          <div class="sig-bar">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="sig-pill">✍️ Firma Activa</span>
              <span style="font-family: monospace; font-size: 10px; color: #94a3b8;">"Atte. Lic. Alejandro M. — Asesor Comercial IMPERIA"</span>
            </div>
            <span style="color: #64748b; text-decoration: underline; cursor: pointer;">Cambiar firma</span>
          </div>

          <div class="input-row">
            <div class="action-btn" title="Respuestas Rápidas">⚡</div>
            <div class="action-btn" title="Asistente IA">✨</div>
            <div class="action-btn schedule" title="Agendar Mensaje">⏰</div>
            <div class="action-btn" title="Adjuntar archivo">📎</div>
            <div class="action-btn" title="Emojis y Stickers">😊</div>
            <input class="text-input" placeholder="Escribe un mensaje..." value="Te adjunto la cotización institucional con tu beneficio de Nivel Oro..." />
            <div class="action-btn ptt" title="Nota de Voz PTT">🎙️</div>
            <button class="send-btn">➤</button>
          </div>
        </div>
      </div>

      <div class="crm-aside">
        <h3 style="font-size: 14px; font-weight: 800; margin: 0; color: #fff;">Ficha del Cliente & Fidelidad</h3>
        <div style="padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); font-size: 12px; space-y: 8px;">
          <div style="color: #fbbf24; font-weight: 800;">🏆 Tarjeta Cliente Frecuente</div>
          <div style="color: #fff; font-size: 16px; font-weight: 900; margin-top: 4px;">420 Puntos Acumulados</div>
          <div style="color: #34d399; font-size: 11px; margin-top: 4px;">Beneficio: 10% dto directo + accesorio gratis</div>
        </div>

        <div style="padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); font-size: 12px;">
          <div style="color: #94a3b8; font-weight: 700;">Etapa Comercial:</div>
          <div style="color: #a855f7; font-weight: 800; font-size: 14px; margin-top: 4px;">Negociación</div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(dashboardHtml);
  const mainShot = path.join(SHOTS_DIR, 'dashboard-main.png');
  await page.screenshot({ path: mainShot });
  console.log(`✅ Base generada: ${mainShot}`);

  // 2. CRM Kanban Shot
  const crmHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; background: #030712; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; height: 1080px; width: 1920px; }
        .header { height: 80px; padding: 0 40px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; background: #020617; }
        .board { flex: 1; padding: 32px 40px; display: flex; gap: 24px; overflow-x: auto; }
        .col { width: 340px; background: #0b0f19; border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; }
        .col-head { padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; font-weight: 900; font-size: 14px; }
        .cards { padding: 16px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .card { padding: 16px; border-radius: 16px; background: #111827; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 4px 15px rgba(0,0,0,0.4); display: flex; flex-direction: column; gap: 8px; }
        .tag { font-size: 10px; padding: 2px 8px; border-radius: 6px; font-weight: 800; background: rgba(16,185,129,0.15); color: #34d399; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="font-size: 24px; font-weight: 900; margin: 0; display: flex; align-items: center; gap: 12px;">
          <span>📊 Pipeline Comercial & CRM</span>
          <span style="font-size: 12px; background: rgba(16,185,129,0.15); color: #34d399; padding: 4px 12px; border-radius: 20px;">142 prospectos</span>
        </h1>
        <div style="display: flex; gap: 12px;">
          <div style="background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); padding: 8px 16px; border-radius: 12px; font-size: 12px; font-weight: 800;">
            ⏰ Solo Inactivos (>3 días)
          </div>
          <div style="background: #059669; color: #fff; padding: 8px 16px; border-radius: 12px; font-size: 12px; font-weight: 900;">
            + Nuevo Contacto
          </div>
        </div>
      </div>

      <div class="board">
        <div class="col">
          <div class="col-head" style="color: #60a5fa;">
            <span>1. Prospecto Nuevo</span>
            <span style="background: rgba(96,165,250,0.15); padding: 2px 8px; border-radius: 10px; font-size: 11px;">42</span>
          </div>
          <div class="cards">
            <div class="card">
              <div style="font-weight: 800; font-size: 14px;">Alejandra Cruz</div>
              <div style="font-size: 11px; color: #64748b;">+52 228 312 4589</div>
              <div class="tag">Interesada en Batas Clínicas</div>
            </div>
            <div class="card">
              <div style="font-weight: 800; font-size: 14px;">Rodrigo Valdés</div>
              <div style="font-size: 11px; color: #64748b;">+52 228 741 8520</div>
              <div class="tag">UV Odontología</div>
            </div>
          </div>
        </div>

        <div class="col">
          <div class="col-head" style="color: #38bdf8;">
            <span>2. Cotización Enviada</span>
            <span style="background: rgba(56,189,248,0.15); padding: 2px 8px; border-radius: 10px; font-size: 11px;">28</span>
          </div>
          <div class="cards">
            <div class="card">
              <div style="font-weight: 800; font-size: 14px;">Dr. Carlos Méndez</div>
              <div style="font-size: 11px; color: #64748b;">+52 228 100 2002</div>
              <div class="tag">UV Medicina • Filipinas</div>
            </div>
          </div>
        </div>

        <div class="col">
          <div class="col-head" style="color: #a855f7;">
            <span>3. Negociación</span>
            <span style="background: rgba(168,85,247,0.15); padding: 2px 8px; border-radius: 10px; font-size: 11px;">19</span>
          </div>
          <div class="cards">
            <div class="card">
              <div style="font-weight: 800; font-size: 14px;">María González</div>
              <div style="font-size: 11px; color: #64748b;">+52 228 100 2001</div>
              <div class="tag">UV Enfermería • 30 prendas</div>
            </div>
          </div>
        </div>

        <div class="col">
          <div class="col-head" style="color: #34d399;">
            <span>4. Cerrado Ganado</span>
            <span style="background: rgba(52,211,153,0.15); padding: 2px 8px; border-radius: 10px; font-size: 11px;">53</span>
          </div>
          <div class="cards">
            <div class="card" style="border-color: rgba(52,211,153,0.3);">
              <div style="font-weight: 800; font-size: 14px; color: #34d399;">Hospital Ángeles Xalapa</div>
              <div style="font-size: 11px; color: #64748b;">Pedido #TY-9921 Entregado</div>
              <div class="tag" style="background: rgba(52,211,153,0.2);">Confección Completa</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(crmHtml);
  const crmShot = path.join(SHOTS_DIR, 'crm-kanban.png');
  await page.screenshot({ path: crmShot });
  console.log(`✅ Base generada: ${crmShot}`);

  // 3. Campañas Shot
  const campanasHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; background: #030712; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; height: 1080px; width: 1920px; }
        .header { height: 80px; padding: 0 40px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; background: #020617; }
        .content { flex: 1; padding: 40px; display: flex; justify-content: center; }
        .box { width: 900px; background: #0b0f19; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 36px; display: flex; flex-direction: column; gap: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
        .switch-row { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-radius: 18px; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); }
        .pauses-row { display: flex; gap: 24px; padding: 18px 24px; border-radius: 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); align-items: center; }
        .tag-chip { padding: 4px 10px; border-radius: 8px; background: rgba(255,255,255,0.06); font-family: monospace; font-size: 12px; color: #34d399; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="font-size: 24px; font-weight: 900; margin: 0;">📢 Campañas Masivas & Protección Anti-Baneo</h1>
      </div>

      <div class="content">
        <div class="box">
          <h2 style="margin: 0; font-size: 18px; color: #fff;">Diseño de Campaña con Protección IA</h2>

          <div class="switch-row">
            <div>
              <div style="font-weight: 900; color: #34d399; font-size: 15px;">🛡️ Parafraseo y Variación IA (Anti-Baneo con Gemini)</div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Reescribe automáticamente cada mensaje con giros naturales en español mexicano para evitar detección de spam.</div>
            </div>
            <div style="width: 52px; height: 28px; background: #10b981; border-radius: 20px; display: flex; align-items: center; justify-content: flex-end; padding: 3px; box-sizing: border-box;">
              <div style="width: 22px; height: 22px; background: #fff; border-radius: 50%;"></div>
            </div>
          </div>

          <div class="pauses-row">
            <div style="flex:1;">
              <div style="font-weight: 800; font-size: 13px;">⏱️ Pausa entre envíos aleatoria:</div>
              <div style="font-size: 11px; color: #64748b;">Mínimo 4s — Máximo 10s entre cada contacto</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <span class="tag-chip">{primer_nombre}</span>
              <span class="tag-chip">{puntos}</span>
              <span class="tag-chip">{beneficio}</span>
            </div>
          </div>

          <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
            ¡Hola {primer_nombre}! 👋 Tenemos batas de laboratorio UV con 15% de descuento para tu generación. Tienes {puntos} puntos disponibles en tu tarjeta.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(campanasHtml);
  const campanasShot = path.join(SHOTS_DIR, 'campanas-view.png');
  await page.screenshot({ path: campanasShot });
  console.log(`✅ Base generada: ${campanasShot}`);

  await browser.close();
  console.log('🎉 Todas las capturas generadas exitosamente en public/help/shots.');
}

generate().catch(console.error);
