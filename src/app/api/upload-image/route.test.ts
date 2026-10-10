import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, isR2Configured, uploadBufferToR2 } = vi.hoisted(() => ({
    auth: vi.fn().mockResolvedValue({ id: "u1" }),
    isR2Configured: vi.fn().mockReturnValue(true),
    uploadBufferToR2: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/r2", () => ({ isR2Configured, uploadBufferToR2 }));

import { POST } from "@/app/api/upload-image/route";
import { USER_ROLE } from "@/interface/auth.constent";

/**
 * jsdom's `File` predates the modern Blob API and has no `arrayBuffer()`,
 * which the route calls. jsdom's `FormData` also stringifies `File` values,
 * so we cannot build a real `Request`/`FormData` and have the route's
 * `file instanceof File` guard both pass and expose the bytes.
 *
 * Instead we synthesize a jsdom `File` (so `instanceof File` inside the route
 * succeeds) and graft a working `arrayBuffer()` onto it, then hand it to the
 * handler through a minimal Map-backed `formData()` stub.
 */
function makeUploadFile(name: string, type: string, body = "bytes"): File {
    const file = new File([body], name, { type });
    const bytes = new TextEncoder().encode(body);
    Object.defineProperty(file, "arrayBuffer", {
        value: async () =>
            bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
        configurable: true,
    });
    return file;
}

function stubRequest(entries: Record<string, unknown>) {
    const form = new Map(Object.entries(entries));
    return {
        formData: async () => ({
            get: (key: string) => form.get(key) ?? null,
        }),
    } as unknown as Parameters<typeof POST>[0];
}

/** Build a request carrying one `file` part (or none when `file` is null). */
function postWithFile(
    file: { name: string; type: string; body?: string } | null,
    extra?: Record<string, string>,
) {
    const entries: Record<string, unknown> = { ...extra };
    if (file) {
        entries.file = makeUploadFile(file.name, file.type, file.body);
    } else if (!("file" in entries)) {
        // Distinguish "no file at all" from "a non-File value in `file`".
        entries.file = undefined;
    }
    return POST(stubRequest(entries));
}

describe("api/upload-image › POST", () => {
    beforeEach(() => {
        auth.mockReset().mockResolvedValue({ id: "u1" });
        isR2Configured.mockReset().mockReturnValue(true);
        uploadBufferToR2.mockReset().mockResolvedValue({
            publicUrl: "https://cdn/x.webp",
            key: "products/x.webp",
        });
    });

    it("requires admin or super-admin auth", async () => {
        await postWithFile({ name: "a.webp", type: "image/webp" });

        expect(auth).toHaveBeenCalledWith(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN);
    });

    it("returns 401 when auth rejects with a not-authorized error", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });
        auth.mockRejectedValueOnce(
            new Error("You are not authorized to access this resource"),
        );

        const res = await postWithFile({ name: "a.webp", type: "image/webp" });

        expect(res.status).toBe(401);
        expect((await res.json()).success).toBe(false);
        spy.mockRestore();
    });

    it("returns 401 when auth rejects with an invalid-token error", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });
        auth.mockRejectedValueOnce(
            new Error("Invalid token. Please provide a valid authorization token"),
        );

        const res = await postWithFile({ name: "a.webp", type: "image/webp" });

        expect(res.status).toBe(401);
        spy.mockRestore();
    });

    it("returns 400 for any other auth rejection", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });
        auth.mockRejectedValueOnce(new Error("boom"));

        const res = await postWithFile({ name: "a.webp", type: "image/webp" });

        expect(res.status).toBe(400);
        spy.mockRestore();
    });

    it("returns 503 when R2 is not configured and never uploads", async () => {
        isR2Configured.mockReturnValueOnce(false);

        const res = await postWithFile({ name: "a.webp", type: "image/webp" });

        expect(res.status).toBe(503);
        expect((await res.json()).message).toMatch(/R2 is not configured/);
        expect(uploadBufferToR2).not.toHaveBeenCalled();
    });

    it("names all three required env vars in the 503 message", async () => {
        isR2Configured.mockReturnValueOnce(false);

        const json = await (
            await postWithFile({ name: "a.webp", type: "image/webp" })
        ).json();

        expect(json.message).toMatch(/R2_ACCOUNT_ID/);
        expect(json.message).toMatch(/R2_ACCESS_KEY_ID/);
        expect(json.message).toMatch(/R2_SECRET_ACCESS_KEY/);
    });

    it("rejects a request with no file part with 400", async () => {
        const res = await postWithFile(null);

        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("A `file` part is required");
        expect(uploadBufferToR2).not.toHaveBeenCalled();
    });

    it("rejects a non-file value in the `file` field with 400", async () => {
        const res = await postWithFile(null, { file: "just-a-string" });

        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("A `file` part is required");
    });

    it("rejects a non-image mime type with 400", async () => {
        const res = await postWithFile({
            name: "notes.pdf",
            type: "application/pdf",
        });

        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Only image files are allowed");
        expect(uploadBufferToR2).not.toHaveBeenCalled();
    });

    it("rejects a file with an empty mime type", async () => {
        const res = await postWithFile({ name: "blob", type: "" });

        expect(res.status).toBe(400);
        expect(uploadBufferToR2).not.toHaveBeenCalled();
    });

    it("accepts the image/* family beyond webp", async () => {
        await postWithFile({ name: "photo.png", type: "image/png" });

        expect(uploadBufferToR2).toHaveBeenCalledTimes(1);
    });

    it("uploads the file bytes with its name and mime type", async () => {
        await postWithFile({
            name: "hero.webp",
            type: "image/webp",
            body: "hello",
        });

        const [bytes, name, type] = uploadBufferToR2.mock.calls[0];
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(Array.from(bytes as Uint8Array)).toEqual(
            Array.from(new TextEncoder().encode("hello")),
        );
        expect(name).toBe("hero.webp");
        expect(type).toBe("image/webp");
    });

    it("returns the public url and key on success", async () => {
        const res = await postWithFile({ name: "a.webp", type: "image/webp" });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({
            success: true,
            data: { publicUrl: "https://cdn/x.webp", key: "products/x.webp" },
        });
    });

    it("returns 400 with the thrown message when the R2 upload fails", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });
        uploadBufferToR2.mockRejectedValueOnce(new Error("PutObject denied"));

        const res = await postWithFile({ name: "a.webp", type: "image/webp" });

        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("PutObject denied");
        spy.mockRestore();
    });

    it("falls back to a generic message when the error has no message", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });
        uploadBufferToR2.mockRejectedValueOnce({});

        const res = await postWithFile({ name: "a.webp", type: "image/webp" });

        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Failed to upload image");
        spy.mockRestore();
    });
});
