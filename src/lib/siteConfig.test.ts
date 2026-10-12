// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findOne, connectDb } = vi.hoisted(() => ({
    findOne: vi.fn(),
    connectDb: vi.fn().mockResolvedValue(undefined),
}));

// `unstable_cache` is a Next.js server primitive with no meaning in a unit
// test — make it a pass-through so we exercise the real fetcher body.
vi.mock("next/cache", () => ({
    unstable_cache: (fn: unknown) => fn,
}));
vi.mock("@/lib/connectdb", () => ({ default: connectDb }));
vi.mock("@/models/siteInfo.model", () => ({ default: { findOne } }));

import {
    SITE_CONFIG_TAG,
    getEnvSiteConfig,
    getSiteConfig,
} from "@/lib/siteConfig";

function stubDoc(doc: unknown) {
    findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(doc) });
}

describe("siteConfig › SITE_CONFIG_TAG", () => {
    it("exposes the documented cache tag", () => {
        expect(SITE_CONFIG_TAG).toBe("siteinfo:current");
    });
});

describe("siteConfig › getEnvSiteConfig", () => {
    it("returns the documented delivery-charge defaults", () => {
        const config = getEnvSiteConfig();
        expect(config.deliveryCharge).toEqual({ insideDhaka: 70, outsideDhaka: 90 });
    });

    it("returns empty collections rather than undefined", () => {
        const config = getEnvSiteConfig();
        expect(config.addresses).toEqual([]);
        expect(config.footerLinks).toEqual([]);
        expect(config.banner.carousel).toEqual([]);
        expect(config.banner.firstImage).toEqual({});
        expect(config.banner.secondImage).toEqual({});
    });

    it("never leaves required string fields undefined", () => {
        const config = getEnvSiteConfig();
        for (const key of [
            "name",
            "tagline",
            "logo",
            "themeColor",
            "buttonColor",
            "buttonTextColor",
            "marqueeText",
            "mapLink",
            "siteUrl",
            "metaPixelId",
            "gaMeasurementId",
        ] as const) {
            expect(typeof config[key]).toBe("string");
        }
    });

    it("returns a fresh object on every call", () => {
        expect(getEnvSiteConfig()).not.toBe(getEnvSiteConfig());
    });
});

