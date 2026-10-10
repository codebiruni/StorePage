import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright end-to-end configuration.
 *
 * These specs drive the real storefront and dashboard in a browser. They are
 * intentionally separate from the Vitest suite (which is excluded from
 * `e2e/**` via `vitest.config.ts`) so the two runners never collide.
 *
 * Base URL:
 *   - `PLAYWRIGHT_BASE_URL` lets CI point at a deployed/preview environment.
 *   - Defaults to the local dev server on http://localhost:3000.
 *
 * Run:
 *   npm run test:e2e              # headless
 *   npm run test:e2e:headed       # watch it drive the browser
 *   npm run test:e2e -- --ui      # interactive UI mode
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
    testDir: "./e2e",
    /* Fail the whole run if a `test.only` slips into a spec. */
    forbidOnly: !!process.env.CI,
    /* Retry once on CI to absorb third-party flake (Cloudinary, fonts, etc.). */
    retries: process.env.CI ? 1 : 0,
    /* Specs share a single live database; run them one at a time. */
    workers: 1,
    fullyParallel: false,
    reporter: process.env.CI
        ? [["github"], ["html", { open: "never" }]]
        : [["list"], ["html", { open: "never" }]],
    /* Global assertion timeout — product pages fetch remote images. */
    expect: { timeout: 10_000 },
    timeout: 60_000,
    use: {
        baseURL,
        /* Capture a trace on the first retry so failures are debuggable. */
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "on-first-retry",
        /* The app is served over http in dev; keep it simple. */
        ignoreHTTPSErrors: true,
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
        /* Mobile storefront smoke — the shopping flow must work on phones. */
        {
            name: "mobile-chrome",
            use: { ...devices["Pixel 7"] },
            testMatch: /.*\.mobile\.spec\.ts/,
        },
    ],
    /**
     * Reuse the already-running dev server if one is up; otherwise boot one.
     * The app requires a MongoDB connection, so this only works where
     * `.env.local` (or equivalent) is configured.
     */
    webServer: {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "ignore",
        stderr: "pipe",
    },
});
