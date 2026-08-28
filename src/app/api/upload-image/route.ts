/* eslint-disable @typescript-eslint/no-explicit-any */
import { USER_ROLE } from "@/interface/auth.constent";
import { auth } from "@/lib/auth";
import { isR2Configured, uploadBufferToR2 } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/upload-image
 *
 * Same-origin image upload proxy. The browser compresses the selected file to
 * WebP client-side and POSTs it here as `multipart/form-data` under the `file`
 * field. This handler PUTs the bytes to Cloudflare R2 server-side (using the
 * server's own S3 credentials), then returns the public CDN URL.
 *
 * Request:
 *   multipart/form-data with a single `file` part (image/*).
 *
 * Response:
 *   { success: true, data: { publicUrl, key } }
 *
 * Why a proxy instead of a presigned URL? The browser cannot PUT directly to
 * `*.r2.cloudflarestorage.com` unless the bucket has a CORS policy allowing it.
 * This bucket has none, so the preflight OPTIONS fails (403) and every upload
 * reports "All uploads failed". Routing through our own server keeps the
 * request same-origin and sidesteps CORS entirely.
 *
 * Auth: restricted to admin roles so anonymous callers can't write to the
 * bucket. Body size is not capped here, but callers already compress to a
 * ~1000×1000 WebP before posting, so payloads stay small.
 */
export async function POST(request: NextRequest) {
    try {
        await auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN);

        if (!isR2Configured()) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "R2 is not configured on the server. Set R2_ACCOUNT_ID, " +
                        "R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in .env.",
                },
                { status: 503 },
            );
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                { success: false, message: "A `file` part is required" },
                { status: 400 },
            );
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { success: false, message: "Only image files are allowed" },
                { status: 400 },
            );
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        const data = await uploadBufferToR2(
            bytes,
            file.name || "image.webp",
            file.type || "image/webp",
        );

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("POST /api/upload-image error:", err);
        const status = /not authorized|invalid token/i.test(err?.message ?? "")
            ? 401
            : 400;
        return NextResponse.json(
            { success: false, message: err.message || "Failed to upload image" },
            { status },
        );
    }
}
