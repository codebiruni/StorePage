// Benefits section: what changes after the buyer purchases.
// Accepts both { items, variant? } and { product, variant? }.
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";

export default function Benefits({
  product,
  items,
  variant,
}: {
  product?: SerializedLandingProduct;
  items?: string[];
  variant?: string;
}) {
  const list = (items ?? product?.landingPage?.benefits ?? []).filter(Boolean);
  if (list.length === 0) return null;
  const dark = variant === "bold";
  return (
    <section className="step-section" data-variant={variant}>
      <div className="step-container">
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            margin: "0 0 16px",
            color: dark ? "#f8fafc" : undefined,
          }}
        >
          কেন এটি কাজ করে
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {list.map((b, i) => (
            <div
              key={i}
              style={{
                background: dark ? "#1e293b" : "#f8fafc",
                color: dark ? "#f8fafc" : undefined,
                padding: 16,
                borderRadius: 12,
                border: dark ? "1px solid #334155" : "1px solid #e2e8f0",
              }}
            >
              {b}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}