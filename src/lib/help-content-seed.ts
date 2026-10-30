import type { HelpCategory, HelpArticle } from './help-types.ts';

export const INITIAL_HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'primeros-pasos',
    title: 'Primeros Pasos',
    icon: 'Sparkles',
    description: 'Conoce la plataforma IMPERIA, cómo iniciar sesión y conectar el motor de WhatsApp.',
    order: 1,
    subcategories: [
      { id: 'inicio', categoryId: 'primeros-pasos', title: 'Acceso y Configuración', order: 1 },
      { id: 'motor', categoryId: 'primeros-pasos', title: 'Conexión WhatsApp', order: 2 }
    ]
  },
  {
    id: 'mensajes',
    title: 'Mensajes & Chat',
    icon: 'MessageSquare',
    description: 'Bandeja de chats, respuestas rápidas, notas de voz PTT, agendado y modo privacidad.',
    order: 2,
    subcategories: [
      { id: 'bandeja', categoryId: 'mensajes', title: 'Bandeja y Pestañas Rápidas', order: 1 },
      { id: 'redaccion', categoryId: 'mensajes', title: 'Herramientas de Envío', order: 2 },
      { id: 'privacidad', categoryId: 'mensajes', title: 'Privacidad y Seguridad', order: 3 }
    ]
  },
  {
    id: 'crm',
    title: 'Pipeline CRM',
    icon: 'Kanban',
    description: 'Gestión del embudo comercial, etapas de ventas, seguimiento y ficha del cliente.',
    order: 3,
    subcategories: [
      { id: 'kanban', categoryId: 'crm', title: 'Tablero Kanban', order: 1 },
      { id: 'etapas', categoryId: 'crm', title: 'Movimiento de Etapas', order: 2 }
    ]
  },
  {
    id: 'campanas',
    title: 'Campañas Masivas',
    icon: 'Megaphone',
    description: 'Envíos masivos personalizados, protección anti-baneo con IA y pausas inteligentes.',
    order: 4,
    subcategories: [
      { id: 'creacion', categoryId: 'campanas', title: 'Creación y Segmentación', order: 1 },
      { id: 'antiban', categoryId: 'campanas', title: 'Protección Anti-Baneo', order: 2 }
    ]
  },
  {
    id: 'automatizaciones',
    title: 'Automatizaciones',
    icon: 'Bot',
    description: 'Chatbot sin código, reglas condicionales, respuestas automáticas y flujos.',
    order: 5,
    subcategories: [
      { id: 'reglas', categoryId: 'automatizaciones', title: 'Reglas y Disparadores', order: 1 }
    ]
  },
  {
    id: 'pedidos',
    title: 'Pedidos & Confección',
    icon: 'Package',
    description: 'Seguimiento de pedidos de uniforme, vinculación con TAYLOR y notificaciones.',
    order: 6,
    subcategories: [
      { id: 'estados', categoryId: 'pedidos', title: 'Estados de Pedido', order: 1 },
      { id: 'notificaciones', categoryId: 'pedidos', title: 'Avisos al Cliente', order: 2 }
    ]
  },
  {
    id: 'clientes',
    title: 'Clientes & Etiquetas',
    icon: 'Users',
    description: 'Módulo de clientes, edición masiva y filtros combinados por instituciones (UV).',
    order: 7,
    subcategories: [
      { id: 'directorio', categoryId: 'clientes', title: 'Directorio y Edición Masiva', order: 1 },
      { id: 'tags', categoryId: 'clientes', title: 'Etiquetas Institucionales', order: 2 }
    ]
  },
  {
    id: 'fidelidad',
    title: 'Fidelidad & Reseñas',
    icon: 'Award',
    description: 'Tarjeta cliente frecuente, puntos acumulados, recompensas y encuestas de satisfacción.',
    order: 8,
    subcategories: [
      { id: 'puntos', categoryId: 'fidelidad', title: 'Puntos y Niveles', order: 1 },
      { id: 'resenas', categoryId: 'fidelidad', title: 'Calificaciones de Tienda', order: 2 }
    ]
  },
  {
    id: 'facturacion',
    title: 'Facturación',
    icon: 'Receipt',
    description: 'Módulo de comprobantes fiscales, timbrado y control de facturas por cliente.',
    order: 9,
    subcategories: [
      { id: 'comprobantes', categoryId: 'facturacion', title: 'Emisión y Registro', order: 1 }
    ]
  },
  {
    id: 'estadisticas',
    title: 'Estadísticas & Métricas',
    icon: 'BarChart3',
    description: 'Métricas del ecosistema comercial, conversión de clientes y tiempos de atención.',
    order: 10,
    subcategories: [
      { id: 'metricas', categoryId: 'estadisticas', title: 'Rendimiento y Reportes', order: 1 }
    ]
  },
  {
    id: 'soporte-tecnico',
    title: 'Solución de Problemas',
    icon: 'HelpCircle',
    description: 'Resolución de errores de conexión, permisos de Firebase y reconexión del motor.',
    order: 11,
    subcategories: [
      { id: 'diagnostico', categoryId: 'soporte-tecnico', title: 'Diagnóstico del Motor', order: 1 }
    ]
  }
];

