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