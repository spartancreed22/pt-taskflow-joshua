// src/components/TodoList.tsx
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
      {/* Feedback Toast */}
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


      {/* Agregar tarea */}
      <AddTodoForm onAdd={addTodo} />


      {/* Filtros */}
      <FilterBar current={filter} onChange={setFilter} />


      {/* Lista */}
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

      {/* Paginación */}
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