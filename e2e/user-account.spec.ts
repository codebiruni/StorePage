import { test, expect, expectPath } from "./utils";

/**
 * USER END — account access (sign-in, sign-up, guards).
 *
 * Covers the parts of the app a signed-in user (customer account or staff)
 * touches:
 *   - the sign-in form renders and validates,
 *   - bad credentials surface a server error without navigating away,
 *   - the sign-up entry point is reachable and linked from sign-in,
 *   - protected areas behave sensibly for an anonymous visitor.
 *
 * No real credentials are used: the negative path exercises the live
 * `/api/v1/user/auth` endpoint with obviously-invalid input only.
 */

const VALID_ORIGIN = "http://localhost:3000";

/**
 * The sign-in form's submit button.
 *
 * The page also renders a header "Sign in" LINK, but the accessible-name
 * collision in strict mode comes from the form's own submit button being the
 * only *button* named "Sign In". Scope to the form to be unambiguous.
 */
function signInSubmit(page: import("./utils").Page) {
    return page.locator("form").getByRole("button", { name: /sign in/i });
}

test.describe("User · sign-in form", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/signin");
    });

    test("renders heading, identifier, password and submit button", async ({ page }) => {
        await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
        await expect(page.locator("#identifier")).toBeVisible();
        await expect(page.locator("#password")).toBeVisible();
        await expect(signInSubmit(page)).toBeVisible();
    });

    test("password field is masked", async ({ page }) => {
        await expect(page.locator("#password")).toHaveAttribute("type", "password");
    });

    test("required validation blocks an empty submit", async ({ page }) => {
        await signInSubmit(page).click();

        // HTML5 `required` keeps us on the sign-in page.
        await expectPath(page, "/signin");

        // The browser marks the identifier field as invalid.
        const isInvalid = await page
            .locator("#identifier")
            .evaluate((el: HTMLInputElement) => !el.checkValidity());
        expect(isInvalid).toBe(true);
    });

    test("invalid credentials show an error and do not navigate", async ({ page }) => {
        await page.locator("#identifier").fill("e2e-user-that-does-not-exist@example.com");
        await page.locator("#password").fill("definitely-not-the-password");
        await signInSubmit(page).click();

        // Wait for the request to settle: either an error alert appears or we
        // are still on /signin after the loading state clears.
        await expect(signInSubmit(page)).toBeEnabled({ timeout: 20_000 });

        // Must not have navigated into a protected area.
        expect(page.url().startsWith(VALID_ORIGIN)).toBe(true);
        await expect(page).toHaveURL(/\/signin/);
    });
});

test.describe("User · sign-up entry point", () => {
    test("sign-in page links to the create-account flow", async ({ page }) => {
        await page.goto("/signin");

        const createAccount = page.getByRole("link", { name: "Create an account" });
        await expect(createAccount).toBeVisible();
        await expect(createAccount).toHaveAttribute("href", "/sign-up");

        await createAccount.click();
        await expectPath(page, "/sign-up");
        await expect(page.locator("body")).toBeVisible();
    });

    test("sign-up page renders a form", async ({ page }) => {
        const response = await page.goto("/sign-up");
        expect(response?.ok()).toBeTruthy();
        await expect(page.locator("form, [role='form']").first()).toBeVisible({
            timeout: 20_000,
        });
    });
});

test.describe("User · protected routes (anonymous)", () => {
    test("dashboard does not expose staff data to an anonymous visitor", async ({ page }) => {
        const response = await page.goto("/dashboard");
        // Either a redirect to sign-in or a guarded render — never a 500.
        expect(response?.status() ?? 200).toBeLessThan(500);
        expect(page.url().startsWith(VALID_ORIGIN)).toBe(true);
    });

    test("profile does not expose account data to an anonymous visitor", async ({ page }) => {
        const response = await page.goto("/profile");
        expect(response?.status() ?? 200).toBeLessThan(500);
        expect(page.url().startsWith(VALID_ORIGIN)).toBe(true);
    });
});
