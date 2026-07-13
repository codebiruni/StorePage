// HowToUse section: numbered steps for using the product.
// Accepts both { items, variant? } and { product, variant? }.
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";

export default function HowToUse({
  product,
  items,
  variant,
}: {
  product?: SerializedLandingProduct;
  items?: string[];
  variant?: string;
}) {
  const list = (items ?? product?.landingPage?.howToUse ?? []).filter(Boolean);
  if (list.length === 0) return null;
  const dark = variant === "bold";
  return (
    <section className="step-section step-section--alt" data-variant={variant}>
      <div className="step-container">
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            margin: "0 0 16px",
            color: dark ? "#f8fafc" : undefined,
          }}
        >
          কিভাবে ব্যবহার করবেন
        </h2>
        <ol style={{ margin: 0, paddingLeft: 24, lineHeight: 1.8 }}>
          {list.map((s, i) => (
            <li
              key={i}
              style={{
                fontSize: 16,
                color: dark ? "#e2e8f0" : undefined,
                marginBottom: 6,
              }}
            >
              {s}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}