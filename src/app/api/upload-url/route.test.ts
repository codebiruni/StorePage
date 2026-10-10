import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, isR2Configured, createPresignedUpload } = vi.hoisted(() => ({
    auth: vi.fn().mockResolvedValue({ id: "u1" }),
    isR2Configured: vi.fn().mockReturnValue(true),
    createPresignedUpload: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/r2", () => ({ isR2Configured, createPresignedUpload }));

import { POST } from "@/app/api/upload-url/route";
import { USER_ROLE } from "@/interface/auth.constent";

function post(body: unknown, raw = false) {
    const req = new Request("http://localhost/api/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: raw ? (body as string) : JSON.stringify(body),
    });
    return POST(req as never);
}

describe("api/upload-url › POST", () => {
    beforeEach(() => {
        auth.mockReset().mockResolvedValue({ id: "u1" });
        isR2Configured.mockReset().mockReturnValue(true);
        createPresignedUpload
            .mockReset()
            .mockResolvedValue({ uploadUrl: "https://r2/put", publicUrl: "https://cdn/x.webp", key: "products/x.webp" });
    });

    it("requires admin or super-admin auth", async () => {
        await post({ fileName: "a.png" });
        expect(auth).toHaveBeenCalledWith(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN);
    });

    it("maps an auth rejection to 401", async () => {
        auth.mockRejectedValueOnce(new Error("You are not authorized to access this resource"));
        const res = await post({ fileName: "a.png" });

        expect(res.status).toBe(401);
        expect((await res.json()).success).toBe(false);
    });

    it("maps an 'Invalid token' rejection to 401", async () => {
        auth.mockRejectedValueOnce(new Error("Invalid token. Please provide a valid authorization token"));
        expect((await post({ fileName: "a.png" })).status).toBe(401);
    });

    it("maps any other rejection to 400", async () => {
        auth.mockRejectedValueOnce(new Error("boom"));
        expect((await post({ fileName: "a.png" })).status).toBe(400);
    });

    it("returns 503 when R2 is not configured", async () => {
        isR2Configured.mockReturnValueOnce(false);
        const res = await post({ fileName: "a.png" });

        expect(res.status).toBe(503);
        expect((await res.json()).message).toMatch(/R2 is not configured/);
        expect(createPresignedUpload).not.toHaveBeenCalled();
    });

    it("rejects a missing fileName with 400", async () => {
        const res = await post({});
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("fileName is required");
    });

    it("rejects a whitespace-only fileName with 400", async () => {
        expect((await post({ fileName: "   " })).status).toBe(400);
    });

    it("rejects a non-string fileName with 400", async () => {
        expect((await post({ fileName: 42 })).status).toBe(400);
    });

    it("rejects malformed JSON with 400", async () => {
        const res = await post("{not json", true);
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("fileName is required");
    });

    it("rejects a non-image contentType with 400", async () => {
        const res = await post({ fileName: "a.exe", contentType: "application/octet-stream" });

        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("contentType must be an image/* type");
        expect(createPresignedUpload).not.toHaveBeenCalled();
    });

    it("defaults the contentType to image/webp", async () => {
        await post({ fileName: "a.png" });
        expect(createPresignedUpload).toHaveBeenCalledWith("a.png", "image/webp");
    });

    it("trims the fileName before signing", async () => {
        await post({ fileName: "  spaced.webp  " });
        expect(createPresignedUpload).toHaveBeenCalledWith("spaced.webp", "image/webp");
    });

    it("honours an explicit image contentType", async () => {
        await post({ fileName: "a.png", contentType: "image/png" });
        expect(createPresignedUpload).toHaveBeenCalledWith("a.png", "image/png");
    });

    it("returns the presigned payload on success", async () => {
        const res = await post({ fileName: "a.png" });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            success: true,
            data: {
                uploadUrl: "https://r2/put",
                publicUrl: "https://cdn/x.webp",
                key: "products/x.webp",
            },
        });
    });

    it("returns 400 when the signing call itself throws", async () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => { });
        createPresignedUpload.mockRejectedValueOnce(new Error("R2 down"));

        const res = await post({ fileName: "a.png" });
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("R2 down");
        error.mockRestore();
    });

    it("uses a generic message when the error has no message", async () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => { });
        createPresignedUpload.mockRejectedValueOnce({});

        const res = await post({ fileName: "a.png" });
        expect((await res.json()).message).toBe("Failed to issue upload URL");
        error.mockRestore();
    });
});
