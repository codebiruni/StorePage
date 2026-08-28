/**
 * Cloudflare R2 S3-compatible client + helpers.
 *
 * Server-only. Never import this from a client component — the access keys
 * live in `env` and must not reach the browser bundle. The presigned-URL
 * route (`/api/upload-url`) is the only public surface; it returns a
 * short-lived PUT URL and the final public CDN URL, never the credentials.
 *
 * Existing Cloudinary URLs in the database are intentionally NOT migrated:
 * they keep rendering through `res.cloudinary.com`. Only *new* uploads flow
 * through this R2 pipeline and return `https://storepage.codebiruni.com/...`.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

/**
 * R2 endpoint. Falls back to an empty string when unconfigured so callers
 * can surface a clear error instead of constructing a malformed URL.
 */
const r2Endpoint = env.R2_ACCOUNT_ID
    ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : "";

/** Lazily-built S3 client. Created on first use so a missing R2 config in
 *  dev (e.g. running the app without R2 keys) doesn't crash server boot. */
let _client: S3Client | null = null;
export function getR2Client(): S3Client {
    if (_client) return _client;
    if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
        throw new Error(
            "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and " +
            "R2_SECRET_ACCESS_KEY in .env before issuing upload URLs.",
        );
    }
    _client = new S3Client({
        region: "auto",
        endpoint: r2Endpoint,
        credentials: {
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
    });
    return _client;
}

/** True when all the keys needed to sign uploads are present. */
export function isR2Configured(): boolean {
    return Boolean(
        env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY,
    );
}

/**
 * Convert a string into a URL-safe slug suitable for an object key.
 * Keeps ASCII alphanumerics, collapses runs of separators to a single `-`.
 */
export function slugify(input: string): string {
    return (
        input
            .toLowerCase()
            .normalize("NFKD")
            // strip accents
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "image"
    );
}

/**
 * Build the object key for a new product image.
 *
 * Structure: `products/${Date.now()}-${slug(originalName)}.webp`
 * The `.webp` extension is enforced because the client always converts to
 * WebP before upload (see `compressImage`).
 */
export function buildObjectKey(originalName: string): string {
    const base = slugify(originalName.replace(/\.[^.]+$/, ""));
    return `products/${Date.now()}-${base}.webp`;
}

/** Public CDN URL for a stored object. */
export function publicUrlForKey(key: string): string {
    const domain = env.R2_PUBLIC_DOMAIN.replace(/\/+$/, "");
    return `${domain}/${key.replace(/^\/+/, "")}`;
}

export interface PresignedUpload {
    uploadUrl: string;
    publicUrl: string;
    key: string;
}

/**
 * Mint a 5-minute presigned PUT URL for `image/webp` and the matching public
 * CDN URL. The caller PUTs the compressed WebP bytes directly to R2 — the
 * server never proxies the file body.
 */
export async function createPresignedUpload(
    originalName: string,
    contentType = "image/webp",
    expiresIn = 300,
): Promise<PresignedUpload> {
    const client = getR2Client();
    const key = buildObjectKey(originalName);
    const command = new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, {
        expiresIn,
    });
    return {
        uploadUrl,
        publicUrl: publicUrlForKey(key),
        key,
    };
}

/**
 * Upload raw bytes to R2 directly from the server (no presigned URL, no CORS).
 *
 * This is the preferred path for browser uploads: the client compresses the
 * image to WebP, POSTs the bytes to `/api/upload-image`, and the server PUTs
 * them to R2 with its own credentials. Because the browser never talks to
 * `*.r2.cloudflarestorage.com` directly, the bucket does NOT need a CORS
 * policy — which fixes uploads that fail in the browser with
 * "All uploads failed" when R2 has no Access-Control-Allow-Origin rules.
 */
export async function uploadBufferToR2(
    buffer: Uint8Array,
    originalName: string,
    contentType = "image/webp",
): Promise<{ publicUrl: string; key: string }> {
    const client = getR2Client();
    const key = buildObjectKey(originalName);
    await client.send(
        new PutObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        }),
    );
    return {
        publicUrl: publicUrlForKey(key),
        key,
    };
}
