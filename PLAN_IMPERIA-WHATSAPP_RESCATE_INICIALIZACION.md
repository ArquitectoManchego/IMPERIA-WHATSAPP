# Plan de Rescate: Resolución de Bloqueo en Inicialización (Generando Enlace...)

## 1. Diagnóstico del Problema
El sistema se queda trabado en "Generando Enlace..." y arroja un error de **Timeout (60s)**. Esto ocurre porque el proceso de Puppeteer (el navegador invisible) no puede arrancar. Las causas más probables son:
1.  **Archivo de Bloqueo (SingletonLock):** Chromium deja un archivo llamado `SingletonLock` en la carpeta de sesión si se cierra incorrectamente. Mientras ese archivo exista, ninguna instancia nueva puede arrancar, causando que `initialize()` se quede esperando eternamente.
2.  **Procesos Huérfanos:** Instancias anteriores de Chrome/Chromium siguen vivas en segundo plano, bloqueando la carpeta de datos.
3.  **Corrupción de Sesión:** Los archivos temporales de la última sesión están corruptos y bloquean el motor de WhatsApp.

## 2. Nueva Arquitectura de Limpieza Profunda

### A. Eliminación Quirúrgica del Lock
Antes de cada inicio, el sistema buscará y eliminará físicamente el archivo de bloqueo:
- **Ruta:** `./.wwebjs_auth/session-imperia-wa-crm-v4/SingletonLock`
- Esto es lo que garantiza que Chromium no piense que ya hay otra instancia corriendo.

### B. Limpieza de Procesos Agresiva
Refactorizaremos `killOrphanSessions` para que no solo busque por el nombre `chrome.exe`, sino que sea más genérico y potente en Windows para liberar cualquier proceso vinculado a nuestra carpeta de proyecto.

### C. Modo de Diagnóstico Chromium (DUMPIO)
Añadiremos `dumpio: true` a la configuración de Puppeteer. Esto hará que todos los errores internos del navegador (que normalmente están ocultos) se impriman directamente en tu terminal, permitiéndonos ver exactamente qué le duele al navegador.

## 3. Lógica de Recuperación (Fallback)
Si tras la limpieza el sistema sigue fallando, implementaremos una **"Reinicialización Total"** que:
1. Detenga el cliente.
2. Borre la carpeta `.wwebjs_auth` por completo (como último recurso).
3. Vuelva a intentar el inicio desde cero.

## 4. Cambios de Estado
- **`isInitializing`:** Se mantendrá en `true` durante el proceso.
- **Log de Terminal:** Verás nuevos mensajes como `[Forense] Eliminando SingletonLock...` y `[Forense] Forzando cierre de procesos Chromium...`.

## 5. Instrucciones para el Usuario
Una vez que aplique estos cambios, te pediré que detengas el proceso una vez más y lo inicies. El sistema ahora debería ser capaz de "limpiar su propio camino" antes de intentar abrir el navegador.

El borrador específico está en PLAN_IMPERIA-WHATSAPP_RESCATE_INICIALIZACION.md y estoy totalmente detenido.
