/* eslint-disable @typescript-eslint/no-explicit-any */
import { USER_ROLE } from "@/interface/auth.constent";
import { auth } from "@/lib/auth";
import { createPresignedUpload, isR2Configured } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/upload-url
 *
 * Mints a short-lived presigned PUT URL for direct browser → R2 upload.
 *
 * Request body:
 *   { fileName: string; contentType?: string }
 *
 * Response:
 *   { success: true, data: { uploadUrl, publicUrl, key } }
 *
 * The browser:
 *   1. compresses/converts the selected file to WebP (client-side),
 *   2. calls this route to get a one-shot PUT URL,
 *   3. PUTs the WebP bytes to `uploadUrl` with `Content-Type: image/webp`,
 *   4. stores the returned `publicUrl` (https://storepage.codebiruni.com/...)
 *      on the product record.
 *
 * Auth: restricted to admin roles so anonymous callers can't mint upload
 * URLs against our bucket. The presigned URL itself expires in 5 minutes.
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

        const body = await request.json().catch(() => null);
        const fileName =
            typeof body?.fileName === "string" && body.fileName.trim().length > 0
                ? body.fileName.trim()
                : "";
        if (!fileName) {
            return NextResponse.json(
                { success: false, message: "fileName is required" },
                { status: 400 },
            );
        }
        const contentType =
            typeof body?.contentType === "string" ? body.contentType : "image/webp";

        // Only allow image content types. The client always sends image/webp, but
        // we guard here too so a crafted request can't mint a URL for arbitrary
        // binary blobs.
        if (!contentType.startsWith("image/")) {
            return NextResponse.json(
                { success: false, message: "contentType must be an image/* type" },
                { status: 400 },
            );
        }

        const data = await createPresignedUpload(fileName, contentType);

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("POST /api/upload-url error:", err);
        const status = /not authorized|invalid token/i.test(err?.message ?? "")
            ? 401
            : 400;
        return NextResponse.json(
            { success: false, message: err.message || "Failed to issue upload URL" },
            { status },
        );
    }
}
