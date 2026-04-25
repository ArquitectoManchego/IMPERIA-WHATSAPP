# Plan de Resolución: Sincronización, Estado y Avatares

## 1. Problema de "Sincronizar ahora" no hace nada
**Análisis:**
Al presionar el botón "Sincronizar ahora", el componente de React añade correctamente el `id` del chat al estado `syncedPhones`. Sin embargo, la interfaz de usuario seguía condicionada a revisar si el `phone` (número corto) estaba en el estado, ignorando el `id` (identificador completo). Por eso la vista nunca cambiaba, a pesar de que en el fondo sí se había sincronizado.
**Solución:**
Reemplazar `!syncedPhones.has(selectedChat.phone)` por `!syncedPhones.has(selectedChat.id)` en la línea que controla qué vista se muestra en la pantalla principal.

## 2. Problema del Estado "En Línea" Falso
**Análisis:**
El texto verde "En Línea" con el punto parpadeante estaba escrito estáticamente ("hardcoded") en la interfaz para propósitos de diseño (mockup). WhatsApp Web requiere una suscripción activa a eventos de presencia para ver el estado real "escribiendo..." o "en línea", lo cual es complejo y consume muchos recursos.
**Solución:**
Eliminar el indicador falso de "En Línea". En su lugar, se mostrará simplemente el número o el ID interno para mantener la transparencia total de la conexión y no dar información errónea.

## 3. Problema de Avatares Ausentes
**Análisis:**
Actualmente, la carga de los 20 chats recientes en `/api/whatsapp/chats` es muy rápida porque solo extrae los textos básicos (nombre y número). Las fotos de perfil (avatares) requieren una petición individual a los servidores de WhatsApp para cada contacto.
**Solución Arquitectónica:**
1.  **Backend (`lib/whatsapp.ts`):** Modificar la función `getRecentChats`. Para cada chat, se obtendrá asincrónicamente el contacto y se llamará a `contact.getProfilePicUrl()`.
2.  **Manejo de Errores:** Si un contacto no tiene foto o la petición falla, se atrapará el error devolviendo una cadena vacía (para que no colapse la API).
3.  **Frontend (`DashboardPage`):** Actualizar los iconos estáticos de `<User />` en la barra lateral y en el encabezado. Si `chat.avatar` existe, se usará un tag `<img />` con bordes redondeados. Si no existe, se mantendrá el icono actual como respaldo.

## Bloqueo de Ejecución
Este documento describe exactamente cómo arreglar la interfaz, los avatares y la sincronización. Detenido a la espera de la ejecución.
