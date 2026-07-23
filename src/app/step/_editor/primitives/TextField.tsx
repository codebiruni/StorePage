"use client";

/**
 * Editor primitives — small form fields reused across every section's
 * admin form. Keeping them in one place means a section's data shape is
 * the only thing that changes between sections; the input UX is shared.
 *
 * Live preview is wired up in `LandingStep`/`SectionEditorPanel` — these
 * components just bubble `onChange` upward so the parent state can
 * re-render the preview.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextFieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** Optional inline override for the underlying <input> element. */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  inputProps,
}: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {hint ? <p className="text-xs text-black/50">{hint}</p> : null}
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        {...inputProps}
      />
    </div>
  );
}