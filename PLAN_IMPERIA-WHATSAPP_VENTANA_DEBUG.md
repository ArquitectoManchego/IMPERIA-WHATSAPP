# Plan de Implementación: Ventana de Debug y Progreso de Sincronización

## Objetivo
Crear una ventana de diagnóstico en la interfaz del usuario (Dashboard) que muestre en tiempo real exactamente qué "Plan" (A, B, C, D o E) se está ejecutando, qué está respondiendo el motor de WhatsApp (Puppeteer) y el progreso general de la carga de mensajes. Esto permitirá aislar la falla sin depender exclusivamente de los logs de la terminal del servidor.

## Arquitectura

### 1. Interceptor Global de Logs (Backend)
Actualmente, `lib/whatsapp.ts` imprime su diagnóstico en la terminal (`console.log`). Modificaremos esto para guardar los logs en la memoria global del servidor (`globalThis`).
*   **Crear sistema de buffer:** Un arreglo global que guarde los últimos 100 eventos del sistema con su marca de tiempo exacta.
*   **Función `addLog(message)`:** Reemplazará los `console.log` actuales. Esta función imprimirá en la terminal pero también inyectará el mensaje en el buffer global.

### 2. Endpoint de Transmisión (API)
*   **Ruta:** `src/app/api/whatsapp/logs/route.ts`
*   **Lógica:** Devolverá el arreglo completo de logs guardados en `globalThis`. Esto actuará como un "puente" para enviar los datos de Puppeteer hacia el frontend web.

### 3. Interfaz de Terminal de Diagnóstico (Frontend)
*   **Componente UI:** Una ventana flotante estilo "Terminal Hacker" (fondo negro, texto verde monospaciado) que se pueda abrir/cerrar desde el Dashboard.
*   **Polling (Sondeo):** Mientras la terminal esté abierta o se esté sincronizando un chat, la página hará peticiones cada 1 segundo a `/api/whatsapp/logs` para refrescar la pantalla en tiempo real.
*   **Progreso Visual:** Cuando se presione "Sincronizar", se mostrará un `Loader` con mensajes dinámicos ("Ejecutando Plan A...", "Forzando SyncHistory...", "Extrayendo Raw Store...") basados en los logs que vayan llegando.

## Cambios de Estado Requeridos (React)
En `src/app/dashboard/page.tsx`:
*   `showDebugWindow`: boolean (para mostrar/ocultar la terminal).
*   `systemLogs`: string[] (para renderizar las líneas de texto).
*   `isSyncing`: boolean (para activar el polling intensivo).

## Bloqueo de Ejecución
Este documento define la arquitectura para exponer el estado interno de Puppeteer directamente al usuario en la interfaz web. No se ha modificado ningún archivo de código fuente. Esperando autorización para cambiar de modelo e iniciar el desarrollo.
