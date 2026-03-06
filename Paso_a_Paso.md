# TaskFlow 🗂️

Aplicación de gestión de tareas construida con **Next.js 14**, **TypeScript** y **TailwindCSS**, que consume la API pública de [DummyJSON](https://dummyjson.com/docs/todos).

---

## 🚀 Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/pt-taskflow-[tu-nombre].git
cd pt-taskflow-[tu-nombre]

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores (ver sección de Variables de entorno)

# 4. Correr en desarrollo
pnpm dev
```

El proyecto correrá en [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Stack

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 14 (App Router) | Framework principal |
| React | 18 | UI |
| TypeScript | 5 | Tipado estático |
| TailwindCSS | 3 | Estilos |

---

## 📁 Estructura del proyecto

```
pt-taskflow-[nombre]/
├── app/
│   ├── layout.tsx          # Layout raíz (HTML, fuentes, metadata)
│   ├── page.tsx            # Página principal (única ruta "/")
│   └── globals.css         # Estilos globales + Tailwind
├── components/
│   ├── ui/
│   │   ├── TodoItem.tsx        # Componente de una tarea individual
│   │   ├── EmptyState.tsx      # Estado vacío reutilizable
│   │   ├── LoadingSkeleton.tsx # Estado de carga (skeleton)
│   │   ├── ErrorState.tsx      # Estado de error con botón reintentar
│   │   ├── FilterBar.tsx       # Filtros: Todas / Completadas / Pendientes
│   │   ├── Pagination.tsx      # Controles de paginación
│   │   └── AddTodoForm.tsx     # Formulario para crear tarea
│   └── TodoList.tsx        # Orquestador: conecta hooks con componentes UI
├── hooks/
│   └── useTodos.ts         # Custom hook: todo el estado y fetching CRUD
├── lib/
│   └── api.ts              # Funciones fetch puras (sin estado)
├── types/
│   └── todo.ts             # Tipos TypeScript de la API
├── .env.example
├── .eslintrc.json
├── .prettierrc
└── README.md
```

---

## 🌍 Variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto (nunca subir a git):

```env
NEXT_PUBLIC_API_BASE_URL=https://dummyjson.com
```

Ver `.env.example` como referencia.

> **Nota sobre Windows:** Si las variables no se leen, verificar que el archivo se llame exactamente `.env.local` y no `.env.local.txt`. Windows oculta extensiones por defecto. Alternativamente, se puede definir la variable directamente en `next.config.ts` como fallback.

---

## 🧠 Decisiones técnicas

### Solución de estado: `useState` + `useCallback` (React nativo)

Se eligió `useState` sin librerías externas como Zustand o Redux porque:

- La app es de una sola página (`/`) sin estado compartido entre múltiples rutas.
- El estado es lineal: un array de tareas + metadatos de paginación.
- Añadir Zustand sería overengineering injustificado para este scope.
- `useCallback` evita recrear funciones en cada render, lo que mejora rendimiento en listas largas.

### Toggle: Optimistic Update

Se eligió **optimistic update** para el cambio de estado `completed`:

- El cambio se refleja en UI **inmediatamente**, antes de esperar respuesta de la API.
- Si la API falla, el estado se **revierte automáticamente** al valor original.
- Justificación: DummyJSON es confiable y la UX es notablemente más fluida.

```
Usuario hace click → UI cambia al instante → API responde → (si falla) UI revierte
```

### Separación de responsabilidades

```
lib/api.ts          → solo fetch puro, sin estado, sin lógica de negocio
hooks/useTodos.ts   → estado + llama a lib/api
components/ui/      → solo renderizan props, no conocen la API
TodoList.tsx        → conecta el hook con los componentes UI
```

### Manejo del límite de IDs de DummyJSON

DummyJSON solo acepta operaciones de escritura (PATCH/DELETE) para IDs del **1 al 150**. Las tareas creadas localmente reciben IDs mayores (ej: 255) que la API no reconoce.

**Solución implementada:**

- Si `id > 150`: la operación se resuelve **solo en estado local**, sin llamar a la API.
- Si `id <= 150`: se llama a la API normalmente.

Esto garantiza que el CRUD funcione correctamente tanto para tareas de la API como para tareas creadas localmente en la sesión.

---

## ⚙️ Calidad de código

```bash
# Verificar lint
pnpm lint

# Build de producción (debe pasar sin errores)
pnpm build
```

ESLint y Prettier están configurados. El proyecto pasa `pnpm build` sin errores ni warnings de lint.

---

## 🔌 Endpoints consumidos

| Operación | Método | Endpoint |
|---|---|---|
| Listar (paginado) | GET | `/todos?limit=10&skip=0` |
| Crear | POST | `/todos/add` |
| Actualizar | PATCH | `/todos/{id}` |
| Eliminar | DELETE | `/todos/{id}` |

---

## ✅ Funcionalidades implementadas

- [x] Listado de tareas con paginación (10 por página)
- [x] Estado de loading visible (skeleton animado)
- [x] Manejo de errores con opción de reintentar
- [x] Crear tarea (se agrega al estado local sin recargar)
- [x] Marcar como completada / pendiente (optimistic update)
- [x] Eliminar tarea con confirmación (`window.confirm`)
- [x] Filtro local: Todas / Completadas / Pendientes
- [x] Feedback de éxito/error por operación
- [x] Custom hooks para todo el fetching
- [x] Tipado completo sin `any`
- [x] Componentes reutilizables

---

## 📄 Contenido de cada archivo

### `types/todo.ts`

Define la forma exacta de los datos que devuelve DummyJSON.

```typescript
// types/todo.ts

export interface Todo {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
}

export interface TodosResponse {
  todos: Todo[];
  total: number;
  skip: number;
  limit: number;
}

export interface CreateTodoPayload {
  todo: string;
  completed: boolean;
  userId: number;
}

export interface UpdateTodoPayload {
  completed: boolean;
}
```

---

### `lib/api.ts`

Funciones puras de fetch. Sin estado, sin hooks, sin lógica de negocio.

```typescript
// lib/api.ts
import type { Todo, TodosResponse, CreateTodoPayload, UpdateTodoPayload } from "@/types/todo";

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL no está definida");
  return url;
}

