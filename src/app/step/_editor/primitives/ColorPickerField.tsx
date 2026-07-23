"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ColorPickerFieldProps {
  label: string;
  hint?: string;
  /** Current value (any CSS color string). Empty string means "use preset". */
  value: string;
  onChange: (next: string) => void;
}

/**
 * Color picker for theme overrides. Renders a swatch + native picker +
 * hex input. Empty string is treated as "use preset color".
 */
export function ColorPickerField({
  label,
  hint,
  value,
  onChange,
}: ColorPickerFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {hint ? <p className="text-xs text-black/50">{hint}</p> : null}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-black/10"
          aria-label={label}
        />
        <Input
          value={value}
          placeholder="#000000"
          onChange={(e) => onChange(e.target.value)}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-black/50 underline hover:text-black"
          >
            Use preset
          </button>
        ) : null}
      </div>
    </div>
  );
}