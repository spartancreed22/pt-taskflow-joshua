import { renderHook, act, waitFor } from "@testing-library/react";
import { useTodos } from "@/hooks/useTodos";
import * as api from "@/lib/api";
import type { TodosResponse } from "@/types/todo";

// Mock completo del módulo api
jest.mock("@/lib/api");

const mockApiResponse: TodosResponse = {
  todos: [
    { id: 1, todo: "Tarea uno", completed: false, userId: 1 },
    { id: 2, todo: "Tarea dos", completed: true, userId: 1 },
    { id: 3, todo: "Tarea tres", completed: false, userId: 1 },
  ],
  total: 150,
  skip: 0,
  limit: 10,
};

describe("useTodos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Por defecto la API responde con éxito
    (api.fetchTodos as jest.Mock).mockResolvedValue(mockApiResponse);
  });

  // ── Carga inicial ───────────────────────────────────────────────

  it("starts with loading state true and no todos", () => {
    const { result } = renderHook(() => useTodos());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.todos).toEqual([]);
  });

  it("loads todos successfully and sets loading to false", async () => {
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.todos).toHaveLength(3);
    expect(result.current.todos[0].todo).toBe("Tarea uno");
  });

  it("sets error state when API fails", async () => {
    (api.fetchTodos as jest.Mock).mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(
      "No se pudieron cargar las tareas. Intenta de nuevo."
    );
    expect(result.current.todos).toHaveLength(0);
  });

  // ── Filtros locales ─────────────────────────────────────────────

  it("filters completed todos correctly", async () => {
    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setFilter("completed");
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].id).toBe(2);
  });

  it("filters pending todos correctly", async () => {
    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setFilter("pending");
    });

    expect(result.current.todos).toHaveLength(2);
    expect(result.current.todos.every((t) => !t.completed)).toBe(true);
  });

  // ── Crear tarea ─────────────────────────────────────────────────

  it("adds a new todo to the list after creation", async () => {
    const newTodo = { id: 255, todo: "Tarea nueva", completed: false, userId: 1 };
    (api.createTodo as jest.Mock).mockResolvedValue(newTodo);

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addTodo("Tarea nueva");
    });

    expect(result.current.todos[0].todo).toBe("Tarea nueva");
    expect(result.current.todos[0].id).toBe(255);
  });

  // ── Toggle (optimistic update) ──────────────────────────────────

  it("toggles todo optimistically before API response", async () => {
    (api.updateTodo as jest.Mock).mockResolvedValue({
      id: 1,
      todo: "Tarea uno",
      completed: true,
      userId: 1,
    });

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // La tarea 1 empieza como pending (completed: false)
    expect(result.current.todos.find((t) => t.id === 1)?.completed).toBe(false);

    act(() => {
      result.current.toggleTodo(1, false);
    });

    // Optimistic: cambia INMEDIATAMENTE sin esperar la API
    expect(result.current.todos.find((t) => t.id === 1)?.completed).toBe(true);
  });

  it("reverts toggle if API call fails", async () => {
    (api.updateTodo as jest.Mock).mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleTodo(1, false);
    });

    // Debe revertir al estado original (false)
    await waitFor(() => {
      expect(result.current.todos.find((t) => t.id === 1)?.completed).toBe(false);
    });
  });

  // ── Eliminar tarea ──────────────────────────────────────────────

  it("removes todo from list after successful delete", async () => {
    (api.deleteTodo as jest.Mock).mockResolvedValue({ id: 1, isDeleted: true });

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.todos).toHaveLength(3);

    await act(async () => {
      await result.current.removeTodo(1);
    });

    expect(result.current.todos).toHaveLength(2);
    expect(result.current.todos.find((t) => t.id === 1)).toBeUndefined();
  });

  it("removes local todo (id > 150) without calling API", async () => {
    const localTodo = { id: 255, todo: "Local", completed: false, userId: 1 };
    (api.createTodo as jest.Mock).mockResolvedValue(localTodo);

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Agregar tarea local
    await act(async () => {
      await result.current.addTodo("Local");
    });

    // Eliminarla (id > 150, no debe llamar a API)
    await act(async () => {
      await result.current.removeTodo(255);
    });

    expect(api.deleteTodo).not.toHaveBeenCalled();
    expect(result.current.todos.find((t) => t.id === 255)).toBeUndefined();
  });

  // ── Paginación ──────────────────────────────────────────────────

  it("calculates totalPages correctly", async () => {
    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // total=150, limit=10 → 15 páginas
    expect(result.current.totalPages).toBe(15);
  });

  it("starts on page 1", () => {
    const { result } = renderHook(() => useTodos());
    expect(result.current.page).toBe(1);
  });
});