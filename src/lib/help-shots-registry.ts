import type { ShotMetadata } from './help-types.ts';

export const SHOT_METADATA_REGISTRY: Record<string, ShotMetadata> = {
  'dashboard-main': {
    id: 'dashboard-main',
    title: 'Pantalla Principal de Mensajes & Chat',
    imagePath: '/help/shots/dashboard-main.png',
    width: 1920,
    height: 1080,
    elements: {
      'chat-tabs': {
        x: 4.5,
        y: 11.5,
        width: 25.5,
        height: 5.2,
        label: 'Barra de Pestañas Rápidas',
        description: 'Filtra entre Todos, No leídos, Con Pedidos, VIP, Grupos y Sin Responder.'
      },
      'privacy-toggle': {
        x: 27.5,
        y: 7.2,
        width: 2.5,
        height: 4.0,
        label: 'Botón Modo Privacidad (Blur)',
        description: 'Desenfoque instantáneo de datos sensibles y nombres.'
      },
      'btn-schedule': {
        x: 46.5,
        y: 93.5,
        width: 3.2,
        height: 5.0,
        label: 'Agendar Mensaje (Reloj)',
        description: 'Programa envíos para fechas u horas específicas.'
      },
      'btn-ptt': {
        x: 77.2,
        y: 93.5,
        width: 3.2,
        height: 5.0,
        label: 'Grabadora de Voz PTT',
        description: 'Graba y envía audios nativos con micrófono verde de WhatsApp.'
      },
      'agent-signature': {
        x: 32.5,
        y: 89.2,
        width: 48.0,
        height: 3.8,
        label: 'Barra de Firma de Asesor',
        description: 'Activa o personaliza tu firma al final de cada mensaje.'
      },
      'loyalty-badge': {
        x: 42.0,
        y: 4.5,
        width: 14.0,
        height: 3.8,
        label: 'Insignia de Fidelidad',
        description: 'Muestra el nivel y los puntos acumulados por el cliente.'
      }
    }
  },
  'crm-kanban': {
    id: 'crm-kanban',
    title: 'Tablero Kanban del CRM',
    imagePath: '/help/shots/crm-kanban.png',
    width: 1920,
    height: 1080,
    elements: {
      'pipeline-columns': {
        x: 6.0,
        y: 15.0,
        width: 88.0,
        height: 80.0,
        label: 'Columnas de Etapas Comerciales',
        description: 'Arrastra las tarjetas o cámbialas de etapa para avanzar en la venta.'
      },
      'inactivity-filter': {
        x: 68.0,
        y: 8.5,
        width: 18.0,
        height: 4.8,
        label: 'Filtro de Inactividad (>3 días)',
        description: 'Detecta prospectos que requieren seguimiento urgente.'
      }
    }
  },
  'campanas-view': {
    id: 'campanas-view',
    title: 'Módulo de Campañas Masivas',
    imagePath: '/help/shots/campanas-view.png',
    width: 1920,
    height: 1080,
    elements: {
      'ai-antiban-toggle': {
        x: 18.0,
        y: 48.0,
        width: 28.0,
        height: 6.5,
        label: 'Interruptor de Variación IA Anti-Baneo',
        description: 'Reescribe los textos con IA para evitar que WhatsApp detecte repeticiones.'
      },
      'delay-intervals': {
        x: 48.0,
        y: 48.0,
        width: 32.0,
        height: 6.5,
        label: 'Pausas Aleatorias (Segundos)',
        description: 'Intervalos variables entre cada mensaje para simular un envío humano.'
      }
    }
  }
};
