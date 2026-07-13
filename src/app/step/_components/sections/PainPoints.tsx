// PainPoints section: bullet list of problems the buyer is currently facing.
// Accepts both { items, variant? } (legacy) and { product, variant? }
// (modern themes) — items derive from product.landingPage.painPoints.
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";

export default function PainPoints({
  product,
  items,
  variant,
}: {
  product?: SerializedLandingProduct;
  items?: string[];
  variant?: string;
}) {
  const list = (items ?? product?.landingPage?.painPoints ?? []).filter(Boolean);
  if (list.length === 0) return null;
  const dark = variant === "bold";
  return (
    <section
      className="step-section step-section--alt"
      data-variant={variant}
      style={dark ? { background: "#0f172a", color: "#e2e8f0" } : undefined}
    >
      <div className="step-container">
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 16px" }}>
          আপনি কি এই সমস্যাগুলোতে ভুগছেন?
        </h2>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          {list.map((p, i) => (
            <li key={i} style={{ fontSize: 16 }}>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}