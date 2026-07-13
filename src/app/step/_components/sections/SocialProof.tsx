// SocialProof: stat tiles ("5000+ happy customers", etc).
// Accepts both { stats, variant? } and { product, variant? }.
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";

export default function SocialProof({
  product,
  stats,
  variant,
}: {
  product?: SerializedLandingProduct;
  stats?: { label: string; value: string }[];
  variant?: string;
}) {
  const list = (
    stats ?? product?.landingPage?.socialProofStats ?? []
  ).filter((s) => s && s.label && s.value);
  if (list.length === 0) return null;
  const dark = variant === "bold";
  return (
    <section className="step-section" data-variant={variant}>
      <div
        className="step-container"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          textAlign: "center",
        }}
      >
        {list.map((s, i) => (
          <div
            key={i}
            style={{
              padding: 16,
              borderRadius: 12,
              background: dark ? "#1e293b" : "#fff",
              border: dark ? "1px solid #334155" : "1px solid #e2e8f0",
              color: dark ? "#f8fafc" : undefined,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}