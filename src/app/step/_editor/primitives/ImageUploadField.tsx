"use client";

/**
 * ImageUploadField — single-image uploader for landing page sections.
 * Powered by the unified SingleImageUpload component with drag-and-drop,
 * proportional compact preview, recommended size guidance, and R2 pipeline.
 */

import SingleImageUpload from "@/shired-component/SingleImageUpload";

export interface ImageUploadFieldProps {
  label: string;
  hint?: string;
  /** Width / height — e.g. 16/9 for hero, 1/1 for product shot. */
  aspectRatio?: number;
  /** Recommended pixel dimensions and format note for this section */
  recommendedSize?: string;
  value?: string;
  onChange: (next: string) => void;
  /** Optional inline override (e.g. to disable on legacy fields). */
  disabled?: boolean;
}

export function ImageUploadField({
  label,
  hint,
  aspectRatio = 16 / 9,
  recommendedSize,
  value,
  onChange,
  disabled,
}: ImageUploadFieldProps) {
  return (
    <SingleImageUpload
      label={label}
      hint={hint}
      aspectRatio={aspectRatio}
      recommendedSize={recommendedSize}
      value={value}
      onUpload={onChange}
      onRemove={() => onChange("")}
      disabled={disabled}
      compact
    />
  );
}