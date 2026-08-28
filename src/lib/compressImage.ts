"use client";

/**
 * Client-side image compression + WebP conversion for the R2 upload pipeline.
 *
 * Every selected image (PNG, JPEG, JPG, HEIC, WebP, …) is normalized to a
 * `.webp` File before it ever leaves the browser:
 *   - max bounding box: 1000×1000px (aspect preserved)
 *   - WebP quality: 0.80
 *   - output File extension: strictly `.webp`
 *
 * This keeps bandwidth + R2 storage low and gives the storefront a single
 * modern format. `browser-image-compression` handles canvas encoding; for
 * browsers that can't encode WebP it falls back to JPEG, in which case we
 * still rename the extension to `.webp` so the object key stays consistent
 * — R2 serves by content-type, and we always PUT with `image/webp`.
 */
import imageCompression from "browser-image-compression";

const MAX_DIMENSION = 1000;
const WEBP_QUALITY = 0.8;

/**
 * Convert a base file name (with or without extension) into a `.webp` name.
 */
export function toWebpFileName(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, "") || "image";
    return `${base}.webp`;
}

/**
 * Compress a single File to WebP. Returns a new File whose `name` ends in
 * `.webp` and whose MIME type is `image/webp` (or the browser's best effort).
 */
export async function compressImage(file: File): Promise<File> {
    const options = {
        maxSizeMB: Number.POSITIVE_INFINITY, // we cap by dimension, not bytes
        maxWidthOrHeight: MAX_DIMENSION,
        useWebWorker: true,
        initialQuality: WEBP_QUALITY,
        fileType: "image/webp",
    };

    let compressed: File;
    try {
        compressed = await imageCompression(file, options);
    } catch (err) {
        // Some Safari versions can't encode WebP via canvas. Fall back to the
        // library's default (JPEG) so the upload still succeeds; we still rename
        // to .webp and PUT with image/webp so the key/content-type are consistent.
        console.warn("[compressImage] WebP encode failed, falling back:", err);
        compressed = await imageCompression(file, {
            ...options,
            fileType: undefined,
        });
    }

    const webpName = toWebpFileName(file.name);
    // Normalize the type to image/webp for the PUT request. If the browser
    // couldn't actually encode WebP, R2 will still store the bytes; the CDN
    // will serve them with the content-type we set on the PUT.
    return new File([compressed], webpName, { type: "image/webp" });
}

/**
 * Compress many files in parallel. Individual failures don't abort the
 * whole batch — they're returned as `null` so the caller can skip them.
 */
export async function compressImages(
    files: File[],
): Promise<(File | null)[]> {
    return Promise.all(files.map((f) => compressImage(f).catch(() => null)));
}
