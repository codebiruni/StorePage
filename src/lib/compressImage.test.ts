import { beforeEach, describe, expect, it, vi } from "vitest";

const { imageCompression } = vi.hoisted(() => ({
    imageCompression: vi.fn(),
}));

vi.mock("browser-image-compression", () => ({ default: imageCompression }));

import {
    compressImage,
    compressImages,
    toWebpFileName,
} from "@/lib/compressImage";

function makeFile(name: string, type = "image/png") {
    return new File(["bytes"], name, { type });
}

beforeEach(() => {
    imageCompression.mockReset();
    imageCompression.mockImplementation(async (file: File) => file);
    vi.spyOn(console, "warn").mockImplementation(() => { });
});

describe("lib/compressImage › toWebpFileName", () => {
    it("replaces an existing extension with .webp", () => {
        expect(toWebpFileName("photo.png")).toBe("photo.webp");
    });

    it("handles multi-dot file names", () => {
        expect(toWebpFileName("my.photo.jpeg")).toBe("my.photo.webp");
    });

    it("appends .webp when there is no extension", () => {
        expect(toWebpFileName("photo")).toBe("photo.webp");
    });

    it("falls back to 'image' for an empty name", () => {
        expect(toWebpFileName("")).toBe("image.webp");
    });

    it("treats a bare extension as having no base name", () => {
        expect(toWebpFileName(".gitignore")).toBe("image.webp");
    });
});

describe("lib/compressImage › compressImage", () => {
    it("returns a File renamed to .webp", async () => {
        const result = await compressImage(makeFile("photo.png"));
        expect(result.name).toBe("photo.webp");
    });

    it("normalizes the MIME type to image/webp", async () => {
        const result = await compressImage(makeFile("photo.png"));
        expect(result.type).toBe("image/webp");
    });

    it("caps dimensions at 1920px and uses quality 0.85", async () => {
        await compressImage(makeFile("photo.png"));

        const options = imageCompression.mock.calls[0][1];
        expect(options.maxWidthOrHeight).toBe(1920);
        expect(options.initialQuality).toBe(0.85);
        expect(options.fileType).toBe("image/webp");
        expect(options.useWebWorker).toBe(true);
        expect(options.alwaysKeepResolution).toBe(true);
    });

    it("does not cap the output by byte size", async () => {
        await compressImage(makeFile("photo.png"));
        expect(imageCompression.mock.calls[0][1].maxSizeMB).toBe(
            Number.POSITIVE_INFINITY,
        );
    });

    it("falls back to the default encoder when WebP encoding fails", async () => {
        imageCompression
            .mockRejectedValueOnce(new Error("no webp support"))
            .mockImplementationOnce(async (file: File) => file);

        const result = await compressImage(makeFile("photo.png"));

        expect(imageCompression).toHaveBeenCalledTimes(2);
        expect(imageCompression.mock.calls[1][1].fileType).toBeUndefined();
        expect(result.name).toBe("photo.webp");
        expect(console.warn).toHaveBeenCalled();
    });

    it("still returns image/webp after a fallback", async () => {
        imageCompression
            .mockRejectedValueOnce(new Error("boom"))
            .mockImplementationOnce(async (file: File) => file);

        const result = await compressImage(makeFile("photo.jpg", "image/jpeg"));
        expect(result.type).toBe("image/webp");
    });

    it("propagates a failure from the fallback attempt", async () => {
        imageCompression.mockRejectedValue(new Error("totally broken"));

        await expect(compressImage(makeFile("photo.png"))).rejects.toThrowError(
            "totally broken",
        );
    });
});

describe("lib/compressImage › compressImages", () => {
    it("compresses every file in order", async () => {
        const results = await compressImages([
            makeFile("a.png"),
            makeFile("b.png"),
        ]);

        expect(results.map((f) => f?.name)).toEqual(["a.webp", "b.webp"]);
    });

    it("returns null for an individual failure without aborting the batch", async () => {
        // `compressImage` tries WebP then a JPEG fallback, so a single failing
        // file consumes two mock values before it finally rejects.
        imageCompression.mockImplementation(
            async (file: File, options: { fileType?: string }) => {
                if (file.name === "b.png" || file.name === "c.png") {
                    throw new Error("unencodable");
                }
                if (options.fileType === undefined) throw new Error("fallback failed");
                return file;
            });

        const results = await compressImages([
            makeFile("a.png"),
            makeFile("b.png"),
            makeFile("c.png"),
            makeFile("d.png"),
        ]);

        expect(results[0]?.name).toBe("a.webp");
        expect(results[1]).toBeNull();
        expect(results[2]).toBeNull();
        expect(results[3]?.name).toBe("d.webp");
    });

    it("returns an empty array for no files", async () => {
        await expect(compressImages([])).resolves.toEqual([]);
    });
});
