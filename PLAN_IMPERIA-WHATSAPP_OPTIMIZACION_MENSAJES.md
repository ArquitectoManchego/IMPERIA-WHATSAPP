# Plan de Arquitectura: Optimización de WhatsApp y Solución de Bloqueos

## 1. Problema de "Browser is already running" (Falla de Recarga)
**Causa Raíz:** En el entorno de desarrollo de Next.js (Turbopack), cuando se realizan cambios o hay recargas pesadas, el proceso de Node.js se reinicia. Esto hace que las variables globales (como el `globalThis` que implementamos) se pierdan. Sin embargo, los subprocesos de Chromium (el navegador invisible) lanzados por Puppeteer **no se cierran**, quedando huérfanos. Estos procesos invisibles mantienen el archivo `lockfile` en la carpeta `session-imperia-wa-crm-v4`. Al iniciar el nuevo proceso de Node e intentar conectar, choca contra ese bloqueo.

**Lógica a implementar:**
*   **Limpieza Preventiva (Pre-flight Kill):** Antes de ejecutar `client.initialize()` en `src/lib/whatsapp.ts`, crearemos una función `killOrphanSessions()`.
*   Esta función ejecutará internamente en Windows un barrido de procesos (`wmic` o lectura de procesos) para identificar qué PID de `chrome.exe` está utilizando la ruta `.wwebjs_auth/session-imperia-wa-crm-v4` y le hará un kill automático.
*   Con esto, el botón "Reiniciar Conexión" o el reinicio del servidor SIEMPRE encontrarán la carpeta desbloqueada y podrán levantar la sesión sin que tengas que cerrar sesión en tu celular de nuevo.

## 2. Optimización de Carga de Mensajes (On-Demand y Filtro Temporal)
**Requerimientos del usuario:**
1. No cargar todos los mensajes al iniciar.
2. Precargar solo las últimas 20 personas.
3. Usar un checkbox al lado de cada persona para decidir si cargar sus mensajes.
4. Cargar solo los últimos 2 días por defecto.
5. Botón de "Cargar más mensajes" (+5 días) con input personalizable.

**Arquitectura de UI (`src/app/dashboard/page.tsx`):**
*   **Estado de Lista:** Modificar la consulta inicial para fusionar la base de datos de TAYLOR con los 20 chats recientes devueltos por `whatsapp-web.js` (mediante un endpoint nuevo o ajustando el existente).
*   **El Checkbox "Cargar Chat":** En la iteración de clientes en la barra lateral, añadiremos un `<input type="checkbox">` o un Toggle. Al activarlo, se añadirá el número de ese cliente a un estado local `activeChatsForSync`.
*   **El Fetch Bajo Demanda:** Solo si un cliente está en `activeChatsForSync`, se hace la petición al backend para traer sus mensajes.
*   **Filtro de 2 Días (Backend/Frontend):** 
    *   La API `/api/whatsapp/messages` recibirá un parámetro `days=2`.
    *   `lib/whatsapp.ts` usará la API de WhatsApp para traer los mensajes de ese chat, calculando un Timestamp de corte (Fecha actual - X días). Descartará los mensajes más antiguos antes de enviarlos al cliente para ahorrar memoria.
*   **Controles de "Cargar Más":**
    *   En la cabecera del chat, habrá un input `<input type="number" defaultValue={5} />` representando los "Días hacia atrás a cargar".
    *   El botón "Cargar más mensajes" sumará este valor al estado `currentDaysLimit` (ej: pasa de 2 a 7 días). Esto disparará un nuevo Fetch a la API con `days=7`, trayendo el historial ampliado.

## 3. Estados de la Aplicación (Manejo de UI)
*   **`whatsappStatus`**: Cambiará entre `disconnected` -> `cleaning_orphans` -> `initializing` -> `authenticated` -> `ready`.
*   **`syncStatus[phone]`**: Cada cliente tendrá un estado de carga: `idle` (checkbox desmarcado) -> `loading` (checkbox marcado, buscando 2 días) -> `loaded` -> `loading_more` (pidiendo 5 días extra).

## Resumen de Archivos a Modificar
1.  **`src/lib/whatsapp.ts`**: Añadir limpieza de huérfanos antes del init. Modificar `getChatMessages` para filtrar por Timestamp estricto de días.
2.  **`src/app/dashboard/page.tsx`**: Integrar los checkboxes, el estado de qué chats sincronizar, y los inputs de "Días extra".
3.  **`src/app/api/whatsapp/messages/route.ts`**: Adaptar para recibir el parámetro de días en lugar de solo límite de cantidad.
