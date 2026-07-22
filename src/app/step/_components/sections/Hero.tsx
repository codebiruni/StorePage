// Hero section: product photo + price + CTA.
// Accepts { product, landing?, variant? }. When `landing` is omitted it's
// derived from `product.landingPage`. The `variant` is forwarded as a data
// attr and selects dark/light styling for legacy themes; HealthPage no
// longer routes through this component.
import Link from "next/link";
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";
import type { ILandingPage } from "@/app/step/_lib/landing-shared";

export default function Hero({
  product,
  landing,
  variant,
}: {
  product: SerializedLandingProduct;
  landing?: ILandingPage;
  variant?: string;
}) {
  const lp = landing ?? product.landingPage;
  const safeLp: ILandingPage = lp ?? { theme: "health" };
  const main = product.images?.[0];
  const { currentPrice, prevPrice, discountPercentage } = product.generalPrice;
  const dark = variant === "kinetic" || variant === "midnight";
  return (
    <section
      className="step-section"
      data-variant={variant}
      style={dark ? { background: "#0f172a", color: "#f8fafc" } : undefined}
    >
      <div
        className="step-container"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 24,
          alignItems: "center",
        }}
      >
        {safeLp.heroBadge ? (
          <span
            style={{
              display: "inline-block",
              background: dark ? "#1e293b" : "var(--lp-accent-soft, #fef3c7)",
              color: dark ? "#fde68a" : "var(--lp-accent, #dc2626)",
              fontWeight: 600,
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 999,
              width: "fit-content",
            }}
          >
            {safeLp.heroBadge}
          </span>
        ) : null}
        <h1
          style={{
            fontSize: 36,
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.15,
            color: "var(--lp-fg, #0f172a)",
          }}
        >
          {safeLp.heroTitle ?? product.name}
        </h1>
        {safeLp.heroSubtitle ? (
          <p style={{ fontSize: 18, color: dark ? "#cbd5e1" : "#475569", margin: 0 }}>
            {safeLp.heroSubtitle}
          </p>
        ) : null}

        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: dark ? "#f8fafc" : "#0f172a" }}>
            ৳{currentPrice}
          </span>
          {prevPrice > currentPrice ? (
            <>
              <span
                style={{
                  fontSize: 16,
                  color: "#94a3b8",
                  textDecoration: "line-through",
                }}
              >
                ৳{prevPrice}
              </span>
              {discountPercentage > 0 ? (
                <span
                  style={{
                    background: dark ? "#064e3b" : "#dcfce7",
                    color: dark ? "#a7f3d0" : "#166534",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  -{discountPercentage}%
                </span>
              ) : null}
            </>
          ) : null}
        </div>

        <Link
          href={`#order-${product._id}`}
          className="step-pulse"
          style={{
            display: "inline-block",
            background: "var(--lp-accent, #dc2626)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "var(--lp-radius, 10px)",
            fontWeight: 700,
            textDecoration: "none",
            width: "fit-content",
          }}
        >
          {safeLp.heroCtaLabel ?? "অর্ডার করুন"}
        </Link>

        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={main}
            alt={product.name}
            style={{
              width: "100%",
              maxHeight: 480,
              objectFit: "cover",
              borderRadius: 16,
              background: dark ? "#1e293b" : "#f1f5f9",
            }}
          />
        ) : null}
      </div>
    </section>
  );
}