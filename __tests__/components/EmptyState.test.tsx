import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/EmptyState";

describe("EmptyState", () => {
  it("renders the default message when no prop is passed", () => {
    render(<EmptyState />);
    expect(screen.getByText("No hay tareas para mostrar")).toBeInTheDocument();
  });

  it("renders a custom message when provided", () => {
    render(<EmptyState message="No hay tareas completadas" />);
    expect(screen.getByText("No hay tareas completadas")).toBeInTheDocument();
  });

  it("renders the emoji icon", () => {
    render(<EmptyState />);
    expect(screen.getByText("📭")).toBeInTheDocument();
  });
});