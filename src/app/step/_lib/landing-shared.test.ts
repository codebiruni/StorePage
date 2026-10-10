import { describe, expect, it } from "vitest";
import { resolveLandingTheme } from "@/app/step/_lib/landing-shared";

describe("landing-shared › resolveLandingTheme", () => {
    it("returns health for the health theme", () => {
        expect(resolveLandingTheme("health")).toBe("health");
    });

    it("normalizes legacy theme names to health", () => {
        for (const legacy of ["default", "organic", "fashion", "food", "blue", "dark"]) {
            expect(resolveLandingTheme(legacy)).toBe("health");
        }
    });

    it("normalizes non-string values to health", () => {
        for (const value of [undefined, null, 0, 42, true, {}, [], Symbol("x")]) {
            expect(resolveLandingTheme(value)).toBe("health");
        }
    });

    it("never returns anything other than health", () => {
        const inputs = ["health", "x", "", " Health", "HEALTH"];
        for (const input of inputs) expect(resolveLandingTheme(input)).toBe("health");
    });
});