describe("siteConfig › getSiteConfig", () => {
    beforeEach(() => {
        findOne.mockReset();
        connectDb.mockReset().mockResolvedValue(undefined);
    });

    it("returns env defaults when no siteInfo document exists", async () => {
        stubDoc(null);
        await expect(getSiteConfig()).resolves.toEqual(getEnvSiteConfig());
        expect(connectDb).toHaveBeenCalled();
    });

    it("returns env defaults and warns when the DB is unreachable", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => { });
        connectDb.mockRejectedValueOnce(new Error("ECONNREFUSED"));

        await expect(getSiteConfig()).resolves.toEqual(getEnvSiteConfig());
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it("lets document fields override the env defaults", async () => {
        stubDoc({ name: "Acme", tagline: "Buy things", email: "a@b.c" });
        const config = await getSiteConfig();

        expect(config.name).toBe("Acme");
        expect(config.tagline).toBe("Buy things");
        expect(config.contact.email).toBe("a@b.c");
    });

    it("maps the legacy `number` column onto contact.phone", async () => {
        stubDoc({ number: "+8801700000000" });
        expect((await getSiteConfig()).contact.phone).toBe("+8801700000000");
    });

    it("maps the misspelled `instagrame` column onto social.instagram", async () => {
        stubDoc({ socialContact: { instagrame: "https://ig.me/x" } });
        expect((await getSiteConfig()).social.instagram).toBe("https://ig.me/x");
    });

    it("lets document buttonColor and themeColor override env defaults", async () => {
        stubDoc({ buttonColor: "#16a34a", buttonTextColor: "#f8fafc" });
        const config = await getSiteConfig();

        expect(config.buttonColor).toBe("#16a34a");
        expect(config.buttonTextColor).toBe("#f8fafc");
    });

    it("always keeps env siteUrl (siteInfo has no siteUrl field)", async () => {
        const base = getEnvSiteConfig();
        stubDoc({ siteUrl: "https://evil.test" });
        const config = await getSiteConfig();

        expect(config.siteUrl).toBe(base.siteUrl);
    });

    it("defaults tiktok to an empty string when absent", async () => {
        stubDoc({});
        expect((await getSiteConfig()).social.tiktok).toBe("");
    });

    it("preserves explicit delivery charges", async () => {
        stubDoc({ deliveryCharge: { insideDhaka: 50, outsideDhaka: 120 } });
        expect((await getSiteConfig()).deliveryCharge).toEqual({
            insideDhaka: 50,
            outsideDhaka: 120,
        });
    });

    it("falls back per-field when only one delivery charge is supplied", async () => {
        stubDoc({ deliveryCharge: { insideDhaka: 50 } });
        expect((await getSiteConfig()).deliveryCharge).toEqual({
            insideDhaka: 50,
            outsideDhaka: 90,
        });
    });

    it("normalizes address entries and blanks missing sub-fields", async () => {
        stubDoc({ addresses: [{ name: "HQ", address: "Dhaka" }, { name: "Branch" }] });
        expect((await getSiteConfig()).addresses).toEqual([
            { name: "HQ", address: "Dhaka" },
            { name: "Branch", address: "" },
        ]);
    });

    it("normalizes footer links", async () => {
        stubDoc({ footerLinks: [{ name: "Privacy", url: "/privacy" }, {}] });
        expect((await getSiteConfig()).footerLinks).toEqual([
            { name: "Privacy", url: "/privacy" },
            { name: "", url: "" },
        ]);
    });

    it("normalizes banner carousel slides", async () => {
        stubDoc({ banner: { carousel: [{ image: "a.png" }, { link: "/x" }] } });
        expect((await getSiteConfig()).banner.carousel).toEqual([
            { image: "a.png", link: "" },
            { image: "", link: "/x" },
        ]);
    });

    it("reads both side banner images", async () => {
        stubDoc({
            banner: {
                firstImage: { image: "1.png", link: "/one" },
                secondImage: { image: "2.png", link: "/two" },
            },
        });
        const { banner } = await getSiteConfig();
        expect(banner.firstImage).toEqual({ image: "1.png", link: "/one" });
        expect(banner.secondImage).toEqual({ image: "2.png", link: "/two" });
    });

    it("falls back to empty banner collections when the doc omits them", async () => {
        stubDoc({ name: "No Banner" });
        const { banner } = await getSiteConfig();
        expect(banner.carousel).toEqual([]);
        expect(banner.firstImage).toEqual({ image: undefined, link: undefined });
    });

    it("replaces non-array collections with the env defaults", async () => {
        stubDoc({ addresses: "not-an-array", footerLinks: 42 });
        const config = await getSiteConfig();
        expect(config.addresses).toEqual([]);
        expect(config.footerLinks).toEqual([]);
    });

    it("carries analytics ids through", async () => {
        stubDoc({ metaPixelId: "PX-1", gaMeasurementId: "G-1" });
        const config = await getSiteConfig();
        expect(config.metaPixelId).toBe("PX-1");
        expect(config.gaMeasurementId).toBe("G-1");
    });

    it("never returns undefined for any top-level key", async () => {
        stubDoc({});
        const config = await getSiteConfig();
        for (const [key, value] of Object.entries(config)) {
            expect(value, `expected ${key} to be defined`).toBeDefined();
        }
    });

    it("drops keys that are not in the whitelist during normalization", async () => {
        const row = { name: "N", address: "A", _id: "buffer", __v: 3 };
        stubDoc({ addresses: [row] });
        const config = await getSiteConfig();

        expect(config.addresses).toEqual([{ name: "N", address: "A" }]);
        // The normalized entry is a plain copy, not the source object.
        expect(config.addresses[0]).not.toBe(row);
    });

    it("blanks out address entries that expose no name/address fields", async () => {
        stubDoc({ addresses: [{ toJSON: () => ({ name: "N", address: "A" }) }] });
        expect((await getSiteConfig()).addresses).toEqual([{ name: "", address: "" }]);
    });
});
