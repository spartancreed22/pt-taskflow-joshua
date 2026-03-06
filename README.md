# TaskFlow

Aplicación de gestión de tareas construida con Next.js, React, TypeScript y TailwindCSS. Consume la API pública de DummyJSON con CRUD completo y manejo de estado local.

---

## Instalación y ejecución

```bash
pnpm install
pnpm dev
```

Abre http://localhost:3000 en tu navegador.

### Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido (ver `.env.example`):

```
NEXT_PUBLIC_API_BASE_URL=https://dummyjson.com
```

El servidor de desarrollo debe reiniciarse después de crear o modificar `.env.local`.

---

## Stack

| Tecnologia       | Version | Uso                              |
|------------------|---------|----------------------------------|
| Next.js          | 15      | Framework principal, App Router  |
| React            | 19      | UI                               |
| TypeScript       | 5       | Tipado estatico                  |
| TailwindCSS      | 4       | Estilos                          |
| shadcn/ui        | latest  | Componente Badge para contador   |
| Jest + RTL       | latest  | Testing                          |

---

## Estructura del proyecto

```
pt-taskflow-joshua/
├── app/
│   ├── layout.tsx              Layout raiz: fuentes, metadata
│   ├── page.tsx                Unica ruta "/" — SPA
│   └── globals.css             Estilos globales + Tailwind
├── components/
│   ├── ui/
│   │   ├── TodoItem.tsx        Item individual de tarea
│   │   ├── EmptyState.tsx      Estado vacio reutilizable
│   │   ├── LoadingSkeleton.tsx Skeleton de carga animado
│   │   ├── ErrorState.tsx      Error con boton de retry
│   │   ├── FilterBar.tsx       Filtros: todas/completadas/pendientes
│   │   ├── Pagination.tsx      Controles de paginacion
│   │   ├── AddTodoForm.tsx     Formulario para crear tarea
│   │   └── TaskCounter.tsx     Contador con badges de shadcn/ui
│   └── TodoList.tsx            Orquestador: conecta hook con UI
├── hooks/
│   └── useTodos.ts             Todo el estado y logica de fetching
├── lib/
│   └── api.ts                  Funciones fetch puras sin estado
├── types/
│   └── todo.ts                 Tipos TypeScript de la API
├── __tests__/
│   ├── components/
│   │   ├── EmptyState.test.tsx
│   │   ├── FilterBar.test.tsx
│   │   └── TodoItem.test.tsx
│   └── hooks/
│       └── useTodos.test.ts
├── .env.example
├── jest.config.ts
├── jest.setup.ts
└── README.md
```

---

## Funcionalidades

### Listado paginado
Las tareas se cargan desde el endpoint GET /todos con paginacion de 10 por pagina. Se incluyen controles de pagina anterior y pagina siguiente con indicador de pagina actual sobre el total.

### Loading state
Mientras la API responde se muestra un skeleton animado que replica la estructura visual de los items de tarea, evitando saltos de layout al cargar.

### Error handling con retry
Si la API falla se muestra un mensaje de error descriptivo con un boton para reintentar la carga sin necesidad de recargar la pagina.

### Crear tarea
Formulario con input de texto que llama a POST /todos/add. Al recibir respuesta exitosa la tarea se agrega al inicio del listado local sin recargar la pagina. Se muestra feedback visual de exito o error.

### Toggle completada / pendiente
Permite cambiar el estado completed de cualquier tarea llamando a PATCH /todos/{id}. El cambio se refleja de forma inmediata usando optimistic update. Si la API falla el estado se revierte automaticamente.

### Eliminar tarea
Cada tarea tiene un boton de eliminar que solicita confirmacion antes de ejecutar la operacion. Al confirmar se llama a DELETE /todos/{id} y la tarea se remueve del estado local.

### Filtro local
Filtrado del listado actual sin llamadas adicionales a la API. Las opciones son: Todas, Completadas y Pendientes.

### Contador de tareas
Muestra en tiempo real el total de tareas, cuantas estan completadas y cuantas estan pendientes usando el componente Badge de shadcn/ui.

---

## Decisiones tecnicas

### Solucion de estado: useState + useCallback sin Zustand

Se uso el estado nativo de React centralizado en un unico custom hook useTodos.

La aplicacion es una SPA de una sola ruta sin estado compartido entre multiples paginas o contextos. Zustand resuelve el problema de estado global entre rutas o componentes muy alejados en el arbol, lo cual no aplica en este caso. Usarlo seria overengineering. useState mas custom hook cumple exactamente lo que se necesita, es mas legible y no agrega dependencias innecesarias.

### Estrategia de actualizacion: Optimistic Update en el toggle

Al marcar una tarea como completada o pendiente, el cambio se refleja en la UI de forma inmediata antes de recibir la respuesta de la API. Si la API falla, el estado se revierte automaticamente al valor original.

DummyJSON es una API publica confiable con latencia baja. El optimistic update mejora notablemente la UX sin espera visible. El rollback automatico en caso de error garantiza consistencia. Esta es la estrategia estandar en apps de productividad como Notion, Linear y Todoist.

