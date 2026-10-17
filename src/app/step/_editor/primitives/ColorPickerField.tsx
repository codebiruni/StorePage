"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ColorPickerFieldProps {
  label: string;
  hint?: string;
  /** Current value (any CSS color string). Empty string means "use preset / default". */
  value: string;
  onChange: (next: string) => void;
  /** Fallback color currently in the page when value is unset. */
  defaultColor?: string;
}

/**
 * Normalizes any color string to a valid 7-character hex code (#rrggbb)
 * so that native HTML5 <input type="color"> can safely render it without error.
 */
function toHexColor(color?: string, fallback = "#000000"): string {
  if (!color) return fallback;
  const trimmed = color.trim().toLowerCase();

  // #rgb -> #rrggbb
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }

  // #rrggbb
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed;
  }

  // #rrggbbaa -> #rrggbb
  if (/^#[0-9a-f]{8}$/i.test(trimmed)) {
    return trimmed.slice(0, 7);
  }

  // Common named colors
  const namedColors: Record<string, string> = {
    white: "#ffffff",
    black: "#000000",
    transparent: "#ffffff",
  };
  if (namedColors[trimmed]) return namedColors[trimmed];

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = Math.min(255, parseInt(rgbMatch[1], 10)).toString(16).padStart(2, "0");
    const g = Math.min(255, parseInt(rgbMatch[2], 10)).toString(16).padStart(2, "0");
    const b = Math.min(255, parseInt(rgbMatch[3], 10)).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  return fallback;
}

/**
 * Color picker for theme and section overrides. Renders a swatch + native picker +
 * hex input. Shows the page's current color by default when unset.
 */
export function ColorPickerField({
  label,
  hint,
  value,
  onChange,
  defaultColor,
}: ColorPickerFieldProps) {
  const displayColor = toHexColor(value || defaultColor || "#000000");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-neutral-800">{label}</Label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[11px] text-muted-foreground hover:text-black underline cursor-pointer"
            title="Reset to default color"
          >
            Reset
          </button>
        ) : defaultColor ? (
          <span className="text-[10px] text-muted-foreground bg-neutral-100 px-1.5 py-0.5 rounded font-mono">
            Default
          </span>
        ) : null}
      </div>
      {hint ? <p className="text-[11px] text-black/50 leading-tight">{hint}</p> : null}
      <div className="flex items-center gap-2">
        <div className="relative flex-none">
          <input
            type="color"
            value={displayColor}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-11 cursor-pointer rounded-md border border-black/15 p-0.5 bg-white shadow-2xs hover:border-black/30 transition-colors"
            aria-label={label}
          />
        </div>
        <Input
          value={value}
          placeholder={defaultColor || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs uppercase h-9"
        />
      </div>
    </div>
  );
}