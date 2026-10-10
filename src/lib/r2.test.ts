import { describe, expect, it, vi } from "vitest";
import {
    buildObjectKey,
    isR2Configured,
    publicUrlForKey,
    slugify,
} from "@/lib/r2";
import { publicEnv, requirePublic } from "@/lib/publicEnv";

describe("lib/r2 › slugify", () => {
    it("lowercases and replaces separators with single dashes", () => {
        expect(slugify("My Product Image")).toBe("my-product-image");
        expect(slugify("a___b")).toBe("a-b");
    });

    it("strips accents via NFKD normalisation", () => {
        expect(slugify("Café Crème")).toBe("cafe-creme");
    });

    it("trims leading and trailing separators", () => {
        expect(slugify("---hello---")).toBe("hello");
        expect(slugify("!!!hello!!!")).toBe("hello");
    });

    it("falls back to 'image' when nothing usable remains", () => {
        expect(slugify("")).toBe("image");
        expect(slugify("!!!")).toBe("image");
        expect(slugify("কাচা")).toBe("image");
    });

    it("caps the slug at 60 characters", () => {
        const result = slugify("a".repeat(200));
        expect(result).toHaveLength(60);
    });
});

describe("lib/r2 › buildObjectKey", () => {
    it("builds a products/ key with a forced .webp extension", () => {
        const key = buildObjectKey("My Photo.png");
        expect(key).toMatch(/^products\/\d+-my-photo\.webp$/);
    });

    it("drops the original extension before slugifying", () => {
        const key = buildObjectKey("shirt.jpeg");
        expect(key).toContain("-shirt.webp");
        expect(key).not.toContain("jpeg");
    });

    it("produces a sortable timestamp prefix", () => {
        const before = Date.now();
        const key = buildObjectKey("x.png");
        const ts = Number(key.split("/")[1].split("-")[0]);
        expect(ts).toBeGreaterThanOrEqual(before - 1000);
        expect(ts).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it("falls back to the 'image' slug for unusable names", () => {
        expect(buildObjectKey("!!!.png")).toMatch(/^products\/\d+-image\.webp$/);
    });
});

describe("lib/r2 › publicUrlForKey", () => {
    it("joins the CDN domain with the key", () => {
        expect(publicUrlForKey("products/1-a.webp")).toBe(
            "https://storepage.codebiruni.com/products/1-a.webp",
        );
    });

    it("does not emit a double slash for leading-slash keys", () => {
        expect(publicUrlForKey("/products/1-a.webp")).toBe(
            "https://storepage.codebiruni.com/products/1-a.webp",
        );
    });
});

describe("lib/r2 › isR2Configured", () => {
    it("is false when credentials are absent", () => {
        expect(isR2Configured()).toBe(false);
    });

    it("is true once all three credentials are present", async () => {
        vi.resetModules();
        process.env.R2_ACCOUNT_ID = "acct";
        process.env.R2_ACCESS_KEY_ID = "key";
        process.env.R2_SECRET_ACCESS_KEY = "secret";
        try {
            const mod = await import("@/lib/r2");
            expect(mod.isR2Configured()).toBe(true);
        } finally {
            delete process.env.R2_ACCOUNT_ID;
            delete process.env.R2_ACCESS_KEY_ID;
            delete process.env.R2_SECRET_ACCESS_KEY;
            vi.resetModules();
        }
    });
});

describe("lib/publicEnv › defaults and guards", () => {
    it("provides a safe default site URL and brand", () => {
        expect(publicEnv.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
        expect(publicEnv.NEXT_PUBLIC_BRAND_NAME).toBe("My Store");
        expect(publicEnv.NEXT_PUBLIC_DEFAULT_LOGO).toBe("/logo.png");
    });

    it("never returns undefined for optional analytics ids", () => {
        expect(publicEnv.NEXT_PUBLIC_META_PIXEL_ID).toBe("");
        expect(publicEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID).toBe("");
    });

    it("requirePublic returns a populated value", () => {
        expect(requirePublic("NEXT_PUBLIC_SITE_URL")).toBe("http://localhost:3000");
    });

    it("requirePublic throws for an empty value", () => {
        expect(() => requirePublic("NEXT_PUBLIC_CONTACT_EMAIL")).toThrowError(
            /Missing required public env: NEXT_PUBLIC_CONTACT_EMAIL/,
        );
    });
});
