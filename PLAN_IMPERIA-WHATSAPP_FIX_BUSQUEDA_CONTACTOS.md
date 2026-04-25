# Plan de Resolución: Error en Búsqueda Global de Contactos

## Análisis del Problema
**Síntoma:** El indicador muestra "¡Conexión Exitosa!", pero al escribir en la barra de búsqueda (ej. "alejandro"), la aplicación arroja "No se encontraron clientes que coincidan."
**Causa Raíz:** Durante la implementación de la precarga de los 20 chats recientes, se insertó un segundo `useEffect` para `fetchInitialData` en `src/app/dashboard/page.tsx`, dejando el original huérfano. El problema crítico es que el nuevo `useEffect` omitió la lógica de *Fallback* (rescate). Si la API `/api/sync/contacts` devuelve un arreglo vacío (lo cual sucede frecuentemente si no hay caché), la aplicación ya no está consultando directamente a la base de datos de Firestore como lo hacía antes. En consecuencia, el estado `allContacts` queda vacío y la barra de búsqueda no tiene datos contra los cuales filtrar.

## Arquitectura de la Solución (Pasos a seguir por el modelo de ejecución)

### 1. Limpieza de Código Duplicado
En `src/app/dashboard/page.tsx`, existe un `useEffect` redundante entre las líneas 40 y 108.
*   **Acción:** Eliminar este bloque completo para evitar colisiones de estado y peticiones innecesarias.

### 2. Restauración de la Lógica de Fallback de Taylor
En el `useEffect` que permanecerá (actualmente alrededor de la línea 170), se debe reinsertar la lógica de consulta a Firebase justo después de intentar usar `/api/sync/contacts`.

**Lógica exacta a reinsertar:**
```javascript
// 3. Fallback: If globalData is empty, fetch Taylor directly
if (globalData.length === 0) {
  const { db } = await import('@/lib/firebase');
  const { collection, getDocs, query } = await import('firebase/firestore');
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientsPath = `artifacts/${projectId}/public/data/clients`;
  const snapshot = await getDocs(query(collection(db, clientsPath)));
  globalData = snapshot.docs.map(doc => ({
    id: doc.id,
    nombre: doc.data().nombre,
    telefono: doc.data().telefono,
    source: 'taylor'
  }));
}
```

### 3. Verificación de Estado
Con este cambio:
1. Al cargar la página, se traerán los 20 chats recientes de WhatsApp.
2. Luego se intentará buscar la lista global. Si falla o viene vacía, se hará el fetch directo a Firebase.
3. El estado `allContacts` se poblará correctamente con todos los clientes de TAYLOR.
4. El filtro React `useMemo` volverá a funcionar perfectamente al escribir en la barra de búsqueda.
