// TrustBadges: small "free delivery" / "cod" / "authentic" pill row.
import { ShieldCheck, Truck, CreditCard } from "lucide-react";
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";

const DEFAULT_BADGES: { label: string; icon: React.ReactNode }[] = [
  { label: "ক্যাশ অন ডেলিভারি", icon: <CreditCard size={16} /> },
  { label: "ফ্রি ডেলিভারি", icon: <Truck size={16} /> },
  { label: "অরিজিনাল পণ্য", icon: <ShieldCheck size={16} /> },
];

export default function TrustBadges({
  product,
  variant,
}: {
  product: SerializedLandingProduct;
  variant?: string;
}) {
  // product.landingPage?.trustBadges may contain custom labels; if absent we
  // show the default COD/Free-delivery/Authentic trio.
  const custom = product.landingPage?.trustBadges?.filter(Boolean) ?? [];
  const show = custom.length > 0 ? custom : DEFAULT_BADGES.map((b) => b.label);
  return (
    <section className="step-section step-section--tight" data-variant={variant}>
      <div
        className="step-container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
        }}
      >
        {show.map((label, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {DEFAULT_BADGES[i % DEFAULT_BADGES.length]?.icon ?? null}
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}