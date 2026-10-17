"use client";

/**
 * Client-side image compression + WebP conversion for the upload pipeline.
 *
 * Every selected image (PNG, JPEG, JPG, HEIC, WebP, …) is normalized to a
 * `.webp` File before it ever leaves the browser:
 *   - max bounding box: 1920×1920px (aspect preserved)
 *   - WebP quality: 0.85
 *   - output File extension: strictly `.webp`
 *
 * This keeps bandwidth + storage low while preserving crisp resolution for
 * desktop banners, product showcases, and high-DPI (Retina) displays.
 * `browser-image-compression` handles canvas encoding; for browsers that can't
 * encode WebP it falls back to JPEG, in which case we still rename the extension
 * to `.webp` so the object key stays consistent — storage serves by content-type,
 * and we always PUT with `image/webp`.
 */
import imageCompression from "browser-image-compression";

const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 0.85;

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
    // SVGs and GIFs are vectors / animations that shouldn't be rasterized or converted to static WebP
    if (
        file.type === "image/svg+xml" ||
        file.name.toLowerCase().endsWith(".svg") ||
        file.type === "image/gif" ||
        file.name.toLowerCase().endsWith(".gif")
    ) {
        return file;
    }

    const options = {
        maxSizeMB: Number.POSITIVE_INFINITY, // we cap by dimension, not bytes
        maxWidthOrHeight: MAX_DIMENSION,
        useWebWorker: true,
        initialQuality: WEBP_QUALITY,
        alwaysKeepResolution: true,
        fileType: "image/webp",
    };

    let compressed: File;
    try {
        compressed = await imageCompression(file, options);
    } catch (err) {
        // Some Safari versions can't encode WebP via canvas or web worker fails.
        // Fall back to main thread (useWebWorker: false) and library default (JPEG)
        // so the upload still succeeds without hanging the browser.
        console.warn("[compressImage] WebP encode failed, falling back:", err);
        compressed = await imageCompression(file, {
            ...options,
            useWebWorker: false,
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