export const INITIAL_HELP_ARTICLES: HelpArticle[] = [
  // --- PRIMEROS PASOS ---
  {
    id: 'que-es-imperia',
    slug: 'primeros-pasos/inicio/que-es-imperia',
    categoryId: 'primeros-pasos',
    subcategoryId: 'inicio',
    title: '¿Qué es IMPERIA WhatsApp CRM?',
    summary: 'Visión general de la plataforma unificada para atención comercial, confección y fidelidad.',
    keywords: ['introduccion', 'que es', 'general', 'bienvenida', 'resumen'],
    moduleRoute: '/dashboard',
    order: 1,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'callout',
        tone: 'tip',
        title: 'Ecosistema Integrado',
        text: 'IMPERIA combina WhatsApp Web multi-atendente, un CRM tipo Kanban, integración en tiempo real con TAYLOR para pedidos de confección y un programa de lealtad con encuestas de satisfacción.'
      },
      {
        type: 'paragraph',
        text: 'Esta plataforma está diseñada para que el equipo comercial atienda de forma centralizada a clientes, prospectos y estudiantes de diversas facultades (como UV Enfermería, UV Medicina, etc.), automatizando recordatorios y manteniendo trazabilidad total de cada venta.'
      },
      {
        type: 'diagram',
        title: 'Arquitectura del Ecosistema IMPERIA',
        mermaid: `flowchart TD
  W[Cliente en WhatsApp] <-->|Mensajes & PTT| E[Motor OpenWA / WhatsApp]
  E <--> API[API Gateway IMPERIA]
  API <--> CRM[(Firestore CRM)]
  API <--> TY[Sistema de Pedidos TAYLOR]
  API <--> FID[Fidelidad & Reseñas Tienda]
  API <--> DASH[Dashboard Web Asesor]`,
        caption: 'Flujo de comunicación entre el cliente, el motor de WhatsApp y los sistemas internos.'
      },
      {
        type: 'table',
        title: 'Capacidades Principales',
        headers: ['Módulo', 'Función Principal', 'Beneficio'],
        rows: [
          ['Mensajes', 'Chat multi-agente con notas de voz PTT y agendado', 'Atención sin límites desde una sola línea'],
          ['CRM Kanban', 'Control de prospectos por etapas comerciales', 'Cero cotizaciones perdidas'],
          ['Campañas', 'Envíos masivos con IA anti-baneo', 'Reactivación de clientes inactivos'],
          ['Fidelidad', 'Monedero de puntos y reseñas en Google', 'Incremento en recomendaciones y recompras'],
          ['Pedidos', 'Avisos de cambio de fecha y listo para recoger', 'Ahorro de horas en llamadas manuales']
        ]
      }
    ]
  },
  {
    id: 'conexion-whatsapp',
    slug: 'primeros-pasos/motor/conexion-whatsapp',
    categoryId: 'primeros-pasos',
    subcategoryId: 'motor',
    title: 'Conexión y Estado del Motor WhatsApp',
    summary: 'Cómo escanear el código QR, monitorear la salud del motor y reiniciar la conexión.',
    keywords: ['qr', 'conectar', 'motor', 'openwa', 'desconectado', 'reiniciar'],
    moduleRoute: '/dashboard',
    order: 2,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'paragraph',
        text: 'Para que la aplicación envíe y reciba mensajes, el motor interno de WhatsApp debe encontrarse en estado CONECTADO. Si es la primera vez que se accede, se desplegará un código QR para vincular el dispositivo.'
      },
      {
        type: 'steps',
        title: 'Pasos para Vincular WhatsApp',
        items: [
          {
            step: 1,
            title: 'Abrir WhatsApp en tu teléfono',
            description: 'Dirígete a Ajustes o Configuración y selecciona "Dispositivos vinculados".'
          },
          {
            step: 2,
            title: 'Tocar "Vincular un dispositivo"',
            description: 'Apunta la cámara del teléfono hacia el código QR mostrado en la pantalla de IMPERIA.'
          },
          {
            step: 3,
            title: 'Esperar la sincronización',
            description: 'En cuestión de segundos, la barra de estado superior cambiará a verde ("CONECTADO").',
            tip: 'Si la barra permanece en amarillo por más de un minuto, oprime el botón "Reiniciar Conexión".'
          }
        ]
      },
      {
        type: 'callout',
        tone: 'warning',
        title: '¿Qué hacer si dice "Missing or insufficient permissions"?',
        text: 'Ese aviso de Firebase ocurre si la sesión de Google expiró. Simplemente cierra sesión desde la barra lateral izquierda y vuelve a iniciar sesión con tu cuenta autorizada.'
      }
    ]
  },

  // --- MENSAJES & CHAT ---
  {
    id: 'pestanas-rapidas',
    slug: 'mensajes/bandeja/pestanas-rapidas',
    categoryId: 'mensajes',
    subcategoryId: 'bandeja',
    title: 'Barra de Pestañas Rápidas y Filtros',
    summary: 'Filtra al instante entre Todos, No leídos, Con Pedidos, Fidelidad VIP, Grupos y Sin Responder.',
    keywords: ['pestañas', 'tabs', 'filtro', 'no leidos', 'vip', 'grupos', 'sin responder'],
    moduleRoute: '/dashboard',
    order: 1,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'paragraph',
        text: 'Ubicada directamente sobre la lista de contactos en la columna izquierda, la barra de pestañas rápidas clasifica tus conversaciones en tiempo real con contadores automáticos.'
      },
      {
        type: 'table',
        title: 'Clasificación de Pestañas',
        headers: ['Pestaña', 'Condición de Filtrado', 'Uso Recomendado'],
        rows: [
          ['Todos', 'Muestra todos los contactos sincronizados.', 'Visión general de la bandeja'],
          ['No leídos', 'Chats con mensajes entrantes pendientes de revisar.', 'Prioridad número 1 al iniciar el día'],
          ['Con Pedidos', 'Clientes con pedidos registrados o en confección.', 'Atención a entregas y cotizaciones'],
          ['Fidelidad VIP', 'Clientes de Nivel Oro, Diamante o con más de 200 puntos.', 'Trato preferencial y ofertas exclusivas'],
          ['Grupos', 'Comunidades escolares o chats grupales (@g.us).', 'Comunicados institucionales'],
          ['Sin Responder', 'Mensajes entrantes que no han recibido réplica del asesor.', 'Evitar abandono de prospectos']
        ]
      },
      {
        type: 'callout',
        tone: 'tip',
        text: 'Puedes combinar estas pestañas con el buscador de texto y las etiquetas institucionales apilables para localizar de inmediato a clientes específicos.'
      }
    ]
  },
  {
    id: 'agendar-mensajes',
    slug: 'mensajes/redaccion/agendar-mensajes',
    categoryId: 'mensajes',
    subcategoryId: 'redaccion',
    title: 'Agendamiento de Mensajes para Envío Futuro',
    summary: 'Programa recordatorios, citas y avisos de entrega para una fecha y hora determinada.',
    keywords: ['agendar', 'programar', 'reloj', 'fecha', 'hora', 'futuro'],
    moduleRoute: '/dashboard',
    order: 2,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'paragraph',
        text: 'La función de agendamiento permite redactar un mensaje y definir cuándo debe entregarse. Un servicio en segundo plano revisa cada 15 segundos los mensajes programados y los despacha de forma desatendida.'
      },
      {
        type: 'steps',
        title: 'Cómo Agendar un Mensaje',
        items: [
          {
            step: 1,
            title: 'Abrir el chat del cliente',
            description: 'Selecciona la conversación del destinatario en la lista izquierda.'
          },
          {
            step: 2,
            title: 'Oprimir el botón de reloj',
            description: 'En la barra de herramientas inferior, haz clic en el icono de reloj azul (Agendar Mensaje).'
          },
          {
            step: 3,
            title: 'Seleccionar fecha, hora y texto',
            description: 'Elige el momento exacto. Puedes insertar variables como {primer_nombre} o {puntos}.'
          },
          {
            step: 4,
            title: 'Confirmar programación',
            description: 'Haz clic en "Agendar Mensaje". Verás una insignia amarilla en la cabecera del chat con el número de mensajes programados pendientes.'
          }
        ]
      },
      {
        type: 'callout',
        tone: 'info',
        text: 'Los mensajes programados se envían automáticamente siempre que el sistema tenga conexión a internet y el motor esté activo.'
      }
    ]
  },
  {
    id: 'notas-de-voz-ptt',
    slug: 'mensajes/redaccion/notas-de-voz-ptt',
    categoryId: 'mensajes',
    subcategoryId: 'redaccion',
    title: 'Notas de Voz Nativas (PTT) con Micrófono',
    summary: 'Graba notas de voz en el navegador y envíalas con formato nativo de WhatsApp (micrófono verde).',
    keywords: ['audio', 'ptt', 'nota de voz', 'microfono', 'grabar', 'verde'],
    moduleRoute: '/dashboard',
    order: 3,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'paragraph',
        text: 'A diferencia de enviar un archivo de audio como archivo adjunto, las notas de voz PTT (Push-To-Talk) se muestran en el WhatsApp del cliente con la onda sonora y el círculo de micrófono verde, simulando una grabación en vivo.'
      },
      {
        type: 'steps',
        title: 'Proceso de Grabación',
        items: [
          {
            step: 1,
            title: 'Clic en el icono de micrófono',
            description: 'Ubicado a un costado del botón de enviar mensaje.'
          },
          {
            step: 2,
            title: 'Grabar tu mensaje',
            description: 'Verás el temporizador en vivo avanzando y una animación de onda sonora roja.'
          },
          {
            step: 3,
            title: 'Enviar o cancelar',
            description: 'Oprime la palomita verde para despacharlo de inmediato, o la X roja para descartar la grabación.'
          }
        ]
      }
    ]
  },
  {
    id: 'modo-privacidad',
    slug: 'mensajes/privacidad/modo-privacidad',
    categoryId: 'mensajes',
    subcategoryId: 'privacidad',
    title: 'Modo Privacidad & Blur (Anti-Espía)',
    summary: 'Oculta nombres, números y mensajes al proyectar pantalla o recibir visitas en mostrador.',
    keywords: ['privacidad', 'blur', 'desenfoque', 'anti espia', 'pantalla', 'seguridad'],
    moduleRoute: '/dashboard',
    order: 4,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'paragraph',
        text: 'El modo privacidad aplica un desenfoque inteligente sobre nombres de clientes, números telefónicos, fotos de perfil y burbujas de conversación. Es ideal cuando estás compartiendo pantalla en videollamada o atendiendo a clientes en la tienda física.'
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Efecto Desenfoque al Pasar el Ratón (Hover)',
        text: 'Cuando el modo privacidad está activado, basta con posicionar el cursor sobre cualquier texto o imagen para que se revele nítidamente de forma momentánea.'
      },
      {
        type: 'steps',
        title: 'Cómo Activar el Modo Privacidad',
        items: [
          {
            step: 1,
            title: 'Localizar el icono de ojo',
            description: 'Puedes activarlo tanto en la cabecera de la lista de chats como en la barra lateral izquierda.'
          },
          {
            step: 2,
            title: 'Conmutar entre Ojo Abierto / Ojo Tachado',
            description: 'Al activarse, la interfaz entera protege los datos personales al instante.'
          }
        ]
      }
    ]
  },

  // --- CRM PIPELINE ---
  {
    id: 'pipeline-kanban',
    slug: 'crm/kanban/pipeline-kanban',
    categoryId: 'crm',
    subcategoryId: 'kanban',
    title: 'Gestión del Embudo Comercial Kanban',
    summary: 'Cómo organizar y dar seguimiento a los prospectos a través de las columnas del embudo.',
    keywords: ['crm', 'kanban', 'embudo', 'etapas', 'prospectos', 'ventas'],
    moduleRoute: '/dashboard/crm',
    order: 1,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'paragraph',
        text: 'El módulo de CRM organiza visualmente a todos tus prospectos en columnas representativas de cada etapa del proceso de venta.'
      },
      {
        type: 'diagram',
        title: 'Etapas del Pipeline Comercial',
        mermaid: `flowchart LR
  P[Prospecto Nuevo] --> C[Cotización Enviada]
  C --> N[Negociación]
  N --> CG[Cerrado Ganado]
  N --> CP[Cerrado Perdido]`,
        caption: 'Recorrido estándar de un cliente desde su primer mensaje hasta el cierre.'
      },
      {
        type: 'table',
        title: 'Descripción de las Etapas',
        headers: ['Etapa', 'Objetivo Comercial', 'Acción Sugerida'],
        rows: [
          ['Prospecto', 'Primer contacto o solicitud de información.', 'Identificar institución y prendas de interés.'],
          ['Cotización', 'Precios enviados al cliente.', 'Hacer seguimiento a las 24 horas.'],
          ['Negociación', 'Ajuste de tallas, bordados o condiciones.', 'Enviar catálogo y resolver dudas.'],
          ['Cerrado Ganado', 'Venta concretada o anticipo pagado.', 'Crear pedido en TAYLOR y entregar tarjeta fidelidad.'],
          ['Cerrado Perdido', 'Cliente desistió o compró en otro lugar.', 'Registrar motivo y reactivar en 30 días.']
        ]
      }
    ]
  },

  // --- CAMPAÑAS ---
  {
    id: 'campanas-ia-antiban',
    slug: 'campanas/antiban/campanas-ia-antiban',
    categoryId: 'campanas',
    subcategoryId: 'antiban',
    title: 'Campañas Masivas y Protección Anti-Baneo con IA',
    summary: 'Envío de comunicados masivos con paráfrasis inteligente para evitar penalizaciones de WhatsApp.',
    keywords: ['campañas', 'masivo', 'anti ban', 'gemini', 'ia', 'difusion'],
    moduleRoute: '/dashboard/campanas',
    order: 1,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'paragraph',
        text: 'WhatsApp penaliza a las cuentas que envían el mismo texto idéntico a muchos contactos en poco tiempo. El motor de campañas de IMPERIA cuenta con dos salvaguardas avanzadas: IA Paraphrasing y Pausas Aleatorias.'
      },
      {
        type: 'callout',
        tone: 'danger',
        title: 'Regla de Oro Anti-Spam',
        text: 'Nunca envíes promociones a destinatarios que no hayan iniciado conversación previa contigo o que no sean clientes registrados.'
      },
      {
        type: 'table',
        title: 'Mecanismos de Protección',
        headers: ['Mecanismo', 'Cómo Funciona', 'Impacto'],
        rows: [
          ['Variación IA', 'Gemini reescribe cada mensaje de forma ligeramente distinta pero con el mismo mensaje comercial.', 'Rompe los patrones de hash repetitivo.'],
          ['Variables Dinámicas', 'Inserta {primer_nombre}, {puntos} o {empresa}.', 'Personaliza el texto para cada persona.'],
          ['Pausa Aleatoria', 'Espera entre 4 y 10 segundos entre cada despacho.', 'Imita el comportamiento de un operador humano.']
        ]
      }
    ]
  },

  // --- AUTOMATIZACIONES ---
  {
    id: 'chatbot-reglas',
    slug: 'automatizaciones/reglas/chatbot-reglas',
    categoryId: 'automatizaciones',
    subcategoryId: 'reglas',
    title: 'Chatbot sin Código y Reglas de Respuesta',
    summary: 'Configuración de palabras clave y disparadores automáticos fuera de horario.',
    keywords: ['chatbot', 'automatizacion', 'reglas', 'auto respuesta', 'disparadores'],
    moduleRoute: '/dashboard/automatizaciones',
    order: 1,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'paragraph',
        text: 'Crea flujos de atención automática sin escribir código. El chatbot puede responder preguntas frecuentes sobre ubicación, horarios, precios de filipinas, batas y entrega de credenciales.'
      },
      {
        type: 'steps',
        title: 'Cómo Crear una Regla Automática',
        items: [
          {
            step: 1,
            title: 'Definir el disparador (Trigger)',
            description: 'Selecciona si responderá por coincidencia de palabras clave (ej: "precio", "horario", "ubicación") o ante cualquier mensaje fuera de horario.'
          },
          {
            step: 2,
            title: 'Configurar condiciones',
            description: 'Opcionalmente filtra por etiquetas o etapa del CRM para no interrumpir negociaciones activas.'
          },
          {
            step: 3,
            title: 'Asignar la respuesta y acción',
            description: 'Escribe el texto de respuesta y, si lo deseas, agrega una etiqueta automática o mueve al cliente de etapa.'
          }
        ]
      }
    ]
  },

  // --- PEDIDOS & TAYLOR ---
  {
    id: 'pedidos-taylor',
    slug: 'pedidos/estados/pedidos-taylor',
    categoryId: 'pedidos',
    subcategoryId: 'estados',
    title: 'Seguimiento de Pedidos y Sincronización con TAYLOR',
    summary: 'Cómo se reflejan los pedidos de confección y cuándo se notifican los cambios al cliente.',
    keywords: ['pedidos', 'taylor', 'confeccion', 'tallas', 'fecha entrega', 'recoger'],
    moduleRoute: '/dashboard/pedidos',
    order: 1,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'paragraph',
        text: 'El sistema se sincroniza periódicamente con la base de datos de producción de uniformes TAYLOR, informando a los clientes en los momentos exactos del ciclo de confección.'
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Regla de Notificación Precisa',
        text: 'Los avisos de entrega nunca inventan fechas: solo se envían al cliente cuando el pedido cambia efectivamente al estado LISTO PARA RECOGER o cuando se actualiza la fecha comprometida en el taller.'
      }
    ]
  },

  // --- MÓDULO OCULTO: CLIENTES & ETIQUETAS ---
  {
    id: 'clientes-etiquetas-uv',
    slug: 'clientes/tags/clientes-etiquetas-uv',
    categoryId: 'clientes',
    subcategoryId: 'tags',
    title: 'Módulo de Clientes y Etiquetas Jerárquicas UV',
    summary: 'Directorio completo, edición masiva y filtrado estricto por institución y facultad.',
    keywords: ['clientes', 'etiquetas', 'tags', 'universidad', 'enfermeria', 'edicion masiva'],
    moduleRoute: '/dashboard/clientes',
    order: 1,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'callout',
        tone: 'tip',
        title: 'Módulo Accesible en la Ruta /dashboard/clientes',
        text: 'Este directorio permite gestionar a todos los clientes registrados, aplicar etiquetas de forma masiva y exportar la lista de contactos.'
      },
      {
        type: 'paragraph',
        text: 'Las etiquetas institucionales permiten clasificar con precisión quirúgica a los clientes. Por ejemplo, puedes etiquetar a un cliente como "Universidad Veracruzana" y además "Facultad de Enfermería".'
      },
      {
        type: 'diagram',
        title: 'Filtro Apilable con Lógica "Y"',
        mermaid: `flowchart LR
  T1[Tag: Universidad Veracruzana] --> INTER{Lógica Y Estricta}
  T2[Tag: Facultad de Enfermería] --> INTER
  INTER --> RES[Clientes que cumplen AMBAS etiquetas]`,
        caption: 'Al seleccionar múltiples etiquetas en el filtro, solo se muestran los clientes que tengan TODAS las seleccionadas.'
      }
    ]
  },

  // --- FIDELIDAD & RESEÑAS ---
  {
    id: 'programa-fidelidad',
    slug: 'fidelidad/puntos/programa-fidelidad',
    categoryId: 'fidelidad',
    subcategoryId: 'puntos',
    title: 'Programa de Fidelidad, Puntos y Calificación de Tienda',
    summary: 'Monedero de lealtad, tarjeta virtual, encuestas por estrellas y reseñas en Google.',
    keywords: ['fidelidad', 'puntos', 'tarjeta frecuente', 'reseñas', 'estrellas', 'encuesta', 'google'],
    moduleRoute: '/dashboard',
    order: 1,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'paragraph',
        text: 'Al abrir el perfil de cualquier cliente, puedes ver de inmediato si ya cuenta con su tarjeta de cliente frecuente, cuántos puntos tiene acumulados por sus compras y qué beneficio tiene disponible para canjear.'
      },
      {
        type: 'table',
        title: 'Niveles de Lealtad y Beneficios',
        headers: ['Nivel', 'Puntos Requeridos', 'Beneficio en Tienda'],
        rows: [
          ['Bronce', '0 - 99 pts', 'Acumula el 5% de sus compras en puntos'],
          ['Plata', '100 - 299 pts', 'Bordado de nombre gratis en su siguiente prenda'],
          ['Oro', '300 - 599 pts', '10% de descuento directo + accesorio médico de regalo'],
          ['Diamante', '600+ pts', 'Prenda superior de obsequio + atención prioritaria']
        ]
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Historial de Encuestas y Reseñas en Google',
        text: 'En el modal de la foto del cliente podrás consultar las estrellas otorgadas en cada visita a la tienda, los comentarios positivos/negativos que dejó en la encuesta y su calificación en Google Maps.'
      }
    ]
  },

  // --- MÓDULO OCULTO: FACTURACIÓN ---
  {
    id: 'modulo-facturacion',
    slug: 'facturacion/comprobantes/modulo-facturacion',
    categoryId: 'facturacion',
    subcategoryId: 'comprobantes',
    title: 'Módulo de Facturación y Comprobantes Fiscales',
    summary: 'Control de CFDI, emisión de facturas y vinculación con pedidos del cliente.',
    keywords: ['factura', 'cfdi', 'sat', 'comprobante', 'facturacion'],
    moduleRoute: '/dashboard/facturacion',
    order: 1,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'paragraph',
        text: 'Ubicado en la ruta /dashboard/facturacion, este módulo centraliza el registro fiscal de las ventas de mostrador y pedidos institucionales.'
      },
      {
        type: 'steps',
        title: 'Generación de Comprobante Fiscal',
        items: [
          {
            step: 1,
            title: 'Buscar el pedido o cliente',
            description: 'Introduce el folio de la nota o el teléfono del cliente para traer sus datos fiscales.'
          },
          {
            step: 2,
            title: 'Verificar datos de facturación',
            description: 'RFC, Razón Social, Régimen Fiscal y Uso de CFDI.'
          },
          {
            step: 3,
            title: 'Emitir y enviar por WhatsApp',
            description: 'Una vez timbrada, el PDF y XML se pueden remitir con un solo clic al chat de WhatsApp del cliente.'
          }
        ]
      }
    ]
  },

  // --- MÓDULO OCULTO: ESTADÍSTICAS ---
  {
    id: 'modulo-estadisticas',
    slug: 'estadisticas/metricas/modulo-estadisticas',
    categoryId: 'estadisticas',
    subcategoryId: 'metricas',
    title: 'Módulo de Estadísticas y Métricas del Ecosistema',
    summary: 'Tableros de rendimiento por asesor, tiempos de respuesta y clientes estrella.',
    keywords: ['metricas', 'estadisticas', 'kpi', 'rendimiento', 'reportes'],
    moduleRoute: '/dashboard/stats',
    order: 1,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'paragraph',
        text: 'Accesible desde la ruta /dashboard/stats, este módulo proporciona visibilidad del rendimiento global del equipo y el impacto de las campañas.'
      },
      {
        type: 'table',
        title: 'Indicadores Clave de Desempeño (KPIs)',
        headers: ['Métrica', 'Definición', 'Meta Sugerida'],
        rows: [
          ['Tiempo de Primera Respuesta', 'Minutos transcurridos hasta el primer mensaje del asesor.', '< 5 minutos en horario comercial'],
          ['Tasa de Conversión Kanban', 'Porcentaje de prospectos que pasan a Cerrado Ganado.', '> 35%'],
          ['Satisfacción de Tienda (CSAT)', 'Promedio de estrellas de la encuesta de visita.', '> 4.7 / 5 estrellas'],
          ['Retención de Fidelidad', 'Clientes que realizan una segunda compra en menos de 90 días.', '> 40%']
        ]
      }
    ]
  },

  // --- SOLUCIÓN DE PROBLEMAS ---
  {
    id: 'diagnostico-reconexion',
    slug: 'soporte-tecnico/diagnostico/diagnostico-reconexion',
    categoryId: 'soporte-tecnico',
    subcategoryId: 'diagnostico',
    title: 'Guía de Diagnóstico y Reconexión del Motor',
    summary: 'Qué hacer ante fallos de conexión, navegador colgado o permisos insuficientes.',
    keywords: ['error', 'fallo', 'motor', 'reducir', 'reparar', 'no conecta', 'logs'],
    moduleRoute: '/dashboard',
    order: 1,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        type: 'callout',
        tone: 'danger',
        title: 'Paso 1: Abrir la Consola de Logs',
        text: 'En el panel superior derecho, oprime el botón "Debug" o "Monitor de Motor". Podrás ver en vivo los eventos del navegador interno y la causa exacta de cualquier anomalía.'
      },
      {
        type: 'table',
        title: 'Síntomas y Soluciones Frecuentes',
        headers: ['Problema', 'Causa Probable', 'Solución Paso a Paso'],
        rows: [
          [
            'Motor se queda en "Iniciando..."',
            'Instancia de Chromium previa en suspensión.',
            'Oprime "Reiniciar Conexión". El servidor reinicializará la sesión de WhatsApp limpia.'
          ],
          [
            'Missing or insufficient permissions en consola',
            'Sesión de Firebase vencida o falta de token.',
            'Cierra sesión con el botón de salir en la barra lateral y vuelve a autenticarte con Google.'
          ],
          [
            'No se envió imagen pegada con texto',
            'Navegador bloqueó el portapapeles o tamaño excesivo.',
            'Usa el icono del clip para adjuntar la imagen o cópiala directamente con Ctrl+V dentro del recuadro.'
          ],
          [
            'No se ven contactos sincronizados',
            'Caché local desfasada.',
            'Haz clic en el icono de refrescar en la cabecera de la lista de chats o activa el checkbox de sincronizar historial.'
          ]
        ]
      }
    ]
  }
];
