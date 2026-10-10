import { beforeEach, describe, expect, it, vi } from "vitest";

const { compressImage } = vi.hoisted(() => ({ compressImage: vi.fn() }));

vi.mock("@/lib/compressImage", () => ({
    compressImage,
    compressImages: vi.fn(),
}));

import { uploadImageToR2, uploadImagesToR2 } from "@/lib/uploadImage";

const fetchMock = vi.fn();

function webpFile(name = "photo.webp") {
    return new File(["bytes"], name, { type: "image/webp" });
}

function jsonResponse(body: unknown, ok = true, status = 200) {
    return { ok, status, json: async () => body };
}

beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
        jsonResponse({ data: { publicUrl: "https://cdn/x.webp", key: "x.webp" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    compressImage.mockReset().mockImplementation(async () => webpFile());
});

describe("lib/uploadImage › uploadImageToR2", () => {
    it("compresses the file before uploading", async () => {
        const input = new File(["raw"], "raw.png", { type: "image/png" });
        await uploadImageToR2(input);

        expect(compressImage).toHaveBeenCalledWith(input);
    });

    it("posts to the same-origin proxy route with credentials", async () => {
        await uploadImageToR2(new File(["raw"], "raw.png", { type: "image/png" }));

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("/api/upload-image");
        expect(init.method).toBe("POST");
        expect(init.credentials).toBe("include");
    });

    it("sends the compressed bytes as multipart form data", async () => {
        await uploadImageToR2(new File(["raw"], "raw.png", { type: "image/png" }));

        const body = fetchMock.mock.calls[0][1].body;
        expect(body).toBeInstanceOf(FormData);
        const sent = body.get("file") as File;
        expect(sent.name).toBe("photo.webp");
    });

    it("returns the public url, key and file name", async () => {
        const result = await uploadImageToR2(
            new File(["raw"], "raw.png", { type: "image/png" }),
        );

        expect(result).toEqual({
            publicUrl: "https://cdn/x.webp",
            key: "x.webp",
            fileName: "photo.webp",
        });
    });

    it("throws the server-provided error message", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse({ message: "Not authorized" }, false, 401),
        );

        await expect(
            uploadImageToR2(new File(["raw"], "raw.png", { type: "image/png" })),
        ).rejects.toThrowError("Not authorized");
    });

    it("accepts an `error` field as the failure message", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ error: "Boom" }, false, 500));

        await expect(
            uploadImageToR2(new File(["raw"], "raw.png", { type: "image/png" })),
        ).rejects.toThrowError("Boom");
    });

    it("falls back to a status-based message when the body is unparseable", async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 503,
            json: async () => {
                throw new Error("not json");
            },
        });

        await expect(
            uploadImageToR2(new File(["raw"], "raw.png", { type: "image/png" })),
        ).rejects.toThrowError("Failed to upload image (503)");
    });

    it("throws when the response omits publicUrl", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ data: { key: "x.webp" } }));

        await expect(
            uploadImageToR2(new File(["raw"], "raw.png", { type: "image/png" })),
        ).rejects.toThrowError("Upload response was missing fields");
    });

    it("throws when the response has no data envelope at all", async () => {
        fetchMock.mockResolvedValue(jsonResponse({}));

        await expect(
            uploadImageToR2(new File(["raw"], "raw.png", { type: "image/png" })),
        ).rejects.toThrowError("Upload response was missing fields");
    });
});

describe("lib/uploadImage › uploadImagesToR2", () => {
    it("uploads every file in order", async () => {
        const results = await uploadImagesToR2([
            new File(["a"], "a.png", { type: "image/png" }),
            new File(["b"], "b.png", { type: "image/png" }),
        ]);

        expect(results).toHaveLength(2);
        expect(results.every((r) => r !== null)).toBe(true);
    });

    it("nulls out only the failing uploads", async () => {
        fetchMock
            .mockResolvedValueOnce(
                jsonResponse({ data: { publicUrl: "https://cdn/a", key: "a" } }),
            )
            .mockResolvedValueOnce(jsonResponse({ message: "nope" }, false, 400))
            .mockResolvedValueOnce(
                jsonResponse({ data: { publicUrl: "https://cdn/c", key: "c" } }),
            );

        const results = await uploadImagesToR2([
            new File(["a"], "a.png", { type: "image/png" }),
            new File(["b"], "b.png", { type: "image/png" }),
            new File(["c"], "c.png", { type: "image/png" }),
        ]);

        expect(results[0]?.publicUrl).toBe("https://cdn/a");
        expect(results[1]).toBeNull();
        expect(results[2]?.publicUrl).toBe("https://cdn/c");
    });

    it("returns an empty array for no files", async () => {
        await expect(uploadImagesToR2([])).resolves.toEqual([]);
    });
});
