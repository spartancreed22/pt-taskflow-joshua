// src/components/ui/Pagination.tsx
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