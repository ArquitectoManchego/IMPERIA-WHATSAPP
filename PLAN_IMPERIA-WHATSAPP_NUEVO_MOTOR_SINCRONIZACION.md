# Plan Arquitectónico: Nuevo Motor de Sincronización Pasiva (Simulación Humana)

## 1. Problema Actual
La estrategia de solicitar mensajes "a demanda" (on-demand) para un contacto específico, estableciendo límites de días y forzando la apertura de chats mediante scripts (Plan D), está fallando. WhatsApp Web ha implementado carga diferida estricta (lazy loading) y ofuscación de módulos, y las solicitudes directas pueden estar siendo detectadas como comportamiento anómalo (bot), bloqueando la entrega de datos.

## 2. Nuevo Paradigma: Sincronización Pasiva y Precarga
En lugar de forzar a WhatsApp a buscar mensajes en el momento en que el usuario hace clic en "Sincronizar", vamos a emular el comportamiento exacto de una sesión de escritorio o web normal:
1.  **Precarga Completa:** Al iniciar la sesión, dejaremos que WhatsApp Web se tome su tiempo para sincronizar todo el historial reciente de todos los chats de forma natural (la pantalla de "Cargando tus mensajes").
2.  **Escucha Pasiva (Event-Driven):** En lugar de hacer consultas (pull), vamos a escuchar (push). Nos suscribiremos a los eventos naturales de la librería (`message`, `message_create`) para capturar cada mensaje que llega o se envía.
3.  **Caché Local / Base de Datos Intermedia:** Todo mensaje que WhatsApp cargue naturalmente al inicio o reciba en tiempo real, lo guardaremos en una memoria intermedia (caché local en Node.js o directamente en Firebase).
4.  **Respuesta Inmediata al UI:** Cuando el usuario haga clic en un contacto en el CRM, el backend no irá a Puppeteer a buscar los mensajes; simplemente leerá de nuestra base de datos local intermedia. Esto garantiza una respuesta instantánea y nula probabilidad de bloqueo por parte de WhatsApp.

## 3. Cambios en la Arquitectura

### A. Modificación de la Inicialización (`whatsapp.ts`)
-   **Eliminar consultas forzadas:** Eliminar la lógica de `fetchMessages` que usa `pupPage.evaluate` y `Plan D`.
-   **Asegurar la carga inicial:** Escuchar el evento `ready` y, opcionalmente, verificar que la fase de sincronización de WhatsApp haya concluido antes de marcar el cliente como "Conectado" en la UI.
-   **Recolector Global:** Una vez que el evento `ready` se dispara, ejecutar una recolección masiva **única** y suave de todos los chats y sus mensajes recientes usando los métodos estándar de la librería (`client.getChats()`, iterar con pausas aleatorias para extraer historial y guardarlo en caché).

### B. Gestión del Estado en Node.js (Servicio de Caché)
-   Crear un módulo `messageCache.ts` que almacene en memoria (ej. `Map<string, Message[]>`) el historial de cada contacto.
-   Almacenar temporalmente los mensajes extraídos en la carga inicial.
-   Al recibir un evento `message` o `message_create` de `whatsapp-web.js`, inyectarlo inmediatamente en este caché y disparar una actualización a Firebase si corresponde.

### C. Refactorización del Endpoint de Sincronización
-   El endpoint `/api/whatsapp/sync` o la función que llamamos desde el CRM ya no le pedirá a Puppeteer que extraiga datos.
-   La nueva lógica será: `return messageCache.get(clientId)`.
-   Si se requiere historial antiguo (ej. el usuario hace scroll hacia arriba), se pondrá en cola una tarea en segundo plano que navegue visualmente en Puppeteer (haciendo scroll físico simulado) para cargar más mensajes de forma natural, sin bloquear la interfaz.

## 4. Secuencia de Ejecución (Flujo de Datos)

1.  **Arranque del Servidor:** Puppeteer abre WhatsApp Web.
2.  **Sincronización Natural:** WhatsApp muestra la pantalla "Cargando tus mensajes". El sistema espera pacientemente.
3.  **Evento Ready:** WhatsApp termina de cargar.
4.  **Precarga en Segundo Plano:** El backend itera sobre los chats recientes, extrae los últimos mensajes a un ritmo humano (pausas de 1-2 segundos) y los guarda en `messageCache`.
5.  **Interacción del Usuario:** El usuario selecciona a "Lic. Diana" en el CRM.
6.  **Lectura:** El frontend solicita mensajes. El backend responde instantáneamente desde `messageCache`.
7.  **Mensajes Nuevos:** Un cliente escribe. El evento `message` salta en Puppeteer. El backend actualiza `messageCache` y lo sube a Firebase. El UI del usuario se actualiza en tiempo real vía Firebase listeners.

## 5. Beneficios de esta Estrategia
-   **Indetectable:** Evita inyectar scripts agresivos (Plan D) o llamar funciones internas ofuscadas que levantan alertas de seguridad en WhatsApp.
-   **Rendimiento:** Las consultas desde el CRM serán instantáneas (leyendo de memoria local) en lugar de tardar segundos esperando a Puppeteer.
-   **Estabilidad:** Inmune a los cambios constantes en el DOM o en los nombres de las variables de Webpack (`mR`, `ChatCollection`), ya que dependeremos del flujo de carga natural de la página y los listeners estándar de la librería de alto nivel.

## 6. Siguientes Pasos (Para Ejecución)
1.  Limpiar `whatsapp.ts` eliminando el código heredado del Plan D y las consultas a demanda.
2.  Implementar la estructura de caché en el backend.
3.  Reescribir los manejadores de eventos (`client.on('message')`) para poblar el caché continuamente.
4.  Ajustar el frontend para que refleje este nuevo estado de sincronización pasiva.
