# Plan de Investigación: Falla Silenciosa en Historial de Mensajes

## 1. Análisis del Problema
**Síntoma:** Al sincronizar el chat "Lic. Diana Gonzalez" (ID `5212291135441@c.us`), la aplicación muestra "SIN MENSAJES EN LOS ÚLTIMOS 0 DÍAS". No aparece ningún mensaje de error rojo en la pantalla, lo que significa que la petición al servidor es exitosa (código 200), pero la función interna de la librería (`chat.fetchMessages()`) está devolviendo un arreglo completamente vacío `[]`.

**Contradicción:** En el celular sí existen mensajes de hoy (incluyendo "ok" y "pruebas"). Si envías un mensaje desde la app web, llega al celular, pero luego al recargar la app web, ese mensaje tampoco se ve.

**Causas Probables:**
1.  **Problema de Caché Multi-Dispositivo:** Las versiones recientes de WhatsApp Web (Multi-Device) a veces no guardan el historial en la memoria local del navegador invisible (Puppeteer) inmediatamente. Si el historial no está local, `fetchMessages()` falla en silencio y devuelve `[]` en lugar de descargarlo de la nube.
2.  **Parámetros de Librería Alpha:** Estamos forzando la versión `2.3000.1018905202-alpha` de WhatsApp Web. Puede que esta versión requiera un parámetro adicional para obligar la carga del historial remoto.

## 2. Arquitectura de la Solución (Pasos a Ejecutar)

### Paso A: Creación de Herramienta de Diagnóstico
Se creará un nuevo archivo `src/app/api/whatsapp/debug/route.ts` dedicado exclusivamente a extraer el objeto `Chat` completo de "Lic. Diana" para analizar sus entrañas:
*   Ver si la propiedad `chat.hasMessages` es true.
*   Ver si el `chat.lastMessage` tiene datos.

### Paso B: Implementación de Búsqueda Alternativa (Plan B)
En `src/lib/whatsapp.ts`, se modificará la función `getChatMessages` para que sea a prueba de fallos:
1.  Intentará `chat.fetchMessages({ limit })` como hace actualmente.
2.  Si eso devuelve `[]` (y sabemos que es un chat activo porque estaba en la lista de recientes), activará el **Plan B**: usará la función global `client.searchMessages('', { chatId: finalId, limit })`. Esta función de búsqueda global es conocida por ser mucho más agresiva y obligar a WhatsApp a buscar en sus servidores en la nube si el historial local está vacío.

### Paso C: Ajuste de Retraso de Petición
A veces las peticiones muy rápidas justo después de arrancar fallan. Se considerará añadir un pequeño retraso o reintento si el primer `fetchMessages` devuelve vacío.

## Bloqueo de Ejecución
El diagnóstico inicial está completo. Las instrucciones técnicas están trazadas. Detenido y a la espera de la orden de ejecución para implementar el Plan B de recuperación de mensajes.
