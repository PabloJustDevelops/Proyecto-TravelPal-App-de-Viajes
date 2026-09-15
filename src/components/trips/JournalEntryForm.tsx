"use client";

import { useState } from "react";
import type { JournalEntry } from "@/lib/insforge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { selectClassName, textareaClassName } from "@/components/ui/fieldStyles";

export interface JournalEntryValues {
  entry_date: string;
  content: string;
  rating?: number;
}

interface JournalEntryFormProps {
  entry?: JournalEntry | null;
  onSave: (values: JournalEntryValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function JournalEntryForm({
  entry,
  onSave,
  onCancel,
  loading = false,
}: JournalEntryFormProps) {
  const [entryDate, setEntryDate] = useState(
    entry?.entry_date ? entry.entry_date.slice(0, 10) : today(),
  );
  const [content, setContent] = useState(entry?.content ?? "");
  const [rating, setRating] = useState(entry?.rating ? String(entry.rating) : "");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Escribe algo en la entrada");
      return;
    }

    try {
      await onSave({
        entry_date: entryDate,
        content: content.trim(),
        rating: rating ? Number(rating) : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la entrada");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-md border border-danger px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <Input
        label="Fecha"
        type="date"
        name="entry_date"
        value={entryDate}
        max={today()}
        onChange={(event) => setEntryDate(event.target.value)}
        required
      />

      <div className="space-y-2">
        <label
          htmlFor="journal-content"
          className="block text-sm font-medium text-ink"
        >
          Como fue
        </label>
        <textarea
          id="journal-content"
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={6}
          className={textareaClassName}
          placeholder="Que hiciste, que viste, que te llevas del dia..."
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="journal-rating"
          className="block text-sm font-medium text-ink"
        >
          Valoracion del dia
        </label>
        <select
          id="journal-rating"
          name="rating"
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          className={selectClassName}
        >
          <option value="">Sin valoracion</option>
          <option value="1">1 - Mal dia</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5 - Dia redondo</option>
        </select>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button type="submit" loading={loading} className="flex-1 sm:flex-none">
          {entry ? "Guardar cambios" : "Guardar entrada"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 sm:flex-none"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
