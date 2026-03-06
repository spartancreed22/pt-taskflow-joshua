// src/components/ui/ErrorState.tsx
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-900 bg-red-950/30 py-12 text-center">
      <div className="mb-3 text-3xl">⚠️</div>
      <p className="mb-4 text-sm text-red-400">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
      >
        Reintentar
      </button>
    </div>
  );
}