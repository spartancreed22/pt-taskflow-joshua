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
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </li>
  );
}