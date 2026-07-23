"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PriceFieldProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (next: number) => void;
  /** Currency symbol shown as a leading adornment. Defaults to "৳". */
  currency?: string;
}

/**
 * Numeric input with a currency prefix. Empty input is normalized to 0
 * so the saved JSON never contains `NaN`.
 */
export function PriceField({
  label,
  hint,
  value,
  onChange,
  currency = "৳",
}: PriceFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {hint ? <p className="text-xs text-black/50">{hint}</p> : null}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-sm text-black/50">
          {currency}
        </span>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          step="1"
          value={Number.isFinite(value) ? value : 0}
          className="pl-7"
          onChange={(e) => {
            const raw = e.target.value;
            const n = raw === "" ? 0 : Number(raw);
            onChange(Number.isFinite(n) ? n : 0);
          }}
        />
      </div>
    </div>
  );
}