export async function fetchTodos(page: number, limit = 10): Promise<TodosResponse> {
  const skip = (page - 1) * limit;
  const res = await fetch(`${getBaseUrl()}/todos?limit=${limit}&skip=${skip}`);
  if (!res.ok) throw new Error("Error al cargar las tareas");
  return res.json();
}

export async function createTodo(payload: CreateTodoPayload): Promise<Todo> {
  const res = await fetch(`${getBaseUrl()}/todos/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al crear la tarea");
  return res.json();
}

export async function updateTodo(id: number, payload: UpdateTodoPayload): Promise<Todo> {
  const res = await fetch(`${getBaseUrl()}/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al actualizar la tarea");
  return res.json();
}

export async function deleteTodo(id: number): Promise<Todo> {
  const res = await fetch(`${getBaseUrl()}/todos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar la tarea");
  return res.json();
}
```

---

### `hooks/useTodos.ts`

El corazón de la aplicación. Maneja todo el estado y orquesta las llamadas a la API.

```typescript
// hooks/useTodos.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTodos, createTodo, updateTodo, deleteTodo } from "@/lib/api";
import type { Todo } from "@/types/todo";

export type FilterType = "all" | "completed" | "pending";

export function useTodos() {
  // ── Estado principal ──────────────────────────────────────────────
  const [todos, setTodos] = useState<Todo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");

  // ── Estados de UI ─────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const LIMIT = 10;
  const totalPages = Math.ceil(total / LIMIT);

  // ── Helper: muestra toast temporal ────────────────────────────────
  const showFeedback = (message: string, type: "success" | "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  // ── Cargar tareas ─────────────────────────────────────────────────
  const loadTodos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTodos(page, LIMIT);
      setTodos(data.todos);
      setTotal(data.total);
    } catch {
      setError("No se pudieron cargar las tareas. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // ── Crear tarea ───────────────────────────────────────────────────
  const addTodo = useCallback(async (text: string) => {
    try {
      const newTodo = await createTodo({ todo: text, completed: false, userId: 1 });
      setTodos((prev) => [newTodo, ...prev]);
      showFeedback("Tarea creada exitosamente", "success");
    } catch {
      showFeedback("Error al crear la tarea", "error");
    }
  }, []);

  // ── Toggle completada (Optimistic Update) ─────────────────────────
  // Estrategia: cambiamos en UI antes de esperar la API.
  // Si falla, se revierte automáticamente.
  // DummyJSON solo acepta PATCH para IDs 1-150.
  // Para IDs > 150 (tareas creadas localmente), solo actualizamos estado local.
  const toggleTodo = useCallback(async (id: number, currentCompleted: boolean) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !currentCompleted } : t))
    );

    if (id <= 150) {
      try {
        await updateTodo(id, { completed: !currentCompleted });
      } catch {
        // Revertir si la API falla
        setTodos((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: currentCompleted } : t))
        );
        showFeedback("Error al actualizar la tarea", "error");
        return;
      }
    }

    showFeedback("Tarea actualizada", "success");
  }, []);

  // ── Eliminar tarea ────────────────────────────────────────────────
  // DummyJSON solo acepta DELETE para IDs 1-150.
  // Para IDs > 150 (tareas locales), solo eliminamos del estado.
  const removeTodo = useCallback(async (id: number) => {
    if (id > 150) {
      setTodos((prev) => prev.filter((t) => t.id !== id));
      showFeedback("Tarea eliminada", "success");
      return;
    }

    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      showFeedback("Tarea eliminada", "success");
    } catch {
      showFeedback("Error al eliminar la tarea", "error");
    }
  }, []);

  // ── Filtro local (sin llamadas a la API) ──────────────────────────
  const filteredTodos = todos.filter((t) => {
    if (filter === "completed") return t.completed;
    if (filter === "pending") return !t.completed;
    return true;
  });

  return {
    todos: filteredTodos,
    total,
    page,
    totalPages,
    filter,
    isLoading,
    error,
    feedback,
    setPage,
    setFilter,
    loadTodos,
    addTodo,
    toggleTodo,
    removeTodo,
  };
}
```

---

### `components/ui/TodoItem.tsx`

Componente de una tarea individual. Recibe props, no conoce la API.

```tsx
// components/ui/TodoItem.tsx
"use client";

import type { Todo } from "@/types/todo";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const handleDelete = () => {
    const confirmed = window.confirm(`¿Eliminar "${todo.todo}"?`);
    if (confirmed) onDelete(todo.id);
  };

  return (
    <li className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-zinc-600">
      <button
        onClick={() => onToggle(todo.id, todo.completed)}
        className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 transition-colors ${
          todo.completed
            ? "border-emerald-500 bg-emerald-500"
            : "border-zinc-600 hover:border-emerald-400"
        }`}
        aria-label={todo.completed ? "Marcar como pendiente" : "Marcar como completada"}
      />
      <span
        className={`flex-1 text-sm leading-relaxed ${
          todo.completed ? "text-zinc-500 line-through" : "text-zinc-100"
        }`}
      >
        {todo.todo}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          todo.completed
            ? "bg-emerald-950 text-emerald-400"
            : "bg-amber-950 text-amber-400"
        }`}
      >
        {todo.completed ? "Completada" : "Pendiente"}
      </span>
      <button
        onClick={handleDelete}
        className="ml-1 rounded p-1 text-zinc-600 transition-colors hover:bg-red-950 hover:text-red-400"
        aria-label="Eliminar tarea"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/>
          <path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </li>
  );
}
```

---

### `components/ui/LoadingSkeleton.tsx`

Estado de carga visible con animación pulse.

```tsx
// components/ui/LoadingSkeleton.tsx
export function LoadingSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="h-5 w-5 flex-shrink-0 animate-pulse rounded-full bg-zinc-700" />
          <div
            className="h-4 flex-1 animate-pulse rounded bg-zinc-800"
            style={{ width: `${60 + (i % 4) * 10}%` }}
          />
          <div className="h-5 w-20 animate-pulse rounded-full bg-zinc-800" />
        </li>
      ))}
    </ul>
  );
}
```

---

### `components/ui/EmptyState.tsx`

Estado vacío reutilizable con mensaje configurable.

```tsx
// components/ui/EmptyState.tsx
interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = "No hay tareas para mostrar" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center">
      <div className="mb-3 text-4xl">📭</div>
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}
```

---

### `components/ui/ErrorState.tsx`

Estado de error con mensaje y botón para reintentar.

```tsx
// components/ui/ErrorState.tsx
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-900 bg-red-950/30 py-12 text-center">
      <div className="mb-3 text-3xl">⚠️</div>
      <p className="mb-4 text-sm text-red-400">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
      >
        Reintentar
      </button>
    </div>
  );
}
```

---

### `components/ui/FilterBar.tsx`

Filtros locales sin llamadas a la API.

```tsx
// components/ui/FilterBar.tsx
import type { FilterType } from "@/hooks/useTodos";

interface FilterBarProps {
  current: FilterType;
  onChange: (filter: FilterType) => void;
}

const OPTIONS: { label: string; value: FilterType }[] = [
  { label: "Todas", value: "all" },
  { label: "Completadas", value: "completed" },
  { label: "Pendientes", value: "pending" },
];

export function FilterBar({ current, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            current === opt.value
              ? "bg-indigo-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

---

### `components/ui/Pagination.tsx`

Controles de paginación con estados deshabilitados.

```tsx
// components/ui/Pagination.tsx
interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({ page, totalPages, onPrev, onNext }: PaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Anterior
      </button>
      <span className="text-sm text-zinc-500">
        Página <span className="text-zinc-200">{page}</span> de{" "}
        <span className="text-zinc-200">{totalPages}</span>
      </span>
      <button
        onClick={onNext}
        disabled={page >= totalPages}
        className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Siguiente →
      </button>
    </div>
  );
}
```

---

### `components/ui/AddTodoForm.tsx`

Formulario para crear tarea. Soporta Enter y botón. Tiene estado de submitting propio.

```tsx
// components/ui/AddTodoForm.tsx
"use client";

