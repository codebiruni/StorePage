// Guarantee section: "7-day money-back" type messaging.
// Accepts both { text, variant? } and { product, variant? }.
import { ShieldCheck } from "lucide-react";
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";

export default function Guarantee({
  product,
  text,
  variant,
}: {
  product?: SerializedLandingProduct;
  text?: string;
  variant?: string;
}) {
  const message = (text ?? product?.landingPage?.guarantee ?? "").trim();
  if (!message) return null;
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
          alignItems: "center",
          gap: 16,
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        <ShieldCheck size={36} color={dark ? "#facc15" : "#16a34a"} />
        <div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
              color: dark ? "#f8fafc" : undefined,
            }}
          >
            আমাদের গ্যারান্টি
          </h3>
          <p style={{ margin: "4px 0 0", lineHeight: 1.5 }}>{message}</p>
        </div>
      </div>
    </section>
  );
}