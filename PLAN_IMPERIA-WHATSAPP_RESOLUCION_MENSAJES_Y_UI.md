# Plan de Arquitectura y Resolución: Imperia WhatsApp CRM

## 1. Análisis del Problema Raíz (Extracción de Mensajes)
El log actual muestra: `Plan D - No messages found in Store. Chats: 0, Global Msgs: 0`.
Al ver la captura de pantalla del navegador interno (Puppeteer), observamos la interfaz de WhatsApp Web con la lista de chats a la izquierda, pero el panel derecho está **vacío** (pantalla de inicio de WhatsApp Web).

**Causa:**
WhatsApp Web utiliza carga diferida (lazy-loading). Los mensajes de un contacto NO se descargan a la memoria del navegador (`window.Store.Msg.models`) hasta que el usuario (o el sistema) abre activamente ese chat.
La librería intentaba forzar esta descarga usando la función interna `loadEarlierMsgs`, pero WhatsApp Web actualizó su código y eliminó o renombró una dependencia llamada `waitForChatLoading`, causando el crash (Library Method Failed).

**Solución Propuesta (El Nuevo Motor de Extracción):**
Dado que las funciones internas de WhatsApp cambiaron, la forma más infalible de obligar a WhatsApp Web a cargar los mensajes es simular la acción humana.
1. Inyectaremos código en Puppeteer para buscar el chat en el DOM y hacer "clic" virtual en él, o usaremos el comando oficial interno de WhatsApp para abrir chats (`window.Store.Cmd.openChatAt(chat)`).
2. Al abrir el chat, WhatsApp Web descargará automáticamente el historial reciente.
3. Esperaremos 2 segundos.
4. Extraeremos los mensajes ya cargados usando nuestro Plan D (Global Message Store).

## 2. Análisis de Interfaz de Usuario (Ventana de Debug)
**Requerimiento:**
- El log debe volver a su tamaño anterior.
- La previsualización del navegador debe tener dimensiones de celular (vertical) para ver más interfaz.
- La ventana flotante debe tener "handles" (tiradores) para que el usuario pueda redimensionarla manualmente.

**Cambios de Estado y Lógica (DashboardPage.tsx):**
1. **Contenedor Principal:** Volveremos al diseño desacoplado o usaremos CSS `resize: both; overflow: hidden` para permitir la manipulación manual de dimensiones.
2. **Distribución:**
   - Sección superior: Log (altura controlable).
   - Sección inferior: Previsualización del navegador con `aspect-ratio` ajustado a modo vertical (ej. `3:4` o `9:16`).
3. **Estilos Tailwind:** Se agregarán utilidades como `resize-y`, `resize-x` o `resize` a los contenedores específicos para habilitar el arrastre nativo del navegador.

## 3. Pasos de Ejecución (Bloqueados temporalmente)
1. Modificar `src/lib/whatsapp.ts` para inyectar el comando de apertura de chat (`window.Store.Cmd.openChatAt()`) antes de leer los modelos de mensajes.
2. Modificar `src/app/dashboard/page.tsx` para rediseñar la ventana de diagnóstico con capacidades de redimensionamiento nativo (`resize`) y proporciones verticales para la imagen.

---
*ESTADO: FASE DE INVESTIGACIÓN COMPLETADA. ESPERANDO CAMBIO DE MODELO PARA EJECUCIÓN.*
