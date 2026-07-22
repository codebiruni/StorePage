// Comparison section: two-column "we vs others" block. Accepts both:
//   • { product, variant? } — items are derived from `product.landingPage.comparison`
//     and fall back to a sensible generic copy when the field is empty so
//     every product category has something to show.
//   • { ours, others, variant? } — explicit data passed by the theme.
//
// Each side renders a list of bullet items. Ours is rendered with a green ✓
// and "Others" with a red ✗ to match the demo6 reference. The component is
// theme-agnostic; colour comes from theme tokens via inline data attributes.
import { Check, X } from "lucide-react";
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";

type Column = { title: string; items: string[] };

function derive(product?: SerializedLandingProduct): {
  ours: Column;
  others: Column;
} {
  const cmp = product?.landingPage?.comparison;
  const oursItems = (cmp?.oursItems ?? []).filter(Boolean);
  const othersItems = (cmp?.othersItems ?? []).filter(Boolean);
  // When admins haven't filled either side, fall back to generic copy that
  // works for any product category. This keeps the page looking complete
  // out of the box without forcing a data entry step.
  return {
    ours: {
      title: cmp?.oursTitle || "আমাদের পণ্য",
      items:
        oursItems.length > 0
          ? oursItems
          : [
              "সঠিকভাবে প্রস্তুত ও প্যাকেজিংকৃত",
              "প্রাকৃতিক উপাদান, কোনো ক্ষতিকর মিশ্রণ নেই",
              "দীর্ঘস্থায়ী মান নিশ্চিত",
            ],
    },
    others: {
      title: cmp?.othersTitle || "বাজারের অন্যান্য পণ্য",
      items:
        othersItems.length > 0
          ? othersItems
          : [
              "মান নিয়ন্ত্রণে অনিশ্চয়তা",
              "কৃত্রিম সংযোজনের সম্ভাবনা",
              "সংরক্ষণে দ্রুত নষ্ট হতে পারে",
            ],
    },
  };
}

export default function Comparison({
  product,
  ours,
  others,
  variant,
}: {
  product?: SerializedLandingProduct;
  ours?: Column;
  others?: Column;
  variant?: string;
}) {
  // Hide the section entirely if neither side has anything to show.
  const derived = derive(product);
  const left: Column = ours ?? derived.ours;
  const right: Column = others ?? derived.others;
  const hasContent =
    left.items.length > 0 || right.items.length > 0;
  if (!hasContent) return null;

  const dark = variant === "bold" || variant === "midnight";

  return (
    <section
      className="step-section step-section--alt"
      data-variant={variant}
      style={dark ? { background: "#0f172a", color: "#f8fafc" } : undefined}
    >
      <div className="step-container">
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            margin: "0 0 24px",
            textAlign: "center",
            color: dark ? "#f8fafc" : undefined,
          }}
        >
          আমরা VS অন্যরা
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {/* Ours */}
          <div
            style={{
              background: dark ? "#1e293b" : "#f0fdf4",
              border: dark ? "1px solid #334155" : "1px solid #bbf7d0",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: 18,
                fontWeight: 700,
                color: dark ? "#f8fafc" : "#166534",
              }}
            >
              {left.title}
            </h3>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {left.items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 8,
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: dark ? "#e2e8f0" : "#0f172a",
                  }}
                >
                  <Check
                    size={18}
                    color={dark ? "#22c55e" : "#16a34a"}
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Others */}
          <div
            style={{
              background: dark ? "#1e293b" : "#fef2f2",
              border: dark ? "1px solid #334155" : "1px solid #fecaca",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: 18,
                fontWeight: 700,
                color: dark ? "#f8fafc" : "#991b1b",
              }}
            >
              {right.title}
            </h3>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {right.items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 8,
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: dark ? "#e2e8f0" : "#0f172a",
                  }}
                >
                  <X
                    size={18}
                    color={dark ? "#f87171" : "#dc2626"}
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}