import { useState } from "react";

interface AddTodoFormProps {
  onAdd: (text: string) => Promise<void>;
}

export function AddTodoForm({ onAdd }: AddTodoFormProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    await onAdd(trimmed);
    setText("");
    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nueva tarea..."
        disabled={isSubmitting}
        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-indigo-500 disabled:opacity-50"
      />
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !text.trim()}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "..." : "Agregar"}
      </button>
    </div>
  );
}
```

---

### `components/TodoList.tsx`

Orquestador: conecta `useTodos` con todos los componentes UI.

```tsx
// components/TodoList.tsx
"use client";

import { useTodos } from "@/hooks/useTodos";
import { TodoItem } from "./ui/TodoItem";
import { LoadingSkeleton } from "./ui/LoadingSkeleton";
import { EmptyState } from "./ui/EmptyState";
import { ErrorState } from "./ui/ErrorState";
import { FilterBar } from "./ui/FilterBar";
import { Pagination } from "./ui/Pagination";
import { AddTodoForm } from "./ui/AddTodoForm";

export function TodoList() {
  const {
    todos,
    page,
    totalPages,
    filter,
    isLoading,
    error,
    feedback,
    setPage,
    setFilter,
    loadTodos,
    addTodo,
    toggleTodo,
    removeTodo,
  } = useTodos();

  return (
    <div className="space-y-6">
      {/* Toast de feedback */}
      {feedback && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-950 text-emerald-400"
              : "bg-red-950 text-red-400"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <AddTodoForm onAdd={addTodo} />
      <FilterBar current={filter} onChange={setFilter} />

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadTodos} />
      ) : todos.length === 0 ? (
        <EmptyState message="No hay tareas en esta categoría" />
      ) : (
        <ul className="space-y-3">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={removeTodo}
            />
          ))}
        </ul>
      )}

      {!isLoading && !error && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}
    </div>
  );
}
```

---

### `app/page.tsx`

Página principal. Solo layout, sin lógica.

```tsx
// app/page.tsx
import { TodoList } from "@/components/TodoList";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
            Task<span className="text-indigo-400">Flow</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gestiona tus tareas de forma simple y rápida
          </p>
        </div>
        <TodoList />
      </div>
    </main>
  );
}
```

---

### `app/layout.tsx`

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Gestión de tareas con DummyJSON API",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geist.className} antialiased`}>{children}</body>
    </html>
  );
}
```

---

### `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### `.env.example`

