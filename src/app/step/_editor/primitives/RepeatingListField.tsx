"use client";

/**
 * RepeatingListField — generic add/remove/reorder wrapper for list-of-row
 * editors. Used by Benefits, Comparison, Testimonials, FAQ, etc.
 *
 * `renderItem(row, rowIdx, updateRow)` lets the section's editor define
 * its own row shape (e.g. {icon, text} vs {q, a}) while the wrapper owns
 * the add/remove/move controls.
 */

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface RepeatingListFieldProps<T> {
  label: string;
  hint?: string;
  items: T[];
  onChange: (next: T[]) => void;
  /** Factory for a fresh empty row. */
  newItem: () => T;
  /** Key extractor for stable React keys (e.g. "id" for objects). */
  itemKey: (row: T, idx: number) => string;
  /** Render a single row's editor. */
  renderItem: (
    row: T,
    idx: number,
    updateRow: (next: T) => void
  ) => React.ReactNode;
}

export function RepeatingListField<T>({
  label,
  hint,
  items,
  onChange,
  newItem,
  itemKey,
  renderItem,
}: RepeatingListFieldProps<T>) {
  function updateRow(idx: number, next: T) {
    const copy = [...items];
    copy[idx] = next;
    onChange(copy);
  }
  function removeRow(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }
  function move(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    onChange(copy);
  }
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <div>
          <Label className="text-xs font-medium">{label}</Label>
          {hint ? <p className="text-xs text-black/50">{hint}</p> : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onChange([...items, newItem()])}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-black/10 bg-black/[0.02] p-3 text-center text-xs text-black/40">
          No items yet — click Add to create one.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((row, idx) => (
            <li
              key={itemKey(row, idx)}
              className="rounded-md border border-black/10 bg-white p-3"
            >
              <div className="mb-2 flex items-center justify-between text-xs text-black/50">
                <span>#{idx + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="rounded p-1 hover:bg-black/5 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === items.length - 1}
                    className="rounded p-1 hover:bg-black/5 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {renderItem(row, idx, (next) => updateRow(idx, next))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}