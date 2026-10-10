import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Global test setup.
 *
 * Environment variables are seeded here so modules that read `process.env`
 * at import time (env.ts, connectdb.ts, r2.ts, …) don't throw during the
 * test run. Tests that assert on env behavior override these locally.
 */
// `NODE_ENV` is typed as read-only by @types/node, so the assignment is cast.
const envBag = process.env as Record<string, string | undefined>;
envBag.NODE_ENV = envBag.NODE_ENV ?? "test";
process.env.MONGODB_URI =
    process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/storepage_test";
process.env.JWT_ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET ?? "test-access-secret";
process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret";

// Unmount React trees between tests.
afterEach(() => {
    cleanup();
});

// jsdom lacks matchMedia — several UI-adjacent modules touch it.
if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
}

// jsdom lacks IntersectionObserver / ResizeObserver used by carousels.
class NoopObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
    takeRecords() {
        return [];
    }
}
const globalBag = globalThis as unknown as Record<string, unknown>;
if (!globalBag.IntersectionObserver) {
    globalBag.IntersectionObserver = NoopObserver;
}
if (!globalBag.ResizeObserver) {
    globalBag.ResizeObserver = NoopObserver;
}
