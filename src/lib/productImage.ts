/**
 * Fallback image used whenever a product has no usable image.
 * Points at an existing `public/` asset (`logo.png`) so `next/image` can
 * resolve it locally without a remote pattern — several call sites in this
 * codebase already reference `/placeholder-product.jpg`, which 404s.
 */
export const FALLBACK_PRODUCT_IMAGE = "/logo.png";

/**
 * True only when `src` is a non-empty string that will not blow up
 * `next/image`.
 *
 * Why this is stricter than a `||` fallback: `next/image` runs the value
 * through `new URL()`. A non-URL placeholder such as `"x"` (present in legacy
 * `cartProducts` rows in localStorage) is *truthy*, so `src={img || fallback}`
 * happily passes it through and crashes the whole tree with
 * `TypeError: Failed to construct 'URL': Invalid URL`. Requiring an absolute
 * http(s) URL, a root-relative path, or a data URI catches those junk values.
 */
export function isValidImageSrc(src: unknown): src is string {
    if (typeof src !== "string") return false;
    const value = src.trim();
    if (value === "") return false;
    // Protocol-relative URLs (`//cdn.example.com/a.jpg`) are not handled by
    // next/image, so they are intentionally rejected.
    if (value.startsWith("//")) return false;
    if (value.startsWith("/")) return true;
    if (value.startsWith("data:image/")) return true;
    return /^https?:\/\//i.test(value);
}

/**
 * Pick the first usable image from any of the shapes this codebase uses:
 * - `IProduct.images: string[]` (canonical DB shape)
 * - `{ image: string; image2?: string }` (cart / wishlist / compare snapshot)
 *
 * Always returns a valid src, falling back to `FALLBACK_PRODUCT_IMAGE`.
 */
export function resolveProductImage(
    source: unknown,
    fallback: string = FALLBACK_PRODUCT_IMAGE
): string {
    if (!source) return fallback;

    let resolved = fallback;

    // Array form: images: string[]
    if (Array.isArray(source)) {
        for (const candidate of source) {
            if (isValidImageSrc(candidate)) {
                resolved = candidate;
                break;
            }
        }
    } else if (typeof source === "object") {
        const record = source as Record<string, unknown>;

        // Newest-first: the schema stores images[] but older docs may carry a
        // singular `image` (and cart snapshots use `image` + `image2`).
        for (const key of ["image", "image2"]) {
            if (isValidImageSrc(record[key])) {
                resolved = record[key] as string;
                break;
            }
        }
        if (resolved === fallback && Array.isArray(record.images)) {
            return resolveProductImage(record.images, fallback);
        }
    }

    if (resolved.startsWith("http://")) {
        return resolved.replace(/^http:\/\//i, "https://");
    }

    return resolved;
}

