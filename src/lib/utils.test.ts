import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("lib/utils › cn", () => {
    it("merges class names", () => {
        expect(cn("a", "b")).toBe("a b");
    });

    it("drops falsy values", () => {
        expect(cn("a", false, undefined, null, "", "b")).toBe("a b");
    });

    it("resolves conflicting tailwind classes, last one wins", () => {
        expect(cn("p-2", "p-4")).toBe("p-4");
        expect(cn("text-sm", "text-lg")).toBe("text-lg");
    });

    it("supports conditional object syntax", () => {
        expect(cn("base", { active: true, disabled: false })).toBe("base active");
    });

    it("supports array syntax", () => {
        expect(cn(["a", "b"], "c")).toBe("a b c");
    });

    it("returns an empty string when given nothing", () => {
        expect(cn()).toBe("");
    });
});
