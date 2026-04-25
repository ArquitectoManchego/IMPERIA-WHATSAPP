# Plan de Arquitectura: Soporte Multimedia (Ctrl+V) y Optimización de Historial

## 1. Problema: Pantalla Gris al Pegar Imagen (Ctrl+V)
**Análisis:**
El navegador no sabe cómo manejar el pegado de una imagen en un `<input type="text">` de forma nativa dentro de React sin un manejador de eventos. El "gris" es probablemente un crash silencioso o un comportamiento inesperado del DOM.

**Solución Técnica:**
1.  **Estado de Archivo Adjunto:** Añadir `const [attachment, setAttachment] = useState<string | null>(null);` en `DashboardPage`.
2.  **Manejador de Pegado (`onPaste`):**
    *   Interceptar el evento de pegado en el input.
    *   Iterar sobre `clipboardData.items`.
    *   Si es una imagen, convertirla a DataURL (Base64) usando `FileReader`.
3.  **UI de Previsualización:**
    *   Insertar un bloque de previsualización sobre la barra de entrada de mensajes.
    *   Mostrar la miniatura de la imagen y un botón para descartarla.
4.  **Envío Multimedia:**
    *   Actualizar `handleSendMessage` para incluir el campo `mediaBase64` en el POST a la API.
    *   Limpiar el estado `attachment` tras un envío exitoso.

## 2. Problema: Mensajes anteriores no cargan
**Análisis:**
Si un usuario envía un mensaje hoy, pero el historial previo es de hace 1 semana, el filtro de "2 días" por defecto oculta todo lo anterior. Esto da la sensación de que "no carga", cuando en realidad los mensajes están en memoria pero filtrados.

**Solución Técnica:**
1.  **Aviso de Historial Oculto:** Si el componente detecta que hay mensajes cargados pero filtrados por el límite de días, mostrar un banner: "Tienes mensajes antiguos ocultos. [Cargar todo el historial]".
2.  **Opción "Ver Todo":** Implementar la lógica para que `daysToLoad = 0` desactive el filtro de fecha tanto en el frontend como en el backend.
3.  **Ajuste en `lib/whatsapp.ts`:** Asegurar que `chat.fetchMessages({ limit: 100 })` sea suficiente o permitir que el botón "Cargar más" incremente este límite de forma dinámica.

## 3. Cambios en la API y Librería
*   **`sendMessage` (`lib/whatsapp.ts`):** Ya preparado para `mediaBase64`.
*   **`/api/whatsapp/send/route.ts`:** Ya preparado para recibir `mediaBase64`.
*   **`getChatMessages` (`lib/whatsapp.ts`):** Ya preparado para manejar `days=0`.

## Bloqueo de Ejecución
Este documento es un borrador final de investigación. No se realizarán cambios adicionales en el código hasta la aprobación del plan.
