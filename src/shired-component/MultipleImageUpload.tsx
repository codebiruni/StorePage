"use client";

import { useId, useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  Loader2,
  Trash2,
  ExternalLink,
  Star,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImageToR2 } from "@/lib/uploadImage";
import { cn } from "@/lib/utils";

export interface MultipleImageUploadProps {
  onUpload: (urls: string[]) => void;
  initialImages?: string[];
  value?: string[];
  recommendedSize?: string;
  aspectRatio?: number | string;
  disabled?: boolean;
  className?: string;
}

interface InFlightUpload {
  id: string;
  name: string;
  previewUrl: string;
}

/**
 * MultipleImageUpload — multi-image uploader for products and galleries.
 * Matches the landing page upload & preview style with instant auto-uploading,
 * drag-and-drop, compact proportional previews, and storefront cover selection.
 */
export default function MultipleImageUpload({
  onUpload,
  initialImages = [],
  value: controlledValue,
  recommendedSize = "800 × 800 px (1:1 Square)",
  aspectRatio = 1,
  disabled = false,
  className,
}: MultipleImageUploadProps) {
  const inputId = useId();
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(
    controlledValue ?? initialImages ?? []
  );
  const [inFlight, setInFlight] = useState<InFlightUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep a ref to latest uploadedUrls so concurrent uploads append safely
  const uploadedUrlsRef = useRef<string[]>(uploadedUrls);
  useEffect(() => {
    uploadedUrlsRef.current = uploadedUrls;
  }, [uploadedUrls]);

  // Synchronize when external value or initialImages changes (e.g. async fetch in edit page)
  useEffect(() => {
    const next = controlledValue ?? initialImages;
    if (next && Array.isArray(next)) {
      setUploadedUrls(next);
      uploadedUrlsRef.current = next;
    }
  }, [controlledValue, initialImages]);

  const handleUploadFiles = async (files: File[]) => {
    const validFiles = files.filter(
      (f) =>
        f.type.startsWith("image/") ||
        f.name.match(/\.(jpg|jpeg|png|webp|svg|gif|avif|heic)$/i)
    );

    if (validFiles.length === 0) {
      setErrorMessage("Please select valid image files (JPG, PNG, WebP, SVG, AVIF).");
      return;
    }

    setErrorMessage(null);

    // Create in-flight preview entries so the user sees upload progress immediately
    const newInFlight: InFlightUpload[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }));

    setInFlight((prev) => [...prev, ...newInFlight]);

    // Upload files in parallel with instant auto-uploading
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const tracking = newInFlight[i];

      try {
        const { publicUrl } = await uploadImageToR2(file);

        // Append to uploaded list
        const nextUrls = [...uploadedUrlsRef.current, publicUrl];
        uploadedUrlsRef.current = nextUrls;
        setUploadedUrls(nextUrls);

        // Notify parent form outside of state updater
        onUpload(nextUrls);
      } catch (err) {
        console.error("[MultipleImageUpload] Upload failed for file:", file.name, err);
        setErrorMessage(
          err instanceof Error
            ? `Failed to upload "${file.name}": ${err.message}`
            : `Failed to upload "${file.name}".`
        );
      } finally {
        // Clean up in-flight entry and revoke object URL
        URL.revokeObjectURL(tracking.previewUrl);
        setInFlight((prev) => prev.filter((item) => item.id !== tracking.id));
      }
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    await handleUploadFiles(files);
    // Reset input so selecting the same file again triggers onChange
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
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
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemove = (index: number) => {
    const nextUrls = uploadedUrls.filter((_, i) => i !== index);
    uploadedUrlsRef.current = nextUrls;
    setUploadedUrls(nextUrls);
    // Notify parent outside of state updater to prevent React render warnings
    onUpload(nextUrls);
  };

  const handleSetAsCover = (index: number) => {
    if (index === 0) return;
    const target = uploadedUrls[index];
    const rest = uploadedUrls.filter((_, i) => i !== index);
    const nextUrls = [target, ...rest];
    uploadedUrlsRef.current = nextUrls;
    setUploadedUrls(nextUrls);
    onUpload(nextUrls);
  };

  const isUploading = inFlight.length > 0;

  return (
    <div className={cn("space-y-3 w-full", className)}>
      {/* Hidden file input */}
      <input
        id={inputId}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.svg,.gif,.avif,.heic,image/*"
        onChange={handleInputChange}
        disabled={disabled}
        className="sr-only"
        multiple
      />

      {/* Dropzone: Click to upload or drag & drop (matching landing page upload style) */}
      <label
        htmlFor={inputId}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group relative flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed p-4 transition-all duration-200 cursor-pointer text-center",
          "h-[120px] sm:h-[130px]",
          isDragging
            ? "border-primary bg-primary/5 ring-4 ring-primary/10 scale-[1.01]"
            : "border-black/15 bg-neutral-50/50 hover:border-black/30 hover:bg-neutral-50/90",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        <div className="flex flex-col items-center justify-center space-y-1.5">
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
              {isDragging ? "Drop images here" : "Click to upload or drag & drop images"}
            </p>
            <p className="text-[11px] text-black/50">
              Auto-optimizes &amp; uploads instantly (PNG, JPG, WebP, SVG up to 10MB)
            </p>
          </div>

          {recommendedSize && (
            <span className="inline-flex items-center text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full mt-0.5">
              Best: {recommendedSize}
            </span>
          )}
        </div>
      </label>

      {/* Error notification */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
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

      {/* Uploaded and In-Flight Images List (Landing page preview style) */}
      {(uploadedUrls.length > 0 || inFlight.length > 0) && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-medium text-black/60 px-0.5">
            <span>
              Images ({uploadedUrls.length} {uploadedUrls.length === 1 ? "photo" : "photos"})
              {isUploading ? ` • Uploading ${inFlight.length}…` : ""}
            </span>
            <span className="text-[11px] text-black/40">First image is the cover photo</span>
          </div>

          <div className="space-y-2">
            {/* Uploaded images */}
            {uploadedUrls.map((url, index) => (
              <div
                key={url}
                className="rounded-xl border border-black/10 bg-neutral-50/70 p-2.5 transition-all hover:bg-neutral-50"
              >
                <div className="flex flex-row items-center gap-3">
                  {/* Proportional compact thumbnail */}
                  <div
                    className="relative overflow-hidden rounded-lg border border-black/10 bg-white flex-none flex items-center justify-center shrink-0 h-16 sm:h-20 max-w-[100px] sm:max-w-[120px]"
                    style={{ aspectRatio: `${aspectRatio}` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Product photo ${index + 1}`}
                      className="h-full w-full object-contain p-1"
                      loading="lazy"
                    />
                  </div>

                  {/* Info and action buttons */}
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {index === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            Storefront Cover
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 bg-neutral-200/60 px-2 py-0.5 rounded">
                            Photo #{index + 1}
                          </span>
                        )}
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded font-medium">
                          Uploaded
                        </span>
                      </div>
                      <p className="text-[11px] text-black/50 truncate max-w-full font-mono">
                        {url.split("/").pop() || `photo-${index + 1}`}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 sm:h-8 sm:px-2.5 text-xs text-neutral-700 hover:bg-neutral-100 gap-1"
                          onClick={() => handleSetAsCover(index)}
                          title="Make this the storefront cover photo"
                        >
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                          <span>Make Cover</span>
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 sm:h-8 sm:px-2.5 text-xs text-black/60 hover:text-black gap-1"
                        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                        title="View full image in new tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 sm:h-8 sm:px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                        onClick={() => handleRemove(index)}
                        disabled={disabled}
                        title="Remove image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* In-flight uploading cards */}
            {inFlight.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-dashed border-primary/30 bg-primary/[0.02] p-2.5 transition-all"
              >
                <div className="flex flex-row items-center gap-3">
                  <div
                    className="relative overflow-hidden rounded-lg border border-primary/20 bg-white flex-none flex items-center justify-center shrink-0 h-16 sm:h-20 max-w-[100px] sm:max-w-[120px]"
                    style={{ aspectRatio: `${aspectRatio}` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="h-full w-full object-contain p-1 opacity-60"
                    />
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1 text-left">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Optimizing &amp; uploading to CDN…
                    </span>
                    <p className="text-[11px] text-black/50 truncate max-w-full font-mono">
                      {item.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
