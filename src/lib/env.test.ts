import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `env.ts` reads `process.env` through lazy getters, so we can mutate the
 * environment between tests and re-import the module to observe behavior.
 */
const REQUIRED_KEYS = [
    "MONGODB_URI",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
] as const;

async function importEnv() {
    vi.resetModules();
    return import("@/lib/env");
}

describe("lib/env › required secrets", () => {
    let saved: Record<string, string | undefined>;

    beforeEach(() => {
        saved = {};
        for (const k of REQUIRED_KEYS) {
            saved[k] = process.env[k];
            delete process.env[k];
        }
        delete process.env.NEXT_PHASE;
    });

    afterEach(() => {
        for (const k of REQUIRED_KEYS) {
            if (saved[k] === undefined) delete process.env[k];
            else process.env[k] = saved[k];
        }
        delete process.env.NEXT_PHASE;
    });

    it("throws a descriptive error when a required key is missing at runtime", async () => {
        const { env } = await importEnv();
        expect(() => env.MONGODB_URI).toThrowError(/Missing required environment variable: MONGODB_URI/);
    });

    it("does not throw for missing required keys during the Next.js build phase", async () => {
        process.env.NEXT_PHASE = "phase-production-build";
        const { env } = await importEnv();
        expect(env.MONGODB_URI).toBe("");
        expect(env.JWT_ACCESS_SECRET).toBe("");
    });

    it("returns the configured value when present", async () => {
        process.env.MONGODB_URI = "mongodb://example/db";
        const { env } = await importEnv();
        expect(env.MONGODB_URI).toBe("mongodb://example/db");
    });

    it("treats an empty string as missing", async () => {
        process.env.MONGODB_URI = "";
        const { env } = await importEnv();
        expect(() => env.MONGODB_URI).toThrowError(/MONGODB_URI/);
    });

    it("exposes both JWT secrets as required", async () => {
        process.env.MONGODB_URI = "mongodb://example/db";
        process.env.JWT_ACCESS_SECRET = "a";
        const { env } = await importEnv();
        expect(env.JWT_ACCESS_SECRET).toBe("a");
        expect(() => env.JWT_REFRESH_SECRET).toThrowError(/JWT_REFRESH_SECRET/);
    });
});

describe("lib/env › optional values and defaults", () => {
    it("applies documented fallbacks for unset optional keys", async () => {
        const { env } = await importEnv();
        expect(env.JWT_ACCESS_EXPIRES_IN).toBe("7d");
        expect(env.JWT_REFRESH_EXPIRES_IN).toBe("90d");
        expect(env.EMAIL_HOST).toBe("smtp.gmail.com");
        expect(env.EMAIL_PORT).toBe("587");
        expect(env.APP_URL).toBe("http://localhost:3000");
        expect(env.CLOUDINARY_CLOUD_NAME).toBe("demo");
        expect(env.R2_BUCKET_NAME).toBe("client-brandx-assets");
        expect(env.R2_PUBLIC_DOMAIN).toBe("https://storepage.codebiruni.com");
        expect(env.PWA_REGISTER).toBe("true");
        expect(env.PWA_SKIP_WAITING).toBe("true");
        expect(env.ALLOW_ALL_IMAGE_HOSTS).toBe("false");
    });

    it("never returns undefined for optional analytics keys", async () => {
        const { env } = await importEnv();
        expect(env.META_PIXEL_ID).toBe("");
        expect(env.META_CONVERSIONS_API_TOKEN).toBe("");
        expect(env.GA_MEASUREMENT_ID).toBe("");
        expect(env.GEMINI_API_KEY).toBe("");
    });

    it("prefers an explicit value over the fallback", async () => {
        const original = process.env.APP_URL;
        process.env.APP_URL = "https://shop.example.com";
        try {
            const { env } = await importEnv();
            expect(env.APP_URL).toBe("https://shop.example.com");
        } finally {
            if (original === undefined) delete process.env.APP_URL;
            else process.env.APP_URL = original;
        }
    });
});

describe("lib/env › NODE_ENV normalisation", () => {
    it("reports 'test' when NODE_ENV is test", async () => {
        const { env } = await importEnv();
        expect(env.NODE_ENV).toBe("test");
    });

    it("falls back to development for unrecognised values", async () => {
        const original = process.env.NODE_ENV;
        const envBag = process.env as Record<string, string | undefined>;
        envBag.NODE_ENV = "staging";
        try {
            const { env } = await importEnv();
            expect(env.NODE_ENV).toBe("development");
        } finally {
            envBag.NODE_ENV = original;
        }
    });
});

describe("lib/env › publicEnv re-exports", () => {
    it("re-exports publicEnv and requirePublic from the public module", async () => {
        const mod = await importEnv();
        expect(mod.publicEnv).toBeDefined();
        expect(typeof mod.requirePublic).toBe("function");
    });
});
