// Pricing section: shows the discounted price with original crossed out.
// Accepts both { product, landing, variant? } and { product, variant? } —
// landing is derived from product.landingPage when not supplied.
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";
import type { ILandingPage } from "@/app/step/_lib/landing-shared";

export default function Pricing({
  product,
  landing,
  variant,
}: {
  product: SerializedLandingProduct;
  landing?: ILandingPage;
  variant?: string;
}) {
  const { currentPrice, prevPrice, discountPercentage } = product.generalPrice;
  void landing; // accepted for legacy API compatibility
  const dark = variant === "bold";
  return (
    <section
      className="step-section step-section--alt"
      data-variant={variant}
      style={dark ? { background: "#0f172a", color: "#f8fafc" } : undefined}
    >
      <div
        className="step-container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: dark ? "#f8fafc" : "#0f172a",
            }}
          >
            ৳{currentPrice}
          </div>
          {prevPrice > currentPrice ? (
            <div
              style={{
                fontSize: 16,
                textDecoration: "line-through",
                color: "#94a3b8",
              }}
            >
              ৳{prevPrice}
            </div>
          ) : null}
        </div>
        {discountPercentage > 0 ? (
          <div
              style={{
                background: "var(--lp-accent, #dc2626)",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
            {discountPercentage}% ছাড়
          </div>
        ) : null}
      </div>
    </section>
  );
}