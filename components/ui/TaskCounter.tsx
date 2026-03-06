// components/ui/TaskCounter.tsx
import { Badge } from "@/components/ui/badge";
import type { Todo } from "@/types/todo";

interface TaskCounterProps {
  todos: Todo[];
}

export function TaskCounter({ todos }: TaskCounterProps) {
  const completed = todos.filter((t) => t.completed).length;
  const total = todos.length;
  const pending = total - completed;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-zinc-400 border-zinc-700">
        Total: {total}
      </Badge>
      <Badge className="bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border-0">
        ✓ {completed} completadas
      </Badge>
      <Badge className="bg-amber-950 text-amber-400 hover:bg-amber-900 border-0">
        ○ {pending} pendientes
      </Badge>
    </div>
  );
}