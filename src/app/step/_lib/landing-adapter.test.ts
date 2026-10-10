import { describe, expect, it } from "vitest";
import { flatToConfig, configToFlat, type FlatLandingPage } from "@/app/step/_lib/landing-adapter";
import { makeSection, type LandingConfig } from "@/app/step/_lib/landing-config";

function configWithSections(): LandingConfig {
    return {
        productId: "p1",
        slug: "slug-1",
        enabled: true,
        theme: { presetId: "fashion", primaryColor: "#abc123", accentColor: "#def456" },
        sections: [makeSection("hero", 0), makeSection("faq", 1)],
        updatedAt: "2024-01-01T00:00:00.000Z",
    };
}

describe("landing-adapter › flatToConfig (stored sections branch)", () => {
    it("uses the stored sections verbatim when the array is non-empty", () => {
        const sections = [makeSection("hero", 0)];
        const flat: FlatLandingPage = { theme: "health", sections };
        const config = flatToConfig("p1", "s", flat);
        expect(config.sections).toBe(sections);
    });

    it("reads the theme preset from the flat payload", () => {
        const flat: FlatLandingPage = { theme: "food", sections: [makeSection("hero", 0)] };
        expect(flatToConfig("p1", "s", flat).theme.presetId).toBe("food");
    });

    it("normalizes an unknown theme to health", () => {
        const flat: FlatLandingPage = { theme: "wat", sections: [makeSection("hero", 0)] };
        expect(flatToConfig("p1", "s", flat).theme.presetId).toBe("health");
    });

    it("carries primaryColor / accentColor / updatedAt from the flat payload", () => {
        const flat: FlatLandingPage = {
            theme: "health",
            sections: [makeSection("hero", 0)],
            primaryColor: "#111111",
            accentColor: "#222222",
            updatedAt: "2020-05-05T00:00:00.000Z",
        };
        const config = flatToConfig("p1", "s", flat);
        expect(config.theme.primaryColor).toBe("#111111");
        expect(config.theme.accentColor).toBe("#222222");
        expect(config.updatedAt).toBe("2020-05-05T00:00:00.000Z");
    });

    it("marks the resulting config enabled", () => {
        const flat: FlatLandingPage = { theme: "health", sections: [makeSection("hero", 0)] };
        expect(flatToConfig("p1", "s", flat).enabled).toBe(true);
    });
});

describe("landing-adapter › flatToConfig (legacy branch)", () => {
    it("falls back to configFromLegacy when sections is empty", () => {
        const config = flatToConfig("p1", "s", { theme: "health", sections: [] });
        expect(config.sections).toHaveLength(1);
        expect(config.sections[0].type).toBe("hero");
    });

    it("falls back to configFromLegacy when sections is not an array", () => {
        const config = flatToConfig("p1", "s", {
            theme: "health",
            sections: "nope",
        } as unknown as FlatLandingPage);
        expect(config.sections[0].type).toBe("hero");
    });

    it("handles an undefined flat payload", () => {
        const config = flatToConfig("p1", "s", undefined);
        expect(config.productId).toBe("p1");
        expect(config.slug).toBe("s");
        expect(config.sections[0].type).toBe("hero");
    });
});

describe("landing-adapter › configToFlat", () => {
    it("layers the typed sections onto the flat shape", () => {
        const config = configWithSections();
        const flat = configToFlat(config, undefined);
        expect(flat.sections).toBe(config.sections);
    });

    it("stamps a fresh ISO updatedAt", () => {
        const flat = configToFlat(configWithSections(), undefined);
        expect(flat.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(Number.isNaN(new Date(flat.updatedAt as string).getTime())).toBe(false);
    });

    it("preserves previously-stored flat fields", () => {
        const flat = configToFlat(configWithSections(), {
            theme: "health",
            heroTitle: "Legacy headline",
        });
        expect(flat.heroTitle).toBe("Legacy headline");
    });

    it("writes the theme preset from the typed config", () => {
        const flat = configToFlat(configWithSections(), { theme: "health" });
        expect(flat.theme).toBe("fashion");
    });

    it("writes color overrides when present", () => {
        const flat = configToFlat(configWithSections(), undefined);
        expect(flat.primaryColor).toBe("#abc123");
        expect(flat.accentColor).toBe("#def456");
    });

    it("omits color overrides when the theme has none", () => {
        const config: LandingConfig = {
            productId: "p1",
            slug: "s",
            enabled: true,
            theme: { presetId: "health" },
            sections: [],
        };
        const flat = configToFlat(config, { theme: "health", primaryColor: "#stale" });
        // The stale flat value survives the spread but is never written by us.
        expect(flat.primaryColor).toBe("#stale");
    });

    it("round-trips a config through flat and back", () => {
        const original = configWithSections();
        const roundTripped = flatToConfig("p1", "slug-1", configToFlat(original, undefined));
        expect(roundTripped.theme.presetId).toBe(original.theme.presetId);
        expect(roundTripped.theme.primaryColor).toBe(original.theme.primaryColor);
        expect(roundTripped.sections).toEqual(original.sections);
    });
});
