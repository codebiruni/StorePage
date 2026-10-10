import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSiteConfig } = vi.hoisted(() => ({ getSiteConfig: vi.fn() }));

vi.mock("@/lib/siteConfig", () => ({ getSiteConfig }));

import { GET } from "@/app/api/site-info/route";

describe("api/site-info › GET", () => {
    beforeEach(() => {
        getSiteConfig.mockReset();
    });

    it("returns the merged config as { success, data }", async () => {
        const config = { brandName: "TestBrand", addresses: [] };
        getSiteConfig.mockResolvedValue(config);

        const res = await GET();
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ success: true, data: config });
    });

    it("calls getSiteConfig exactly once with no arguments", async () => {
        getSiteConfig.mockResolvedValue({});

        await GET();

        expect(getSiteConfig).toHaveBeenCalledTimes(1);
        expect(getSiteConfig).toHaveBeenCalledWith();
    });

    it("sets a short-lived public cache header", async () => {
        getSiteConfig.mockResolvedValue({});

        const res = await GET();

        expect(res.headers.get("Cache-Control")).toBe(
            "public, max-age=30, s-maxage=60",
        );
    });

    it("returns 500 with a generic message when the config load throws", async () => {
        // Keep the expected console.error from cluttering stderr.
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });
        getSiteConfig.mockRejectedValue(new Error("mongo down"));

        const res = await GET();
        const json = await res.json();

        expect(res.status).toBe(500);
        expect(json).toEqual({
            success: false,
            message: "Failed to load site configuration",
        });
        spy.mockRestore();
    });

    it("does not leak the underlying error message to the client", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });
        getSiteConfig.mockRejectedValue(new Error("secret connection string"));

        const json = await (await GET()).json();

        expect(json.message).not.toMatch(/secret connection string/);
        spy.mockRestore();
    });

    it("still returns 500 when a non-Error value is thrown", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });
        getSiteConfig.mockRejectedValue("plain string failure");

        const res = await GET();

        expect(res.status).toBe(500);
        expect((await res.json()).success).toBe(false);
        spy.mockRestore();
    });

    it("passes through an empty config object without special-casing it", async () => {
        // The route's contract is that `getSiteConfig` never returns undefined;
        // an empty object must still be reported as success.
        getSiteConfig.mockResolvedValue({});

        const json = await (await GET()).json();

        expect(json.success).toBe(true);
        expect(json.data).toEqual({});
    });

    it("marks the route as dynamic so Next never statically caches it", async () => {
        const mod = await import("@/app/api/site-info/route");
        expect(mod.dynamic).toBe("force-dynamic");
    });

    it("serialises an empty data object (no undefined) successfully", async () => {
        getSiteConfig.mockResolvedValue({});

        const res = await GET();
        const text = await res.text();

        expect(res.status).toBe(200);
        expect(text).not.toMatch(/undefined/);
    });
});