```env
NEXT_PUBLIC_API_BASE_URL=https://dummyjson.com
```

---

### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

### `.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"]
}
```

---

## 🐛 Problemas encontrados y soluciones

### Problema 1: Variable de entorno `undefined` en Windows

**Síntoma:** La URL de la API aparecía como `/undefined/todos` en la consola.

**Causa:** En Windows, los archivos `.env.local` a veces se crean con extensión oculta `.env.local.txt`. Además, las variables de entorno solo se leen al iniciar el servidor, no con hot reload.

**Solución:**
1. Verificar el nombre real del archivo con `Get-ChildItem -Force` en PowerShell.
2. Renombrar si era `.env.local.txt` → `.env.local`.
3. Reiniciar el servidor con `pnpm dev` después de cualquier cambio en `.env.local`.
4. Como fallback, definir la variable también en `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: "https://dummyjson.com",
  },
};
```

---

### Problema 2: PATCH/DELETE fallan para tareas creadas localmente

**Síntoma:** Al intentar editar o eliminar una tarea recién creada, la consola mostraba `PATCH /todos/255 404 (Not Found)`.

**Causa:** DummyJSON solo tiene registros con IDs del **1 al 150**. Cuando creas una tarea nueva, la API devuelve un ID fuera de ese rango (ej: 255). Ese ID no existe en el servidor, por lo que las operaciones de escritura fallan con 404.

**Solución:** Detectar si el ID es mayor a 150 y en ese caso ejecutar la operación **solo en estado local**, sin llamar a la API:

```typescript
// Para toggle
if (id <= 150) {
  await updateTodo(id, { completed: !currentCompleted });
}
// El optimistic update ya actualizó el estado local antes de este check

// Para delete
if (id > 150) {
  setTodos((prev) => prev.filter((t) => t.id !== id));
  return;
}
await deleteTodo(id);
```

---
