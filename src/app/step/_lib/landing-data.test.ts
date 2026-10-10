import { beforeEach, describe, expect, it, vi } from "vitest";

const { findById, find } = vi.hoisted(() => ({
    findById: vi.fn(),
    find: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/connectdb", () => ({ default: vi.fn(async () => undefined) }));
vi.mock("@/models/product.model", () => ({ default: { findById, find } }));
vi.mock("next/cache", () => ({
    unstable_cache: (fn: unknown) => fn,
}));

import {
    buildDefaultLanding,
    buildLandingConfig,
    getLandingProduct,
    listAllProductIds,
    productTag,
} from "@/app/step/_lib/landing-data";
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-shared";

beforeEach(() => {
    findById.mockReset();
    find.mockReset();
});

function product(
    overrides: Partial<SerializedLandingProduct> = {},
): SerializedLandingProduct {
    return {
        _id: "p1",
        slug: "p1",
        name: "Widget",
        images: [],
        details: "",
        quickOverview: [],
        generalPrice: { currentPrice: 0, prevPrice: 0, discountPercentage: 0 },
        hasOffer: false,
        ...overrides,
    };
}

describe("app/step/_lib/landing-data › productTag", () => {
    it("builds the cache tag for a product id", () => {
        expect(productTag("abc")).toBe("product:abc");
    });
});

describe("app/step/_lib/landing-data › getLandingProduct", () => {
    it("returns null for an empty id without querying", async () => {
        await expect(getLandingProduct("")).resolves.toBeNull();
        expect(findById).not.toHaveBeenCalled();
    });

    it("returns null when the product does not exist", async () => {
        findById.mockReturnValue({ lean: async () => null });
        await expect(getLandingProduct("p1")).resolves.toBeNull();
    });

    it("projects a document into a JSON-safe product", async () => {
        findById.mockReturnValue({
            lean: async () => ({
                _id: { toString: () => "p1" },
                name: "Widget",
                images: ["a.png", "b.png"],
                details: "Nice",
                quickOverview: ["fast", "cheap"],
                generalPrice: {
                    currentPrice: "120",
                    prevPrice: "150",
                    discountPercentage: "20",
                },
                hasOffer: true,
                offerPercentage: "20",
                offerEndDate: "2026-01-01T00:00:00.000Z",
            }),
        });

        const result = await getLandingProduct("p1");

        expect(result).toMatchObject({
            _id: "p1",
            slug: "p1",
            name: "Widget",
            images: ["a.png", "b.png"],
            quickOverview: ["fast", "cheap"],
            generalPrice: {
                currentPrice: 120,
                prevPrice: 150,
                discountPercentage: 20,
            },
            hasOffer: true,
            offerPercentage: 20,
            offerEndDate: "2026-01-01T00:00:00.000Z",
        });
    });

    it("coerces a Date offerEndDate to an ISO string", async () => {
        const date = new Date("2026-03-05T10:00:00.000Z");
        findById.mockReturnValue({
            lean: async () => ({ _id: "p1", name: "W", offerEndDate: date }),
        });

        const result = await getLandingProduct("p1");
        expect(result?.offerEndDate).toBe(date.toISOString());
    });

    it("leaves offerEndDate undefined for an unexpected type", async () => {
        findById.mockReturnValue({
            lean: async () => ({ _id: "p1", name: "W", offerEndDate: 12345 }),
        });

        const result = await getLandingProduct("p1");
        expect(result?.offerEndDate).toBeUndefined();
    });

    it("defaults missing fields to safe empty values", async () => {
        findById.mockReturnValue({ lean: async () => ({ _id: "p1" }) });

        const result = await getLandingProduct("p1");

        expect(result).toMatchObject({
            name: "",
            images: [],
            details: "",
            quickOverview: [],
            generalPrice: { currentPrice: 0, prevPrice: 0, discountPercentage: 0 },
            hasOffer: false,
        });
        expect(result?.offerPercentage).toBeUndefined();
    });

    it("treats a non-array images field as empty", async () => {
        findById.mockReturnValue({
            lean: async () => ({ _id: "p1", name: "W", images: "a.png" }),
        });

        const result = await getLandingProduct("p1");
        expect(result?.images).toEqual([]);
    });

    it("accepts a plain string _id", async () => {
        findById.mockReturnValue({ lean: async () => ({ _id: "plain", name: "W" }) });

        const result = await getLandingProduct("plain");
        expect(result?.slug).toBe("plain");
    });

    it("falls back to an empty string when the document has no _id", async () => {
        findById.mockReturnValue({ lean: async () => ({ name: "W" }) });

        const result = await getLandingProduct("p1");
        expect(result?.slug).toBe("");
    });
});

describe("app/step/_lib/landing-data › listAllProductIds", () => {
    it("maps documents to string ids and drops blanks", async () => {
        find.mockReturnValue({
            lean: async () => [
                { _id: { toString: () => "a" } },
                { _id: "b" },
                { _id: { toString: () => "" } },
                {},
            ],
        });

        await expect(listAllProductIds()).resolves.toEqual(["a", "b"]);
    });

    it("returns an empty array when there are no products", async () => {
        find.mockReturnValue({ lean: async () => [] });
        await expect(listAllProductIds()).resolves.toEqual([]);
    });

    it("requests only the _id field", async () => {
        find.mockReturnValue({ lean: async () => [] });
        await listAllProductIds();
        expect(find).toHaveBeenCalledWith({}, { _id: 1 });
    });
});

describe("app/step/_lib/landing-data › buildLandingConfig", () => {
    it("hydrates a stored sections array directly", () => {
        const sections = [
            { id: "s1", type: "hero", order: 0, data: {} },
        ] as never;

        const config = buildLandingConfig(
            product({
                landingPage: {
                    theme: "fashion",
                    primaryColor: "#111",
                    accentColor: "#222",
                    sections,
                    updatedAt: "2026-01-01T00:00:00.000Z",
                } as never,
            }),
        );

        expect(config).toMatchObject({
            productId: "p1",
            slug: "p1",
            enabled: true,
            theme: { presetId: "fashion", primaryColor: "#111", accentColor: "#222" },
            updatedAt: "2026-01-01T00:00:00.000Z",
        });
        expect(config.sections).toBe(sections);
    });

    it("falls back to the health preset for an unknown stored theme", () => {
        const config = buildLandingConfig(
            product({
                landingPage: {
                    theme: "not-a-theme",
                    sections: [{ id: "s1", type: "hero", order: 0, data: {} }],
                } as never,
            }),
        );

        expect(config.theme.presetId).toBe("health");
    });

    it("uses configFromLegacy when there are no stored sections", () => {
        const config = buildLandingConfig(
            product({
                landingPage: { theme: "fashion", heroSubtitle: "Sub" } as never,
            }),
        );

        // Hero is always first in the legacy projection.
        expect(config.sections[0].type).toBe("hero");
        expect(config.theme.presetId).toBe("fashion");
    });

    it("uses configFromLegacy when landingPage is missing", () => {
        const config = buildLandingConfig(product());
        expect(config.sections[0].type).toBe("hero");
        expect(config.enabled).toBe(true);
    });

    it("uses configFromLegacy for an empty stored sections array", () => {
        const config = buildLandingConfig(
            product({ landingPage: { theme: "health", sections: [] } as never }),
        );
        expect(config.sections.length).toBeGreaterThan(0);
    });

    it("falls back to the product id when the slug is empty", () => {
        const config = buildLandingConfig(product({ slug: "" }));
        expect(config.slug).toBe("p1");
    });
});

describe("app/step/_lib/landing-data › buildDefaultLanding", () => {
    it("returns the health theme with empty optional fields", () => {
        const landing = buildDefaultLanding();

        expect(landing).toEqual({
            theme: "health",
            heroSubtitle: "",
            heroBadge: "",
            heroCtaLabel: "অর্ডার করুন",
            painPoints: [],
            benefits: [],
            howToUse: [],
            guarantee: "",
            trustBadges: [],
            vslUrl: "",
            youtubeUrl: "",
            socialProofStats: [],
            checkoutNote: "",
        });
    });

    it("returns a fresh object on every call", () => {
        expect(buildDefaultLanding()).not.toBe(buildDefaultLanding());
    });
});
