import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoItem } from "@/components/ui/TodoItem";
import type { Todo } from "@/types/todo";

const mockTodoPending: Todo = {
  id: 1,
  todo: "Aprender TypeScript",
  completed: false,
  userId: 1,
};

const mockTodoCompleted: Todo = {
  id: 2,
  todo: "Leer documentación de Next.js",
  completed: true,
  userId: 1,
};

describe("TodoItem", () => {
  const mockOnToggle = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
    mockOnDelete.mockClear();
  });

  it("renders the todo text", () => {
    render(
      <TodoItem
        todo={mockTodoPending}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText("Aprender TypeScript")).toBeInTheDocument();
  });

  it("shows 'Pendiente' badge for incomplete todos", () => {
    render(
      <TodoItem
        todo={mockTodoPending}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("shows 'Completada' badge for completed todos", () => {
    render(
      <TodoItem
        todo={mockTodoCompleted}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText("Completada")).toBeInTheDocument();
  });

  it("applies line-through style to completed todo text", () => {
    render(
      <TodoItem
        todo={mockTodoCompleted}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );
    const text = screen.getByText("Leer documentación de Next.js");
    expect(text).toHaveClass("line-through");
  });

  it("calls onToggle with correct id and completed state when toggle button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodoPending}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    await user.click(screen.getByLabelText("Marcar como completada"));
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledWith(1, false);
  });

  it("calls onDelete with correct id after confirm", async () => {
    // Mock window.confirm para que retorne true
    window.confirm = jest.fn(() => true);
    const user = userEvent.setup();

    render(
      <TodoItem
        todo={mockTodoPending}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    await user.click(screen.getByLabelText("Eliminar tarea"));
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  it("does NOT call onDelete when confirm is cancelled", async () => {
    // Mock window.confirm para que retorne false (usuario cancela)
    window.confirm = jest.fn(() => false);
    const user = userEvent.setup();

    render(
      <TodoItem
        todo={mockTodoPending}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    await user.click(screen.getByLabelText("Eliminar tarea"));
    expect(mockOnDelete).not.toHaveBeenCalled();
  });
});