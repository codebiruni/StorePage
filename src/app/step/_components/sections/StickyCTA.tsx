// StickyCTA: bottom-pinned "Order Now" button. Anchors to the order form.
// Accepts both the legacy { label, productId, variant? } API (Classic/Trust/etc.)
// and the new { product, slug?, label? } shortcut used by the modern themes.
// `slug` is used as the anchor id (matches the `#order-${slug}` links).
import Link from "next/link";
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";

export default function StickyCTA({
  product,
  slug,
  label,
  productId,
  variant,
}: {
  product?: SerializedLandingProduct;
  slug?: string;
  label?: string;
  productId?: string;
  variant?: string;
}) {
  const dark = variant === "bold";
  const anchor =
    productId ?? (slug || product?._id) ?? "";
  return (
    <div
      className="step-sticky-cta"
      data-variant={variant}
      style={dark ? { background: "rgba(15,23,42,0.95)", borderTopColor: "#334155" } : undefined}
    >
      <div className="step-sticky-cta__inner">
        <span style={{ fontSize: 13, color: dark ? "#94a3b8" : "#475569" }}>
          আজই অর্ডার করুন
        </span>
        <Link
          href={`#order-${anchor}`}
          style={{
            background: "#16a34a",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          {label ?? "অর্ডার করুন"}
        </Link>
      </div>
    </div>
  );
}