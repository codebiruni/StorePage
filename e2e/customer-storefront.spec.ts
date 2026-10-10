import { test, expect, siteHeader, waitForStorefrontReady, expectPath } from "./utils";

/**
 * CUSTOMER END — storefront browsing.
 *
 * A shopper who has not signed in must be able to:
 *   1. load the home page with its merchandising sections,
 *   2. reach the product listing and a product detail page,
 *   3. find the account entry point in the header,
 *   4. hit a real 404 page for an unknown URL.
 *
 * These specs are read-only: they never mutate data, so they are safe to run
 * against any deployment.
 */

test.describe("Customer · storefront home", () => {
    test("home page loads with header, categories and featured products", async ({ page }) => {
        await page.goto("/");
        await waitForStorefrontReady(page);

        // Site header with brand, search and account entry points.
        await expect(siteHeader(page)).toBeVisible();
        await expect(
            page.getByPlaceholder("Search products, categories, sub-categories...").first(),
        ).toBeVisible();
        // Anonymous visitors get the "Sign in" link in place of the account menu.
        await expect(page.getByRole("link", { name: "Sign in", exact: true }).first()).toBeVisible();

        // Merchandising sections.
        await expect(page.getByRole("heading", { name: "Explore Categories" })).toBeVisible();
        await expect(page.getByText("Featured Products").first()).toBeVisible();

        // At least one category tile rendered (data-driven; exact set can change).
        const categoryIcons = page.locator('img[alt]').filter({ hasNotText: /banner/i });
        expect(await categoryIcons.count()).toBeGreaterThan(0);
    });

    test("home page exposes a document title and lang attribute", async ({ page }) => {
        await page.goto("/");
        await waitForStorefrontReady(page);

        await expect(page).toHaveTitle(/store page/i);
        const lang = await page.locator("html").getAttribute("lang");
        expect(lang).toBeTruthy();
    });

    test("unknown route renders the app's not-found page", async ({ page }) => {
        const response = await page.goto("/this-route-does-not-exist-e2e");
        // Next.js serves the custom not-found page with a 404 status.
        expect(response?.status()).toBe(404);
        await expect(page.locator("body")).toBeVisible();
    });
});

test.describe("Customer · category & product listing", () => {
    test("products listing route renders a product grid", async ({ page }) => {
        await page.goto("/products");
        await expect(page.locator("body")).toBeVisible();

        // The listing must render at least one product card image or link.
        const productLinks = page.locator('a[href*="/product"]');
        await expect
            .poll(async () => productLinks.count(), { timeout: 20_000 })
            .toBeGreaterThan(0);
    });

    test("featured products route renders content", async ({ page }) => {
        await page.goto("/featured-products");
        await expect(page.locator("body")).toBeVisible();
        await expect(page.locator("main, body")).toBeVisible();
    });

    test("clicking a product opens its detail page", async ({ page }) => {
        await page.goto("/products");
        const firstProduct = page.locator('a[href*="/product"]').first();
        await firstProduct.waitFor({ state: "visible", timeout: 20_000 });

        const href = await firstProduct.getAttribute("href");
        expect(href).toBeTruthy();

        await firstProduct.click();
        await expectPath(page, href!.split("?")[0]);

        // Detail page should render the product name and a buy/cart affordance.
        await expect(page.locator("body")).toBeVisible();
    });
});

test.describe("Customer · informational pages", () => {
    const staticPages = [
        { path: "/about-us", label: "About us" },
        { path: "/contact-us", label: "Contact us" },
        { path: "/privacy-policy", label: "Privacy policy" },
        { path: "/return-policy", label: "Return policy" },
        { path: "/delivery-information", label: "Delivery information" },
    ];

    for (const { path, label } of staticPages) {
        test(`${label} page renders with a heading`, async ({ page }) => {
            const response = await page.goto(path);
            expect(response?.ok(), `expected 200 for ${path}`).toBeTruthy();
            await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
        });
    }
});

test.describe("Customer · header account entry point", () => {
    test("anonymous shoppers get a Sign in link to /signin", async ({ page }) => {
        await page.goto("/");
        await waitForStorefrontReady(page);

        // Per NavTopSection, the "Account" link only renders when UserData is
        // set; anonymous visitors see a "Sign in" link instead.
        const signIn = page.getByRole("link", { name: "Sign in", exact: true }).first();
        await expect(signIn).toBeVisible();
        await expect(signIn).toHaveAttribute("href", "/signin");
    });
});
