// /hooks/useTodos.ts
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
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const LIMIT = 10;
  const totalPages = Math.ceil(total / LIMIT);

  // ── Helpers ───────────────────────────────────────────────────────
  const showFeedback = (message: string, type: "success" | "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  // ── Cargar tareas (con retry desde el componente) ─────────────────
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

  // ── CRUD ──────────────────────────────────────────────────────────

  const addTodo = useCallback(async (text: string) => {
    try {
      const newTodo = await createTodo({ todo: text, completed: false, userId: 1 });
      // La API devuelve el objeto con id temporal. Lo agregamos al inicio.
      setTodos((prev) => [newTodo, ...prev]);
      showFeedback("Tarea creada exitosamente", "success");
    } catch {
      showFeedback("Error al crear la tarea", "error");
    }
  }, []);

const toggleTodo = useCallback(async (id: number, currentCompleted: boolean) => {
  // Optimistic update inmediato
  setTodos((prev) =>
    prev.map((t) => (t.id === id ? { ...t, completed: !currentCompleted } : t))
  );

  // Solo llamamos API si el ID existe en DummyJSON (1-150)
  if (id <= 150) {
    try {
      await updateTodo(id, { completed: !currentCompleted });
    } catch {
      // Revertir si falla
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: currentCompleted } : t))
      );
      showFeedback("Error al actualizar la tarea", "error");
      return;
    }
  }

  showFeedback("Tarea actualizada", "success");
}, []);

const removeTodo = useCallback(async (id: number) => {
  // Si es una tarea local (ID > 150), solo eliminamos del estado
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

  // ── Filtro local (sin API) ────────────────────────────────────────
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