import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterBar } from "@/components/ui/FilterBar";
import type { FilterType } from "@/hooks/useTodos";

describe("FilterBar", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders all three filter buttons", () => {
    render(<FilterBar current="all" onChange={mockOnChange} />);
    expect(screen.getByText("Todas")).toBeInTheDocument();
    expect(screen.getByText("Completadas")).toBeInTheDocument();
    expect(screen.getByText("Pendientes")).toBeInTheDocument();
  });

  it("applies active styles to the current filter", () => {
    render(<FilterBar current="completed" onChange={mockOnChange} />);
    const activeButton = screen.getByText("Completadas");
    // El botón activo tiene clase bg-indigo-600
    expect(activeButton).toHaveClass("bg-indigo-600");
  });

  it("calls onChange with correct value when a filter is clicked", async () => {
    const user = userEvent.setup();
    render(<FilterBar current="all" onChange={mockOnChange} />);

    await user.click(screen.getByText("Pendientes"));
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith("pending" as FilterType);
  });

  it("calls onChange with 'completed' when Completadas is clicked", async () => {
    const user = userEvent.setup();
    render(<FilterBar current="all" onChange={mockOnChange} />);

    await user.click(screen.getByText("Completadas"));
    expect(mockOnChange).toHaveBeenCalledWith("completed" as FilterType);
  });

  it("calls onChange with 'all' when Todas is clicked", async () => {
    const user = userEvent.setup();
    render(<FilterBar current="pending" onChange={mockOnChange} />);

    await user.click(screen.getByText("Todas"));
    expect(mockOnChange).toHaveBeenCalledWith("all" as FilterType);
  });
});