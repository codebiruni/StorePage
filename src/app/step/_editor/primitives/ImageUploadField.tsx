"use client";

/**
 * ImageUploadField — single-image uploader whose preview box matches the
 * target section's aspect ratio.
 *
 * This is the explicit fix for "hard to identify where images go": the
 * box is drawn at the real aspect ratio with a dashed border and the
 * slot's hint text. Admins stop guessing because a portrait upload
 * visibly won't fit a landscape box.
 *
 * Reuse: pass a different `aspectRatio` + `hint` per section field.
 *   - Hero image:        aspectRatio={16 / 9}
 *   - Trust badge cert:  aspectRatio={4 / 5}
 *   - Product showcase:  aspectRatio={1 / 1}
 *   - Testimonial shot:  aspectRatio={3 / 4}
 */

import { useState } from "react";
import axios from "axios";
import { ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const CLOUDINARY_UPLOAD_URL =
  process.env.NEXT_PUBLIC_CLOUDINARY_IMAGE_API ??
  process.env.NEXT_PUBLIC_IMAGE_API ??
  "";
const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??
  process.env.NEXT_PUBLIC_CLOUD_NAME ??
  "";
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_PRESET ??
  process.env.NEXT_PUBLIC_PRESET ??
  "";

interface ImageUploadFieldProps {
  label: string;
  hint?: string;
  /** Width / height — e.g. 16/9 for hero, 1/1 for product shot. */
  aspectRatio?: number;
  value?: string;
  onChange: (next: string) => void;
  /** Optional inline override (e.g. to disable on legacy fields). */
  disabled?: boolean;
}

export function ImageUploadField({
  label,
  hint,
  aspectRatio = 16 / 9,
  value,
  onChange,
  disabled,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (
      !CLOUDINARY_UPLOAD_URL ||
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_UPLOAD_PRESET
    ) {
      setError("Image upload is not configured (missing Cloudinary env).");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);
      const res = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
      const url: string | undefined = res.data?.secure_url ?? res.data?.url;
      if (!url) throw new Error("Upload succeeded but no URL was returned");
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      // Clear the input so picking the same file again still triggers onChange.
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {hint ? <p className="text-xs text-black/50">{hint}</p> : null}

      <div
        className="relative overflow-hidden rounded-lg border border-dashed border-black/20 bg-black/[0.02]"
        style={{ aspectRatio: String(aspectRatio) }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-black/40">
            <ImageIcon className="h-6 w-6" aria-hidden />
            <span>
              {label} · {aspectRatioLabel(aspectRatio)}
            </span>
          </div>
        )}

        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <Loader2 className="h-6 w-6 animate-spin text-black/60" />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <label className="inline-flex">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled || uploading}
            onChange={handleUpload}
          />
          <span
            className={`inline-flex h-9 cursor-pointer items-center rounded-md border border-black/10 bg-white px-3 text-xs font-medium transition hover:bg-black/[0.04] ${
              disabled || uploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {value ? "Replace image" : "Upload image"}
          </span>
        </label>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="h-9 text-xs text-black/60"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Remove
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function aspectLabelFor(r: number): string {
  // Round common ratios for display: 16/9, 4/5, 1/1, 3/4
  const known: Array<[number, string]> = [
    [16 / 9, "16:9"],
    [4 / 3, "4:3"],
    [3 / 2, "3:2"],
    [1, "1:1"],
    [3 / 4, "3:4"],
    [4 / 5, "4:5"],
    [9 / 16, "9:16"],
  ];
  const hit = known.find(([n]) => Math.abs(n - r) < 0.01);
  return hit ? hit[1] : `${r.toFixed(2)}:1`;
}

function aspectRatioLabel(r: number): string {
  return aspectLabelFor(r);
}