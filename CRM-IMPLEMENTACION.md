# IMPERIA CRM: instalación y validación

## Componentes

- IMPERIA-WHATSAPP: interfaz, APIs autenticadas, clientes, bitácora, Google Contacts y procesamiento de pedidos.
- openwa-gateway: único propietario de la sesión de WhatsApp. Incluye rutas nuevas para chats, historial y descarga de adjuntos.
- IMPERIA-WHATSAPP-SERVER: proceso continuo que llama al worker cada minuto. `pnpm start` ya no inicia otro navegador WhatsApp.
- PEDIDOS IMPERIA: conserva los documentos actuales. El CRM lee la colección existente `artifacts/{projectId}/public/data/clients` y mantiene su propia vista de pedidos y personas. No reescribe importes, pedidos ni pagos.

## Configuración obligatoria

1. Conservar las variables existentes de `.env.local`. Agregar las faltantes de `.env.example`.
2. Indicar `GOOGLE_CONTACTS_OWNER_EMAIL` y `CRM_ALLOWED_EMAILS` (lista separada por comas). Sin lista autorizada el acceso queda cerrado.
3. Configurar `GOOGLE_APPLICATION_CREDENTIALS` con la ruta de una cuenta de servicio autorizada para Firestore en el mismo proyecto que PEDIDOS IMPERIA. Alternativamente se admite `FIREBASE_SERVICE_ACCOUNT_JSON`. Nunca usar variables NEXT_PUBLIC para credenciales privadas.
4. Habilitar Google People API en el proyecto OAuth; registrar el callback `http://localhost:3010/api/auth/callback/google`. La cuenta principal debe iniciar sesión para autorizar contactos y obtener el refresh token. Se almacena cifrado con NEXTAUTH_SECRET; cambiar ese secreto requiere volver a autorizar.
5. Publicar y verificar las reglas de Firestore revisadas en PEDIDOS IMPERIA ANTES de iniciar el CRM. La colección imperiaCrm debe ser inaccesible desde los SDK de navegador, incluso para usuarios autenticados. Las reglas previas permitían acceso global a cualquier usuario autenticado. El SDK Admin accede mediante IAM.
6. Configurar la clave real del gateway. Usar el mismo CRM_WORKER_SECRET aleatorio en app y worker. El WEBHOOK_SECRET se usa para HMAC, no como cabecera de contraseña.
7. Mantener CRM_AUTOMATIONS_ENABLED=false durante validación. Los avisos solo se envían cuando la variable es true Y el cliente tiene autorización registrada en su ficha.

## Arranque

Desde openwa-gateway: instalar según su lockfile, compilar y arrancar con sus scripts existentes. Debe permanecer disponible en el puerto 2785.

Desde IMPERIA-WHATSAPP: `pnpm run build` y `pnpm start` (puerto 3010); para desarrollo, `pnpm run dev`. Se eliminó el predev que cerraba todos los navegadores.

Desde IMPERIA-WHATSAPP-SERVER: `pnpm start`. Requiere Node 22 o superior para cargar .env.local; no necesita construir Next para ejecutar el worker.

Abrir http://localhost:3010, iniciar sesión y pulsar Conectar. Después, Actualizar clientes y pedidos. Ejecutar los tres servicios de forma persistente si se requiere recibir y procesar mensajes con el navegador de la interfaz cerrado. No alojar el motor de navegador ni el worker en funciones efímeras.

## Comprobación con una cuenta de prueba

1. Número nuevo escribe: una ficha prospecto; repetir el webhook no duplica el mensaje.
2. Número ya registrado en pedidos: una ficha cliente y todos sus pedidos asociados.
3. Variantes +52, 521 y número nacional: misma persona. Grupos y LID sin teléfono resuelto no se convierten en números supuestos.
4. Reiniciar app y worker: mensajes, notas, contactos y cola permanecen.
5. Sincronizar Google dos veces: un contacto. Editar nombre confirmado: actualizar el contacto administrado por CRM. Los nombres de contactos personales preexistentes se conservan.
6. Pedido fabricado pero no listo en tienda: no genera aviso de recogida. Requiere ajustes: tampoco.
7. Listo en tienda: aviso pendiente. Con automatización desactivada no se envía. Habilitar solo después de revisar estos resultados.
8. Cambiar pedido mientras el aviso espera: el aviso anterior se cancela. Revocar permiso: no se envía.
9. Resultado de envío incierto: aparece como uncertain y NO se reintenta automáticamente. Revisar conversación antes de volver a enviar.
10. Probar acceso sin sesión: APIs del CRM devuelven 401. Firma de webhook inválida: 401. Worker sin secreto: 401.

## Datos adicionales reconocidos

Además de los campos actuales se admiten `fecha_estimada`, `motivo_cambio_fecha`, `enviado`, `guia`, `paqueteria`, `fecha_entrega_real`. Si el sistema de pedidos no los proporciona, no se inventan fechas ni rastreos. La fecha comprometida se obtiene de fecha_entrega_general. La recogida exige productionStatus.listoEnTienda y ausencia de requiereAjustes.

