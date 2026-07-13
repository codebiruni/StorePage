// Gallery: horizontal grid of remaining product images.
// Accepts both the legacy { images, variant? } API and the new { product, variant? }
// shortcut used by the modern themes (Atelier / Midnight / Kinetic / Pillar /
// Origin). When `product` is given, `images` is derived from `product.images`.
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";

export default function Gallery({
  product,
  images,
  variant,
}: {
  product?: SerializedLandingProduct;
  images?: string[];
  variant?: string;
}) {
  const source = images ?? product?.images ?? [];
  const list = source.filter(Boolean).slice(1); // skip main image
  if (list.length === 0) return null;
  return (
    <section className="step-section" data-variant={variant}>
      <div className="step-container">
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 16px" }}>
          আরো দেখুন
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {list.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                borderRadius: 12,
                background: "#f1f5f9",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}