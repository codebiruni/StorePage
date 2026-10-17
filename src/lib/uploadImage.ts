"use client";

/**
 * Browser-side helper for the R2 upload pipeline.
 *
 * Flow:
 *   1. compress the File to WebP (`compressImage`)
 *   2. POST /api/upload-image with the WebP bytes (multipart/form-data)
 *   3. our server PUTs the bytes to R2 and returns `publicUrl`
 *      (https://storepage-cdn.codebiruni.com/...) to store on the record.
 *
 * This module is client-only; it never touches R2 credentials.
 *
 * We proxy through our own server instead of PUTting to a presigned R2 URL
 * directly, because the R2 bucket has no CORS policy and the browser would
 * block that cross-origin PUT (preflight returns 403 → "All uploads failed").
 */
import { compressImage } from "@/lib/compressImage";

export interface UploadResult {
    publicUrl: string;
    key: string;
    fileName: string;
}

/**
 * Compress + upload a single image File to R2 via the same-origin proxy route.
 * Throws on any failure so callers can handle per-file errors.
 */
export async function uploadImageToR2(file: File): Promise<UploadResult> {
    let fileToUpload: File;
    try {
        fileToUpload = await compressImage(file);
    } catch (err) {
        console.warn("[uploadImageToR2] Compression failed, falling back to original file:", err);
        fileToUpload = file;
    }

    const formData = new FormData();
    formData.append("file", fileToUpload, fileToUpload.name);

    async function sendRequest(): Promise<Response> {
        return fetch("/api/upload-image", {
            method: "POST",
            credentials: "include",
            body: formData,
        });
    }

    let res: Response;
    try {
        res = await sendRequest();
    } catch (networkErr) {
        // Retry once on network failure
        console.warn("[uploadImageToR2] First upload attempt encountered network error, retrying...", networkErr);
        try {
            res = await sendRequest();
        } catch (retryErr) {
            throw new Error("Network connection error while uploading image. Please check your connection.");
        }
    }

    if (!res.ok) {
        let msg = `Failed to upload image (${res.status})`;
        try {
            const err = await res.json();
            msg = err.message || err.error || msg;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
    const json = await res.json();
    const { publicUrl, key } = json.data ?? {};

    if (!publicUrl) {
        throw new Error("Upload response was missing fields");
    }

    return { publicUrl, key, fileName: fileToUpload.name };
}

/**
 * Upload many files in parallel, returning per-file results. A failure on
 * one file does not abort the others; failures come back as `null`.
 */
export async function uploadImagesToR2(
    files: File[],
): Promise<(UploadResult | null)[]> {
    return Promise.all(files.map((f) => uploadImageToR2(f).catch(() => null)));
}