Se preparan avisos de etapa, fecha, retraso, recogida, reparto y seguimiento periódico (CRM_FOLLOWUP_DAYS, mínimo 1). La primera importación no manda avisos históricos. Para evitar duplicados se conservan claves estables por evento; los resultados de red inciertos requieren revisión.

## Alcance y límites

El motor sigue siendo OpenWA/whatsapp-web.js no oficial. No se migró a Meta Cloud API ni se promete compatibilidad total con llamadas, estados, canales, grupos o todas las funciones de WhatsApp Web. La interfaz admite conversaciones individuales, búsqueda, texto, archivos, respuestas citadas y confirmaciones disponibles. Recupera hasta 500 mensajes por conversación que el motor pueda obtener; WhatsApp puede no entregar historial antiguo o medios vencidos.

La sincronización del teléfono depende de la cuenta Google y del ajuste de Contactos del dispositivo. Una coincidencia ambigua con varios contactos Google se deja para revisión; una creación con resultado incierto no se repite a ciegas.

La lista de contactos inicial muestra hasta 1000 fichas y la lista de conversaciones hasta 200; para volúmenes mayores se debe añadir paginación. La conciliación actual recorre los pedidos cada minuto: para mayor volumen, migrar a eventos Firestore y consultas incrementales. No se eliminan registros históricos de pedidos ni se despliegan reglas automáticamente.

## Verificación técnica

`pnpm run typecheck` y `pnpm test`. Ejecutar también TypeScript/build del gateway. La validación local no reemplaza la prueba real de OAuth, permisos Firestore, QR, recepción de un mensaje y Google Contacts.

Dependencias: usar pnpm y el pnpm-lock.yaml existente; no cambiar versiones durante esta actualización. El package-lock.json original está vacío y no es una referencia reproducible. `pnpm run check:config` muestra las variables faltantes sin imprimir secretos.

## Arquitectura Dual: Comunicación Vercel → Proceso Local → WhatsApp

1. **Recorrido del Mensaje:**
   - Si la aplicación se ejecuta en **Vercel** (o sin túnel activo directo al gateway), `POST /api/whatsapp/send` no puede conectarse a `localhost:2785`. En su lugar, deposita el mensaje en la cola de salida Firestore: `imperiaCrm/main/outbox/${requestId}` y devuelve `HTTP 202 (En cola)`.
   - El proceso local (`IMPERIA-WHATSAPP-SERVER` / worker) consulta la cola de salida en Firestore cada 5 segundos mediante `/api/internal/worker?type=outbox`.
   - El worker reclama el mensaje atómicamente mediante una transacción Firestore (`status: 'sending'`), lo entrega al gateway local (`http://127.0.0.1:2785`) y actualiza el estado a `sent` con el `messageId` real emitido por WhatsApp.
   - Si el equipo local está apagado, el mensaje permanece seguro en estado `pending` en Firestore sin perderse, y se envía automáticamente en cuanto el launcher o el worker se inicien.

2. **Manejo de Adjuntos:**
   - Se admite `mediaBase64` hasta 8 MB (mimetypes: imágenes, audio, video y documentos/PDFs). El worker local recibe la carga útil y la transfiere al endpoint especializado del motor (`send-image`, `send-document`, etc.).

3. **Prevención de Duplicados (Idempotencia):**
   - Cada intento de envío exige un `requestId` en formato UUIDv4. La transacción Firestore en `imperiaCrm/main/sendRequests/${requestId}` garantiza que reintentos de red o clics repetidos devuelvan el estado existente sin disparar dobles envíos.

4. **Confirmaciones de Entrega:**
   - La aceptación inicial del gateway marca el mensaje como enviado (`ack: 1`).
   - Los eventos de entrega al dispositivo (`ack: 2`) y lectura (`ack: 3`) llegan por webhook (`/api/webhooks/openwa`) y actualizan el mensaje en Firestore, reflejándose en tiempo real tanto en la versión local como en la de Vercel.

5. **Restricción de Envíos en Modo Prueba:**
   - Mientras `CRM_AUTOMATIONS_ENABLED=false`, tanto los avisos automáticos como los envíos manuales quedan estrictamente restringidos.
   - Para realizar pruebas de envío manual, se debe definir `CRM_TEST_PHONE=+52...` en `.env.local`. Cualquier intento de envío a un número que no coincida con `CRM_TEST_PHONE` es bloqueado de inmediato con error 403, garantizando que jamás se contacte a clientes reales durante la etapa de pruebas.

6. **Configuración de Google OAuth:**
   - **Orígenes de JavaScript autorizados (solo dominios base):**
     - `http://localhost:3010`
     - `https://imperia-whatsapp.vercel.app`
   - **URI de redireccionamiento autorizados (rutas completas exactas):**
     - `http://localhost:3010/api/auth/callback/google`
     - `https://imperia-whatsapp.vercel.app/api/auth/callback/google`
