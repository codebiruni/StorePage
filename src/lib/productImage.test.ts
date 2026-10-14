import { describe, it, expect } from "vitest";
import {
    FALLBACK_PRODUCT_IMAGE,
    isValidImageSrc,
    resolveProductImage,
} from "./productImage";

describe("isValidImageSrc", () => {
    it("accepts absolute http/https URLs", () => {
        expect(isValidImageSrc("https://storepage-cdn.codebiruni.com/a.webp")).toBe(true);
        expect(isValidImageSrc("http://localhost:3000/a.png")).toBe(true);
    });

    it("accepts root-relative paths and data URIs", () => {
        expect(isValidImageSrc("/logo.png")).toBe(true);
        expect(isValidImageSrc("data:image/webp;base64,AAAA")).toBe(true);
    });

    it("rejects the junk value that used to crash next/image", () => {
        // Regression: `new URL("x")` throws "Failed to construct 'URL': Invalid URL",
        // which took down the entire NavTopSection tree.
        expect(isValidImageSrc("x")).toBe(false);
        expect(isValidImageSrc("not a url")).toBe(false);
        expect(isValidImageSrc("//cdn.example.com/a.png")).toBe(false);
    });

    it("rejects empty and non-string values", () => {
        expect(isValidImageSrc("")).toBe(false);
        expect(isValidImageSrc("   ")).toBe(false);
        expect(isValidImageSrc(undefined)).toBe(false);
        expect(isValidImageSrc(null)).toBe(false);
        expect(isValidImageSrc(42)).toBe(false);
        expect(isValidImageSrc({})).toBe(false);
    });
});

describe("resolveProductImage", () => {
    it("returns the first valid entry from an images array", () => {
        expect(
            resolveProductImage(["https://cdn.example.com/a.webp", "/b.png"])
        ).toBe("https://cdn.example.com/a.webp");
    });

    it("skips unusable entries and falls through to a later valid one", () => {
        expect(resolveProductImage(["x", "", "https://cdn.example.com/ok.png"])).toBe(
            "https://cdn.example.com/ok.png"
        );
    });

    it("reads the singular `image` field used by cart snapshots", () => {
        expect(resolveProductImage({ image: "/cart-item.png" })).toBe(
            "/cart-item.png"
        );
    });

    it("prefers `image` but falls back to `image2`", () => {
        expect(resolveProductImage({ image: "x", image2: "/second.png" })).toBe(
            "/second.png"
        );
    });

    it("falls back to images[] when the singular fields are unusable", () => {
        expect(
            resolveProductImage({ image: "x", images: ["/from-array.png"] })
        ).toBe("/from-array.png");
    });

    it("returns the fallback for the real-world corrupt cart row", () => {
        // Shape observed in localStorage: { id, name, price, image: "x" }
        expect(
            resolveProductImage({ id: "abc", name: "Phone", price: 804650, image: "x" })
        ).toBe(FALLBACK_PRODUCT_IMAGE);
    });

    it("accepts a valid image URL directly as a string", () => {
        expect(resolveProductImage("https://cdn.example.com/item.png")).toBe(
            "https://cdn.example.com/item.png"
        );
        expect(resolveProductImage("/item.png")).toBe("/item.png");
    });

    it("returns the fallback for missing or empty input", () => {
        expect(resolveProductImage(undefined)).toBe(FALLBACK_PRODUCT_IMAGE);
        expect(resolveProductImage(null)).toBe(FALLBACK_PRODUCT_IMAGE);
        expect(resolveProductImage({})).toBe(FALLBACK_PRODUCT_IMAGE);
        expect(resolveProductImage([])).toBe(FALLBACK_PRODUCT_IMAGE);
        expect(resolveProductImage("x")).toBe(FALLBACK_PRODUCT_IMAGE);
    });

    it("honours a caller-supplied fallback", () => {
        expect(resolveProductImage(null, "/custom.png")).toBe("/custom.png");
    });
});
