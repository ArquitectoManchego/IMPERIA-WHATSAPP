# Análisis Forense: Deadlock (Bloqueo) de Inicialización de Puppeteer

## 1. Diagnóstico del Problema
Has reportado que tras detener el proceso manualmente y volver a iniciarlo, el sistema se queda congelado en "Generando enlace..." hasta que arroja el error: `Failed to initialize WhatsApp client: Tiempo de espera agotado al iniciar el navegador (60s)`.

Este es un escenario clásico y documentado en arquitecturas con Puppeteer (el motor de Chromium invisible que usamos para WhatsApp). 

**La Causa Raíz:**
1. Cuando detuviste el servidor de Node.js (la app), el proceso principal se cerró abruptamente.
2. Sin embargo, el navegador invisible (Chromium) no tuvo tiempo de ejecutar su rutina de apagado normal.
3. Como resultado, Chromium dejó un archivo "basura" llamado `SingletonLock` dentro de la carpeta de sesión (`.wwebjs_auth`).
4. Al reiniciar la app, el nuevo Chromium detecta ese archivo `SingletonLock` y asume (falsamente) que la sesión anterior sigue viva. Por protección, el nuevo navegador se queda esperando infinitamente a que el archivo desaparezca, provocando el bloqueo y posterior "Timeout" de 60 segundos.

## 2. Plan de Rescate (Nueva Lógica)

Para hacer que el sistema sea inmune a estos reinicios abruptos, necesitamos implementar un "Limpiador de Cerraduras" (Lock Cleaner) automático antes de cada inicio.

### A. Eliminación Quirúrgica de Archivos de Bloqueo
Añadiremos una rutina en Node.js que navegue hasta la carpeta de autenticación de WhatsApp y borre físicamente cualquier archivo de bloqueo huérfano antes de invocar a la librería.
Archivos objetivo a destruir:
- `./.wwebjs_auth/session-imperia-wa-crm-v4/SingletonLock`
- `./.wwebjs_auth/session-imperia-wa-crm-v4/SingletonCookie`

### B. Mejora del Asesino de Procesos (Kill Orphans)
Actualmente, el script de PowerShell intenta matar procesos `chrome.exe` basándose en los argumentos de la línea de comandos. Lo haremos más agresivo para asegurar que no quede ningún "zombie" ocupando la memoria o bloqueando la carpeta de perfil de Chrome.

### C. Sistema de Auto-Recuperación
Si después de intentar iniciar el cliente falla por timeout, en lugar de simplemente rendirse y mostrar "Generando enlace" para siempre, el sistema interceptará el error, destruirá la carpeta de caché por completo (forzando un inicio limpio) y lo volverá a intentar automáticamente.

## 3. Conclusión
El código actual está perfecto en su lógica de WhatsApp, pero le falta la "resiliencia de infraestructura" para sobrevivir a reinicios bruscos. Al ejecutar este plan, dotaremos al sistema de la capacidad de auto-limpiarse y evitar estos congelamientos.

El borrador específico está en PLAN_IMPERIA-WHATSAPP_ANALISIS_DEADLOCK_PUPPETEER.md y estoy totalmente detenido.
