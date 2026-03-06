# TaskFlow

Aplicación de gestión de tareas construida con Next.js, React, TypeScript y TailwindCSS. Consume la API pública de [DummyJSON](https://dummyjson.com/docs/todos) con CRUD completo.

---

## 🚀 Instalación y ejecución

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido (ver `.env.example`):

```
NEXT_PUBLIC_API_BASE_URL=https://dummyjson.com
```

> ⚠️ El servidor de desarrollo debe reiniciarse después de crear o modificar `.env.local`.

---

## 🛠️ Stack

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 15 | Framework principal, App Router |
| React | 19 | UI |
| TypeScript | 5 | Tipado estático |
| TailwindCSS | 4 | Estilos |
| Jest + RTL | — | Testing |

---

## 📁 Estructura del proyecto

```
pt-taskflow-joshua/
├── app/
│   ├── layout.tsx          # Layout raíz: fuentes, metadata
│   ├── page.tsx            # Única ruta "/" — SPA
│   └── globals.css         # Estilos globales + Tailwind
├── components/
│   ├── ui/
│   │   ├── TodoItem.tsx        # Item individual de tarea
│   │   ├── EmptyState.tsx      # Estado vacío reutilizable
│   │   ├── LoadingSkeleton.tsx # Skeleton de carga
│   │   ├── ErrorState.tsx      # Error con botón de retry
│   │   ├── FilterBar.tsx       # Filtros: todas/completadas/pendientes
│   │   ├── Pagination.tsx      # Controles de paginación
│   │   └── AddTodoForm.tsx     # Formulario para crear tarea
│   └── TodoList.tsx            # Orquestador: conecta hook con UI
├── hooks/
│   └── useTodos.ts         # Todo el estado y lógica de fetching
├── lib/
│   └── api.ts              # Funciones fetch puras (sin estado)
├── types/
│   └── todo.ts             # Tipos TypeScript de la API
├── __tests__/
│   ├── components/         # Tests de componentes
│   └── hooks/              # Tests del hook principal
├── .env.example
└── README.md
```

---

## ✅ Funcionalidades

- **Listado paginado** — 10 tareas por página con controles anterior/siguiente
- **Loading state** — Skeleton animado mientras carga
- **Error handling** — Mensaje claro con botón de reintentar
- **Crear tarea** — Formulario con feedback de éxito/error
- **Toggle completada/pendiente** — Con optimistic update
- **Eliminar tarea** — Con confirmación previa (`window.confirm`)
- **Filtro local** — Todas / Completadas / Pendientes sin llamadas extra a la API
- **Contador** — Muestra tareas completadas vs total en tiempo real

---

## 🧠 Decisiones técnicas

### 1. Solución de estado: `useState` + `useCallback` (sin Zustand)

**Decisión:** Se usó el estado nativo de React (`useState`, `useCallback`, `useEffect`) centralizado en un único custom hook `useTodos`.

**Justificación:** La aplicación es una SPA de una sola ruta sin estado compartido entre múltiples páginas o contextos. Zustand resuelve el problema de estado global entre rutas o componentes muy alejados en el árbol, lo cual no aplica aquí. Usarlo sería overengineering para este caso. `useState` + custom hook cumple exactamente lo que se necesita, es más legible y no agrega dependencias innecesarias.

---

### 2. Estrategia de actualización: Optimistic Update en el toggle

**Decisión:** Al marcar una tarea como completada/pendiente, el cambio se refleja en la UI **inmediatamente** antes de recibir la respuesta de la API. Si la API falla, el estado se revierte automáticamente.

**Justificación:** DummyJSON es una API pública confiable y el endpoint PATCH tiene latencia baja. El optimistic update mejora notablemente la UX sin espera visible. El rollback automático en caso de error garantiza consistencia. Esta es la estrategia estándar en apps de productividad como Notion, Linear y Todoist.

```ts
// Actualización optimista: cambia en UI antes de esperar la API
setTodos((prev) =>
  prev.map((t) => (t.id === id ? { ...t, completed: !currentCompleted } : t))
);
try {
  await updateTodo(id, { completed: !currentCompleted });
} catch {
  // Revertir si falla
  setTodos((prev) =>
    prev.map((t) => (t.id === id ? { ...t, completed: currentCompleted } : t))
  );
}
```

---

### 3. Separación de responsabilidades en capas

**Decisión:** La lógica está dividida en tres capas con responsabilidades claras:

| Capa | Archivo | Responsabilidad |
|---|---|---|
| **API Layer** | `lib/api.ts` | Solo `fetch`. Sin estado, sin lógica de negocio. Lanza errores si `!res.ok`. |
| **State Layer** | `hooks/useTodos.ts` | Todo el estado y CRUD. Llama a `lib/api.ts`. Nunca toca el DOM. |
| **UI Layer** | `components/` | Solo renderiza y dispara eventos. No llama a `fetch` directamente. |

**Justificación:** Esta separación permite testear cada capa de forma independiente, facilita el mantenimiento y hace el código predecible. Si mañana se cambia la API, solo se modifica `lib/api.ts`.

---

### 4. Manejo del límite de IDs de DummyJSON

**Decisión:** DummyJSON solo acepta IDs del 1 al 150 para operaciones de escritura (PATCH/DELETE). Las tareas creadas localmente reciben IDs > 150 de la API. Se detecta este caso y se omite la llamada a la API para esas tareas, operando solo sobre el estado local.

**Justificación:** Las operaciones POST en DummyJSON devuelven IDs incrementales que no existen realmente en el servidor. Llamar a `PATCH /todos/255` retorna 404. La solución correcta es detectar si el ID pertenece al rango real del servidor y actuar en consecuencia.

```ts
// Solo llamamos API si el ID existe en DummyJSON (rango 1-150)
if (id <= 150) {
  await updateTodo(id, { completed: !currentCompleted });
}
// Las tareas locales (id > 150) solo se actualizan en estado local
```

---

### 5. Variables de entorno con validación explícita

**Decisión:** En lugar de usar `process.env.NEXT_PUBLIC_API_BASE_URL!` directamente, se creó una función `getBaseUrl()` que lanza un error descriptivo si la variable no está definida.

**Justificación:** Facilita el debugging en entornos donde `.env.local` no se cargó correctamente. El error descriptivo es más útil que un `Cannot read properties of undefined` genérico.

```ts
function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL no está definida");
  return url;
}
```

---

## 🐛 Proceso de debugging documentado

### Problema 1: Variable de entorno `undefined` en Windows

**Síntoma:** La URL de fetch aparecía como `/undefined/todos?limit=10&skip=0`.

**Diagnóstico:** Se agregó `console.log("BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL)` en `lib/api.ts`. La consola mostró `BASE_URL: undefined`, confirmando que la variable no se leía.

**Causa raíz:** En Windows, el Explorador de archivos oculta extensiones por defecto. El archivo creado era `.env.local.txt` en lugar de `.env.local`.

**Solución:** Verificar con `Get-ChildItem -Force` en PowerShell y renombrar el archivo. Como solución de respaldo, se configuró la variable directamente en `next.config.ts` para no bloquear el desarrollo mientras se resolvía.

---

### Problema 2: PATCH/DELETE fallaban en tareas creadas localmente

**Síntoma:** Al crear una tarea y luego intentar editarla o eliminarla, la consola mostraba `404 Not Found` en `dummyjson.com/todos/255`.

**Diagnóstico:** DummyJSON retorna IDs > 150 para tareas creadas con POST (IDs simulados que no existen en el servidor real).

**Solución:** Detectar el rango del ID y omitir la llamada a la API para tareas locales, operando solo sobre el estado en memoria.

---

## 🧪 Testing

```bash
pnpm test            # Ejecutar todos los tests
pnpm test:watch      # Modo watch para desarrollo
pnpm test:coverage   # Reporte de cobertura
```

Los tests cubren los componentes reutilizables clave (`TodoItem`, `EmptyState`, `FilterBar`) y el comportamiento del hook `useTodos`, incluyendo casos de éxito, error y estados de carga.

---

## 📦 Scripts disponibles

```bash
pnpm dev        # Servidor de desarrollo
pnpm build      # Build de producción (sin errores de lint)
pnpm start      # Servidor de producción
pnpm lint       # ESLint
pnpm test       # Jest + React Testing Library
```

---

🧪 Testing

bashpnpm test            # Ejecutar todos los tests
pnpm test:watch      # Modo watch para desarrollo
pnpm test:coverage   # Reporte de cobertura
Los tests cubren los componentes reutilizables clave (TodoItem, EmptyState, FilterBar) y el comportamiento del hook useTodos, incluyendo casos de éxito, error y estados de carga.

📦 Scripts disponibles
bashpnpm dev        # Servidor de desarrollo
pnpm build      # Build de producción (sin errores de lint)
pnpm start      # Servidor de producción
pnpm lint       # ESLint
pnpm test       # Jest + React Testing Library

## 🔗 Links

- **Repositorio:** [github.com/tu-usuario/pt-taskflow-joshua](https://github.com/tu-usuario/pt-taskflow-joshua)
- **Deploy:** [pt-taskflow-joshua.vercel.app](https://pt-taskflow-joshua.vercel.app)
- **API:** [dummyjson.com/docs/todos](https://dummyjson.com/docs/todos)