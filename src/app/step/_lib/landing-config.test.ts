import { describe, expect, it } from "vitest";
import {
    THEME_PRESETS,
    configFromLegacy,
    defaultSectionData,
    defaultTheme,
    legacyFromConfig,
    makeSection,
    newSectionId,
    resolveThemeTokens,
    type LandingConfig,
    type SectionType,
} from "@/app/step/_lib/landing-config";
import type { ILandingPage } from "@/app/step/_lib/landing-shared";

const ALL_SECTION_TYPES: SectionType[] = [
    "header",
    "hero",
    "benefits",
    "trustBadge",
    "productShowcase",
    "pricing",
    "comparison",
    "testimonials",
    "faq",
    "countdown",
    "footer",
    "formTitle",
];

describe("landing-config › THEME_PRESETS", () => {
    it("ships a token set for every declared preset", () => {
        for (const id of ["health", "organic", "fashion", "food", "default"] as const) {
            const preset = THEME_PRESETS[id];
            expect(preset.primary).toMatch(/^#/);
            expect(preset.accent).toMatch(/^#/);
            expect(preset.font).toBeTruthy();
        }
    });

    it("uses the documented brand colors for the health preset", () => {
        expect(THEME_PRESETS.health).toEqual({
            primary: "#7a1030",
            accent: "#e11d2e",
            font: "inter",
        });
    });

    it("uses poppins only for the fashion preset", () => {
        expect(THEME_PRESETS.fashion.font).toBe("poppins");
        const others = Object.entries(THEME_PRESETS).filter(([id]) => id !== "fashion");
        for (const [, preset] of others) expect(preset.font).toBe("inter");
    });
});

describe("landing-config › resolveThemeTokens", () => {
    it("returns the preset tokens when no overrides are set", () => {
        expect(resolveThemeTokens({ presetId: "organic" })).toEqual(THEME_PRESETS.organic);
    });

    it("lets per-product primaryColor override the preset", () => {
        const tokens = resolveThemeTokens({ presetId: "health", primaryColor: "#000000" });
        expect(tokens.primary).toBe("#000000");
        expect(tokens.accent).toBe(THEME_PRESETS.health.accent);
    });

    it("lets per-product accentColor override the preset", () => {
        const tokens = resolveThemeTokens({ presetId: "health", accentColor: "#ffffff" });
        expect(tokens.accent).toBe("#ffffff");
        expect(tokens.primary).toBe(THEME_PRESETS.health.primary);
    });

    it("ignores empty-string overrides and falls back to the preset", () => {
        const tokens = resolveThemeTokens({
            presetId: "fashion",
            primaryColor: "",
            accentColor: "",
        });
        expect(tokens).toEqual(THEME_PRESETS.fashion);
    });

    it("falls back to the default preset for an unknown presetId", () => {
        const tokens = resolveThemeTokens({ presetId: "nope" as never });
        expect(tokens).toEqual(THEME_PRESETS.default);
    });

    it("carries the preset font through even when colors are overridden", () => {
        const tokens = resolveThemeTokens({ presetId: "fashion", primaryColor: "#111111" });
        expect(tokens.font).toBe("poppins");
    });
});

describe("landing-config › newSectionId", () => {
    it("produces ids with the expected prefix", () => {
        expect(newSectionId()).toMatch(/^s_[0-9a-z]+_[0-9a-z]{0,6}$/);
    });

    it("produces unique ids across many calls", () => {
        const ids = new Set(Array.from({ length: 500 }, () => newSectionId()));
        expect(ids.size).toBe(500);
    });
});

describe("landing-config › defaultTheme", () => {
    it("defaults to the health preset with no color overrides", () => {
        expect(defaultTheme()).toEqual({ presetId: "health" });
    });
});

describe("landing-config › defaultSectionData", () => {
    it("returns a data object for every section type", () => {
        for (const type of ALL_SECTION_TYPES) {
            expect(defaultSectionData(type)).toBeTypeOf("object");
            expect(defaultSectionData(type)).not.toBeNull();
        }
    });

    it("populates list-backed sections with empty arrays", () => {
        expect(defaultSectionData("benefits")).toEqual({ title: "", items: [] });
        expect(defaultSectionData("faq")).toEqual({ items: [] });
        expect(defaultSectionData("productShowcase")).toEqual({ images: [], caption: "" });
    });

    it("zeroes out pricing defaults", () => {
        const data = defaultSectionData("pricing") as { regularPrice: number; offerPrice: number };
        expect(data.regularPrice).toBe(0);
        expect(data.offerPrice).toBe(0);
    });

    it("seeds the countdown seven days into the future", () => {
        const before = Date.now();
        const data = defaultSectionData("countdown") as { endsAt: string };
        const endsAt = new Date(data.endsAt).getTime();

        expect(Number.isNaN(endsAt)).toBe(false);
        expect(endsAt).toBeGreaterThanOrEqual(before + 7 * 86400_000 - 1000);
        expect(endsAt).toBeLessThanOrEqual(Date.now() + 7 * 86400_000 + 1000);
    });

    it("provides the comparison column headings", () => {
        const data = defaultSectionData("comparison") as { oursTitle: string; theirsTitle: string };
        expect(data.oursTitle).toBe("আমাদের পণ্য");
        expect(data.theirsTitle).toBe("অন্যরা");
    });

    it("gives each section type a distinct shape", () => {
        const shapes = ALL_SECTION_TYPES.map((t) => Object.keys(defaultSectionData(t)).sort().join(","));
        // A few types legitimately share a shape (benefits/testimonials both have
        // {title, items}), so assert on distinctness of the set rather than count.
        expect(new Set(shapes).size).toBeGreaterThan(5);
    });
});

describe("landing-config › makeSection", () => {
    it("stamps the type, order, an id, and the type's default data", () => {
        const section = makeSection("hero", 3);
        expect(section.type).toBe("hero");
        expect(section.order).toBe(3);
        expect(section.id).toMatch(/^s_/);
        expect(section.data).toEqual(defaultSectionData("hero"));
    });

    it("generates a fresh id each time even for identical type/order", () => {
        expect(makeSection("faq", 0).id).not.toBe(makeSection("faq", 0).id);
    });
});

describe("landing-config › configFromLegacy", () => {
    const legacy: ILandingPage = {
        theme: "fashion",
        heroTitle: "Big Sale",
        heroSubtitle: "Today only",
        heroBadge: "NEW",
        heroCtaLabel: "Buy",
        youtubeUrl: "https://youtu.be/abc",
        benefits: ["Cheap", "Fast"],
        comparison: {
            oursTitle: "Us",
            oursItems: ["Good"],
            othersTitle: "Them",
            othersItems: ["Bad"],
        },
        guarantee: "30-day refund",
    };

    it("always emits a hero as the first section", () => {
        const config = configFromLegacy("p1", "slug-1", legacy);
        expect(config.sections[0].type).toBe("hero");
        expect(config.sections[0].order).toBe(0);
    });

    it("emits a hero even when the legacy payload is undefined", () => {
        const config = configFromLegacy("p1", "slug-1", undefined);
        expect(config.sections).toHaveLength(1);
        expect(config.sections[0].type).toBe("hero");
    });

    it("projects flat hero fields onto typed hero data", () => {
        const config = configFromLegacy("p1", "slug-1", legacy);
        expect(config.sections[0].data).toEqual({
            badge: "NEW",
            headline: "Big Sale",
            subheadline: "Today only",
            videoUrl: "https://youtu.be/abc",
            heroImage: "",
            ctaLabel: "Buy",
        });
    });

    it("prefers youtubeUrl over vslUrl for the hero video", () => {
        const config = configFromLegacy("p1", "s", {
            theme: "health",
            youtubeUrl: "yt",
            vslUrl: "vsl",
        } as ILandingPage);
        expect((config.sections[0].data as { videoUrl: string }).videoUrl).toBe("yt");
    });

    it("falls back to vslUrl when youtubeUrl is absent", () => {
        const config = configFromLegacy("p1", "s", {
            theme: "health",
            vslUrl: "vsl",
        } as ILandingPage);
        expect((config.sections[0].data as { videoUrl: string }).videoUrl).toBe("vsl");
    });

    it("applies hero fallback copy when fields are missing", () => {
        const config = configFromLegacy("p1", "s", { theme: "health" } as ILandingPage);
        const data = config.sections[0].data as { badge: string; headline: string };
        expect(data.badge).toBe("Limited Time Offer");
        expect(data.headline).toBe("");
    });

    it("emits a benefits section only when benefits exist", () => {
        const withBenefits = configFromLegacy("p1", "s", { theme: "health", benefits: ["a"] } as ILandingPage);
        expect(withBenefits.sections.some((s) => s.type === "benefits")).toBe(true);

        const without = configFromLegacy("p1", "s", { theme: "health", benefits: [] } as ILandingPage);
        expect(without.sections.some((s) => s.type === "benefits")).toBe(false);
    });

    it("maps benefit strings to { text } objects", () => {
        const config = configFromLegacy("p1", "s", { theme: "health", benefits: ["x", "y"] } as ILandingPage);
        const benefits = config.sections.find((s) => s.type === "benefits");
        expect(benefits?.data).toEqual({ title: "", items: [{ text: "x" }, { text: "y" }] });
    });

    it("emits a comparison section when either side has items", () => {
        const onlyTheirs = configFromLegacy("p1", "s", {
            theme: "health",
            comparison: { othersItems: ["bad"] },
        } as ILandingPage);
        expect(onlyTheirs.sections.some((s) => s.type === "comparison")).toBe(true);
    });

    it("skips the comparison section when both sides are empty", () => {
        const config = configFromLegacy("p1", "s", {
            theme: "health",
            comparison: { oursItems: [], othersItems: [] },
        } as ILandingPage);
        expect(config.sections.some((s) => s.type === "comparison")).toBe(false);
    });

    it("emits a footer placeholder carrying the guarantee copy", () => {
        const config = configFromLegacy("p1", "s", {
            theme: "health",
            guarantee: "Money back",
        } as ILandingPage);
        const footer = config.sections.find((s) => s.type === "footer");
        expect(footer?.data).toEqual({ copyrightText: "Money back", creditText: "" });
    });

    it("preserves the theme preset when it is a known preset", () => {
        expect(configFromLegacy("p1", "s", legacy).theme.presetId).toBe("fashion");
    });

    it("normalizes an unknown theme to health", () => {
        const config = configFromLegacy("p1", "s", { theme: "legacy-blue" } as ILandingPage);
        expect(config.theme.presetId).toBe("health");
    });

    it("normalizes a missing theme to health", () => {
        expect(configFromLegacy("p1", "s", {} as ILandingPage).theme.presetId).toBe("health");
    });

    it("assigns sequential, gapless order values", () => {
        const config = configFromLegacy("p1", "s", legacy);
        expect(config.sections.map((s) => s.order)).toEqual(
            config.sections.map((_, i) => i),
        );
    });

    it("carries productId, slug, and enabled through", () => {
        const config = configFromLegacy("prod-9", "the-slug", legacy);
        expect(config.productId).toBe("prod-9");
        expect(config.slug).toBe("the-slug");
        expect(config.enabled).toBe(true);
        expect(typeof config.updatedAt).toBe("string");
    });
});

describe("landing-config › legacyFromConfig", () => {
    const config: LandingConfig = {
        productId: "p1",
        slug: "s",
        enabled: true,
        theme: { presetId: "organic" },
        sections: [],
    };

    it("spreads the previous flat payload through", () => {
        const result = legacyFromConfig(config, { theme: "health", heroTitle: "Hi" });
        expect(result.heroTitle).toBe("Hi");
    });

    it("overwrites theme with the typed config's preset", () => {
        const result = legacyFromConfig(config, { theme: "health" });
        expect(result.theme).toBe("organic");
    });

    it("returns a theme-only payload when no fallback is given", () => {
        expect(legacyFromConfig(config, undefined)).toEqual({ theme: "organic" });
    });

    it("does not mutate the fallback object", () => {
        const fallback = { theme: "health" };
        legacyFromConfig(config, fallback);
        expect(fallback.theme).toBe("health");
    });
});
