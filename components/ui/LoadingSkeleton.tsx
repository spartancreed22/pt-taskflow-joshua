// src/components/ui/LoadingSkeleton.tsx
export function LoadingSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="h-5 w-5 flex-shrink-0 animate-pulse rounded-full bg-zinc-700" />
          <div className="h-4 flex-1 animate-pulse rounded bg-zinc-800" style={{ width: `${60 + (i % 4) * 10}%` }} />
          <div className="h-5 w-20 animate-pulse rounded-full bg-zinc-800" />
        </li>
      ))}
    </ul>
  );
}