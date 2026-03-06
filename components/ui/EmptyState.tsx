// src/components/ui/EmptyState.tsx
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