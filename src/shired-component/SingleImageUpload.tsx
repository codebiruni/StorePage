"use client";

import { useId, useState } from "react";
import {
  UploadCloud,
  Loader2,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImageToR2 } from "@/lib/uploadImage";
import { cn } from "@/lib/utils";

export interface SingleImageUploadProps {
  onUpload: (url: string) => void;
  initialImage?: string;
  value?: string;
  disabled?: boolean;
  aspectRatio?: number;
  recommendedSize?: string;
  label?: string;
  hint?: string;
  className?: string;
  compact?: boolean;
  onRemove?: () => void;
}

function getAspectLabel(r?: number): string {
  if (!r) return "16:9";
  const known: Array<[number, string]> = [
    [16 / 9, "16:9"],
    [4 / 1, "4:1"],
    [4 / 3, "4:3"],
    [3 / 2, "3:2"],
    [1, "1:1 Square"],
    [3 / 4, "3:4"],
    [4 / 5, "4:5"],
    [9 / 16, "9:16"],
  ];
  const hit = known.find(([n]) => Math.abs(n - r) < 0.02);
  return hit ? hit[1] : `${r.toFixed(1)}:1`;
}

function getDefaultRecommendedSize(aspectRatio?: number): string {
  if (!aspectRatio) return "1200 × 675 px (16:9)";
  if (Math.abs(aspectRatio - 1) < 0.02) return "800 × 800 px (1:1 Square)";
  if (Math.abs(aspectRatio - 16 / 9) < 0.02) return "1200 × 675 px (16:9 Banner)";
  if (Math.abs(aspectRatio - 4 / 1) < 0.02) return "400 × 100 px (4:1 Logo)";
  if (Math.abs(aspectRatio - 4 / 5) < 0.02) return "400 × 500 px (4:5 Badge/Cert)";
  if (Math.abs(aspectRatio - 3 / 4) < 0.02) return "600 × 800 px (3:4 Portrait)";
  return `${getAspectLabel(aspectRatio)} ratio`;
}

export default function SingleImageUpload({
  onUpload,
  initialImage,
  value: controlledValue,
  disabled = false,
  aspectRatio = 16 / 9,
  recommendedSize,
  label,
  hint,
  className,
  compact = false,
  onRemove,
}: SingleImageUploadProps) {
  const inputId = useId();
  const [localImage, setLocalImage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentImage = controlledValue !== undefined ? controlledValue : (localImage || initialImage || "");
  const effectiveRecommendedSize = recommendedSize || getDefaultRecommendedSize(aspectRatio);

  const processFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.name.match(/\.(jpg|jpeg|png|webp|svg|gif|avif|heic)$/i)) {
      setErrorMessage("Please select a valid image file (JPG, PNG, WebP, SVG, AVIF).");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const { publicUrl } = await uploadImageToR2(file);
      setLocalImage(publicUrl);
      onUpload(publicUrl);
    } catch (err) {
      console.error("[SingleImageUpload] Upload error:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to upload image. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    // Clear input value so selecting the same file again triggers onChange
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleRemove = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLocalImage("");
    onUpload("");
    onRemove?.();
  };

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {label ? (
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="text-xs font-semibold text-neutral-800">
            {label}
          </label>
          {effectiveRecommendedSize && (
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-medium">
              Best: {effectiveRecommendedSize}
            </span>
          )}
        </div>
      ) : null}

      {hint ? <p className="text-[11px] text-black/50">{hint}</p> : null}

      {/* Hidden file input */}
      <input
        id={inputId}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.svg,.gif,.avif,.heic,image/*"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="sr-only"
      />

      {/* When an image is present: Show compact, proportional preview box */}
      {currentImage ? (
        <div className="rounded-xl border border-black/10 bg-neutral-50/70 p-2.5 transition-all">
          <div className="flex flex-row items-center gap-3">
            {/* Proportional preview thumbnail */}
            <div
              className={cn(
                "relative overflow-hidden rounded-lg border border-black/10 bg-white flex-none flex items-center justify-center shrink-0",
                compact
                  ? "h-16 max-w-[120px] sm:h-20 sm:max-w-[150px]"
                  : "h-20 max-w-[160px] sm:h-24 sm:max-w-[220px]"
              )}
              style={{
                aspectRatio: `${aspectRatio}`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImage}
                alt={label || "Uploaded preview"}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/logo.png";
                }}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* Info and action buttons */}
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left">
              <div className="space-y-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Uploaded
                  </span>
                  {effectiveRecommendedSize && !label && (
                    <span className="text-[10px] text-muted-foreground bg-neutral-100 px-1.5 py-0.5 rounded">
                      Best: {effectiveRecommendedSize}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-black/50 truncate max-w-full font-mono">
                  {currentImage.split("/").pop() || "image"}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <label
                  htmlFor={inputId}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-7 px-2.5 sm:h-8 sm:px-3 rounded-md text-xs font-medium border border-black/10 bg-white hover:bg-neutral-50 cursor-pointer shadow-2xs transition-colors",
                    (disabled || isUploading) && "pointer-events-none opacity-50"
                  )}
                >
                  <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-neutral-600" />
                  <span>Replace</span>
                </label>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 sm:h-8 sm:px-2.5 text-xs text-black/60 hover:text-black gap-1"
                  onClick={() => window.open(currentImage, "_blank", "noopener,noreferrer")}
                  title="View full image in new tab"
                >
                  <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>View</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 sm:h-8 sm:px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                  onClick={handleRemove}
                  disabled={disabled || isUploading}
                  title="Remove image"
                >
                  <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Remove</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Dropzone: Click or Drag and Drop */
        <label
          htmlFor={inputId}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "group relative flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed p-4 transition-all duration-200 cursor-pointer text-center",
            compact ? "h-[105px] py-2" : "h-[125px] sm:h-[135px]",
            isDragging
              ? "border-primary bg-primary/5 ring-4 ring-primary/10 scale-[1.01]"
              : "border-black/15 bg-neutral-50/50 hover:border-black/30 hover:bg-neutral-50/90",
            (disabled || isUploading) && "pointer-events-none opacity-60"
          )}
        >
          <div className="flex flex-col items-center justify-center space-y-1.5">
            {isUploading ? (
              <div className="flex items-center gap-2 text-primary font-medium text-xs">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Optimizing &amp; uploading image…</span>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-2xs border border-black/5 transition-transform group-hover:scale-110",
                    isDragging && "bg-primary text-white scale-110"
                  )}
                >
                  {isDragging ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <UploadCloud className="h-4 w-4 text-neutral-600 group-hover:text-primary transition-colors" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-neutral-900 group-hover:text-primary transition-colors">
                    {isDragging ? "Drop your image here" : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-[11px] text-black/50">
                    Auto-optimized WebP (JPG, PNG, WebP, SVG up to 10MB)
                  </p>
                </div>

                {effectiveRecommendedSize && !label && (
                  <span className="inline-flex items-center text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full mt-0.5">
                    Best: {effectiveRecommendedSize}
                  </span>
                )}
              </>
            )}
          </div>
        </label>
      )}

      {/* Error feedback */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="h-4 w-4 flex-none text-red-600" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-red-700 hover:bg-red-100 flex-none"
            onClick={() => setErrorMessage(null)}
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
