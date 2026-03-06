// src/components/ui/AddTodoForm.tsx
"use client";

import { useState } from "react";

interface AddTodoFormProps {
  onAdd: (text: string) => Promise<void>;
}

export function AddTodoForm({ onAdd }: AddTodoFormProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    await onAdd(trimmed);
    setText("");
    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nueva tarea..."
        disabled={isSubmitting}
        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-indigo-500 disabled:opacity-50"
      />
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !text.trim()}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "..." : "Agregar"}
      </button>
    </div>
  );
}