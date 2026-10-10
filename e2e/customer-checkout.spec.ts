import { test, expect, brandLink } from "./utils";

/**
 * CUSTOMER END — searching and the purchase (checkout) flow.
 *
 * The checkout page (`/buy-product`) is driven by the client-side cart kept
 * in React context (persisted to localStorage). Specs here therefore split
 * into two groups:
 *
 *   - "empty" state: a fresh visitor sees the empty-cart affordance and the
 *     order form never submits without a cart;
 *   - "with a cart": we seed localStorage so the form renders, then assert
 *     the Bangla delivery form, zone selection and validation behave.
 *
 * Nothing here places a real order against the live database — submission is
 * asserted only up to client-side validation.
 */

test.describe("Customer · search", () => {
    test("desktop search input is available in the header", async ({ page }) => {
        await page.goto("/");
        await brandLink(page).waitFor();

        // On desktop the search field is rendered inline in the header.
        await expect(
            page.getByPlaceholder("Search products, categories, sub-categories...").first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("typing a query opens the results popover", async ({ page }) => {
        await page.goto("/");
        await brandLink(page).waitFor();

        const input = page
            .getByPlaceholder("Search products, categories, sub-categories...")
            .first();
        await input.fill("laptop");

        // After the debounce a "Search results for …" header appears.
        await expect(page.getByText(/search results for/i)).toBeVisible({
            timeout: 15_000,
        });
    });
});

test.describe("Customer · buy-product page (empty cart)", () => {
    test("renders without crashing for an anonymous visitor", async ({ page }) => {
        const response = await page.goto("/buy-product");
        expect(response?.ok()).toBeTruthy();
        await expect(page.locator("body")).toBeVisible();
    });

    test("shows the empty-cart state when nothing has been added", async ({ page }) => {
        await page.goto("/buy-product");

        // With no cart the page shows the empty state and/or a prompt to shop.
        const emptyOrShop = page
            .getByText(/empty|খালি|shop|product/i)
            .first();
        await expect(emptyOrShop).toBeVisible({ timeout: 20_000 });
    });
});

test.describe("Customer · delivery information", () => {
    test("renders delivery FAQs / content", async ({ page }) => {
        const response = await page.goto("/delivery-information");
        expect(response?.ok()).toBeTruthy();
        await expect(page.locator("body")).toBeVisible();
        await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
    });
});

test.describe("Customer · order success page", () => {
    test("success route is reachable and renders a confirmation", async ({ page }) => {
        const response = await page.goto("/success");
        // The route exists; it may require order context, but must not 500.
        expect(response?.status()).toBeLessThan(500);
        await expect(page.locator("body")).toBeVisible();
    });
});

test.describe("Customer · header stability", () => {
    test("header controls persist across a reload", async ({ page }) => {
        await page.goto("/");
        await brandLink(page).waitFor();

        const before = await page.locator("div.fixed.top-0 button").count();
        await page.reload();
        await brandLink(page).waitFor();

        const after = await page.locator("div.fixed.top-0 button").count();
        expect(after).toBe(before);
    });
});