```ts
// Actualizacion optimista: cambia en UI antes de esperar la API
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

### Separacion de responsabilidades en capas

| Capa        | Archivo            | Responsabilidad                                                              |
|-------------|--------------------|------------------------------------------------------------------------------|
| API Layer   | lib/api.ts         | Solo fetch. Sin estado ni logica de negocio. Lanza errores si res.ok falla. |
| State Layer | hooks/useTodos.ts  | Todo el estado y CRUD. Llama a lib/api.ts. Nunca toca el DOM.               |
| UI Layer    | components/        | Solo renderiza y dispara eventos. No llama a fetch directamente.            |

Esta separacion permite testear cada capa de forma independiente, facilita el mantenimiento y hace el codigo predecible. Si la API cambia, solo se modifica lib/api.ts.

### Manejo del limite de IDs de DummyJSON

DummyJSON solo acepta IDs del 1 al 150 para operaciones de escritura (PATCH y DELETE). Las tareas creadas localmente reciben IDs mayores a 150 porque son IDs simulados que no existen en el servidor. Se detecta este caso y se omite la llamada a la API para esas tareas, operando unicamente sobre el estado local.

```ts
// Solo llamamos API si el ID existe en DummyJSON (rango 1-150)
if (id <= 150) {
  await updateTodo(id, { completed: !currentCompleted });
}
// Las tareas locales (id > 150) solo se actualizan en estado local
```

### Variables de entorno con validacion explicita

En lugar de usar process.env.NEXT_PUBLIC_API_BASE_URL con non-null assertion directamente, se creo una funcion getBaseUrl() que lanza un error descriptivo si la variable no esta definida. Esto facilita el debugging en entornos donde .env.local no se cargo correctamente.

```ts
function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL no esta definida");
  return url;
}
```

### Uso de shadcn/ui

Se integro el componente Badge de shadcn/ui para el contador de tareas. Se eligio esta libreria porque esta mencionada explicitamente en el stack sugerido del proyecto y tiene uso concreto y justificado, sin forzar su inclusion.

---

## Proceso de debugging documentado

### Problema 1: Variable de entorno undefined en Windows

Sintoma: La URL de fetch aparecia como /undefined/todos?limit=10&skip=0.

Diagnostico: Se agrego console.log("BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL) en lib/api.ts. La consola mostro BASE_URL: undefined, confirmando que la variable no se leia.

Causa raiz: En Windows, el Explorador de archivos oculta extensiones por defecto. El archivo creado era .env.local.txt en lugar de .env.local.

Solucion: Verificar con Get-ChildItem -Force en PowerShell y renombrar el archivo. Como solucion de respaldo, se configuro la variable directamente en next.config.ts para no bloquear el desarrollo mientras se resolvia.

### Problema 2: PATCH y DELETE fallaban en tareas creadas localmente

Sintoma: Al crear una tarea y luego intentar editarla o eliminarla, la consola mostraba 404 Not Found en dummyjson.com/todos/255.

Diagnostico: DummyJSON retorna IDs mayores a 150 para tareas creadas con POST. Esos IDs no existen en el servidor para operaciones de escritura.

Solucion: Detectar el rango del ID y omitir la llamada a la API para tareas locales, operando solo sobre el estado en memoria.

---

## Testing

```bash
pnpm test             # Ejecutar todos los tests
pnpm test:watch       # Modo watch para desarrollo
pnpm test:coverage    # Reporte de cobertura
```

Se implementaron 27 tests con Jest y React Testing Library cubriendo los componentes reutilizables y el comportamiento completo del hook useTodos.

| Archivo               | Tests | Que cubre                                              |
|-----------------------|-------|--------------------------------------------------------|
| EmptyState.test.tsx   | 3     | Props opcionales y render condicional                  |
| FilterBar.test.tsx    | 5     | Interaccion de usuario y estilos activos               |
| TodoItem.test.tsx     | 7     | Estados visuales, toggle, delete con confirmacion      |
| useTodos.test.ts      | 12    | Loading, error, filtros, CRUD, optimistic update, rollback, paginacion |

---

## Scripts disponibles

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de produccion sin errores de lint
pnpm start        # Servidor de produccion
pnpm lint         # ESLint
pnpm test         # Jest + React Testing Library
pnpm test:watch   # Tests en modo watch
pnpm test:coverage # Reporte de cobertura de tests
```

---

## Proximas mejoras

Se esta trabajando en una barra de busqueda en tiempo real para filtrar tareas por texto. Esta funcionalidad operara de forma local sobre los datos ya cargados en el estado de la aplicacion, sin realizar llamadas adicionales a la API, siguiendo el mismo patron del filtro por estado ya implementado.

---

## Links

- Repositorio: https://github.com/spartancreed22/pt-taskflow-joshua
- Deploy: https://pt-taskflow-joshua.vercel.app
- API: https://dummyjson.com/docs/todos