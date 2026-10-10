import { test, expect, waitForStorefrontReady, expectPath } from "./utils";

/**
 * CUSTOMER END — full purchase flows (real orders against the live app).
 *
 * These specs place ACTUAL orders through `POST /api/v1/order`, exercising
 * both entry points:
 *
 *   1. Storefront cart: product detail -> "Buy Now" -> `/buy-product` form.
 *   2. Landing funnel:  `/step/[id]` -> inline checkout form.
 *
 * They assert the user-visible success state and that a real, server-assigned
 * order id reaches `/step/thanks`. Because they mutate the shared DB
 * (orders + product stock), the suite runs serially (workers: 1).
 */

/** A stable, in-stock product the storefront always lists. */
const KNOWN_PRODUCT_ID = "68a1bfceb514c275df179b5d"; // ROG Zephyrus G16
const KNOWN_PRODUCT_NAME = "ROG Zephyrus G16";

// The purchase flows fire best-effort, fire-and-forget side calls after a
// successful order:
//   - POST /api/v1/meta-capi  → 500 locally (META_* env vars unset)
//   - POST /api/order-draft   → lead capture, not part of the assertion
// Stub them so the console guard keeps flagging only UNEXPECTED errors.
test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/meta-capi", (route) =>
        route.fulfill({ status: 200, body: JSON.stringify({ success: true }) }),
    );
    await page.route("**/api/order-draft", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ok: true, draftId: null, isCompleted: false }),
        }),
    );
});

test.describe("Customer · order flow (storefront /buy-product)", () => {
    test("buying from the product page places an order and shows a real order id", async ({
        page,
    }) => {
        // 1. Open a real product's detail page.
        await page.goto(`/product/product-details/${KNOWN_PRODUCT_ID}`);
        await expect(
            page.getByRole("heading", { name: KNOWN_PRODUCT_NAME }).first(),
        ).toBeVisible({ timeout: 25_000 });

        // 2. "Buy Now" seeds the purchase context and routes to checkout.
        await page.getByRole("button", { name: /Buy Now/i }).click();
        await expectPath(page, "/buy-product");

        // 3. The checkout form renders the item in the order summary.
        await expect(
            page.getByText(new RegExp(KNOWN_PRODUCT_NAME, "i")).first(),
        ).toBeVisible({ timeout: 20_000 });

        // 4. Fill the Bangla delivery form.
        await page.getByPlaceholder("আপনার পূর্ণ নাম লিখুন").fill("E2E Storefront Buyer");
        await page.getByPlaceholder("গ্রাম, থানা এবং জেলা").fill("House 7, Gulshan 2");
        await page.getByPlaceholder("01XXXXXXXXX").fill("01711111111");

        // 5. Choose Inside Dhaka (70৳) so the total is deterministic.
        await page.getByRole("radio", { name: /ঢাকার ভিতরে/ }).check();

        // 6. Submit; the button switches to the processing label then routes.
        await page.getByRole("button", { name: /অর্ডার করুন/ }).click();

        await expectPath(page, "/step/thanks");
        await expect(page.getByRole("heading", { name: "অর্ডার সফল!" })).toBeVisible({
            timeout: 25_000,
        });

        // 7. The thanks URL must carry the SERVER-assigned order id — the
        //    regression this spec guards against was a client `ORD-<ts>`
        //    fallback that never matched the real record.
        const orderId = new URL(page.url()).searchParams.get("orderId") ?? "";
        expect(orderId).toMatch(/^ORD-\d{8}-\d+$/);
        await expect(page.getByText(orderId, { exact: true })).toBeVisible();
    });
});

test.describe("Customer · order flow (landing /step/[id])", () => {
    test("landing checkout form places an order and shows a real order id", async ({
        page,
    }) => {
        // 1. Every product exposes a landing page at /step/<productId>.
        const response = await page.goto(`/step/${KNOWN_PRODUCT_ID}`);
        expect(response?.status()).toBeLessThan(500);

        // 2. The inline checkout form (name / mobile / address) is present.
        const nameInput = page.getByPlaceholder("আপনার নাম");
        await expect(nameInput).toBeVisible({ timeout: 25_000 });

        await nameInput.fill("E2E Landing Buyer");
        await page.getByPlaceholder("মোবাইল নাম্বার").fill("01811111111");
        await page.getByPlaceholder("ডেলিভারি ঠিকানা").fill("Flat 9A, Uttara, Dhaka");

        // 3. Submit the order.
        await page.locator('form button[type="submit"]').first().click();

        // 4. Success screen + real server order id on the URL.
        await expectPath(page, "/step/thanks");
        await expect(page.getByRole("heading", { name: "অর্ডার সফল!" })).toBeVisible({
            timeout: 25_000,
        });

        const orderId = new URL(page.url()).searchParams.get("orderId") ?? "";
        expect(orderId).toMatch(/^ORD-\d{8}-\d+$/);
        await expect(page.getByText(orderId, { exact: true })).toBeVisible();
    });

    test("landing page reachable for a fresh visitor from the storefront", async ({
        page,
    }) => {
        await page.goto("/");
        await waitForStorefrontReady(page);

        const response = await page.goto(`/step/${KNOWN_PRODUCT_ID}`);
        expect(response?.status()).toBeLessThan(500);
        await expect(page.getByPlaceholder("আপনার নাম")).toBeVisible({
            timeout: 25_000,
        });
    });
});
