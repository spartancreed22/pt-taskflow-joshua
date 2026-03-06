// src/components/ui/FilterBar.tsx
import type { FilterType } from "@/hooks/useTodos";

interface FilterBarProps {
  current: FilterType;
  onChange: (filter: FilterType) => void;
}

const OPTIONS: { label: string; value: FilterType }[] = [
  { label: "Todas", value: "all" },
  { label: "Completadas", value: "completed" },
  { label: "Pendientes", value: "pending" },
];

export function FilterBar({ current, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            current === opt.value
              ? "bg-indigo-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}