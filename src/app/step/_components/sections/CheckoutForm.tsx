"use client";
// CheckoutForm: minimal buyer-details form (name / phone / address). Posts to
// /api/v1/order and redirects to /step/thanks on success. Accepts both the
// legacy { product, checkoutNote, variant? } API and { product, variant? }
// where checkoutNote is derived from product.landingPage.checkoutNote.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider";
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";
import { useOrderDraft } from "@/hooks/useOrderDraft";

export default function CheckoutForm({
  product,
  checkoutNote,
  headingText,
  note: noteProp,
  variant,
}: {
  product: SerializedLandingProduct;
  /**
   * @deprecated Forwarded only for backwards compatibility — newer callers
   * pass `headingText` directly (driven by the Form Title section).
   */
  checkoutNote?: string;
  /** Editable headline above the form. Empty falls back to a default. */
  headingText?: string;
  /** Editable subtitle line under the headline. Empty suppresses the line. */
  note?: string;
  variant?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { config: siteConfig } = useSiteConfig();
  const insideCharge = siteConfig?.deliveryCharge?.insideDhaka ?? 70;
  const outsideCharge = siteConfig?.deliveryCharge?.outsideDhaka ?? 90;

  const [shippingZone, setShippingZone] = useState<"outside" | "inside">("outside");
  const deliveryCharge = shippingZone === "inside" ? insideCharge : outsideCharge;
  const totalAmount = product.generalPrice.currentPrice;
  const grandTotal = totalAmount + deliveryCharge;
  const dark = variant === "bold";
  // Precedence: explicit `note` prop (from Form Title section) → legacy
  // `checkoutNote` prop → persisted checkoutNote on the product.
  const note = noteProp ?? checkoutNote ?? product.landingPage?.checkoutNote ?? "";

  // Auto-save partial input so we never lose the lead.
  const { draftId, saveDraft } = useOrderDraft({ source: "landing" });
  useEffect(() => {
    if (!name && !number && !address) return; // skip initial empty render
    const zoneLabel = shippingZone === "inside" ? "ঢাকার ভিতরে" : "ঢাকার বাহিরে";
    saveDraft({
      productId: product._id,
      name,
      number,
      address: `${address} (${zoneLabel})`,
      note,
      deliveryCharge,
      totalAmount,
    });
  }, [name, number, address, shippingZone, note, deliveryCharge, totalAmount, product._id, saveDraft]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const zoneLabel = shippingZone === "inside" ? "ঢাকার ভিতরে" : "ঢাকার বাহিরে";
      const fullAddress = address.trim();
      const res = await fetch("/api/v1/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          number,
          address: `${fullAddress} (${zoneLabel})`,
          products: [product._id],
          totalAmount,
          deliveryCharge,
          grandTotal,
          draftId, // promote draft → pending if server recognises it
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message ?? "Order could not be placed");
      }
      // The API returns the saved order document on `data` with the public
      // orderId string in `data.orderId`. Fall back to the mongo _id if the
      // legacy endpoint ever returns just the bare doc.
      const createdOrderId: string | undefined =
        json?.data?.orderId ?? json?.orderId ?? json?.data?._id;
      const target = createdOrderId
        ? `/step/thanks?orderId=${encodeURIComponent(createdOrderId)}`
        : "/step/thanks";
      router.push(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <section
      className="lp-section"
      data-variant={variant}
      style={{
        paddingTop: 0,
        ...(dark ? { background: "#0f172a", color: "#f8fafc" } : {}),
      }}
    >
      <div className="lp-container">
        {headingText ? (
          <h2
            id={`order-${product._id}`}
            style={{
              fontSize: 24,
              fontWeight: 800,
              margin: "0 0 16px",
              color: dark ? "#f8fafc" : undefined,
              textAlign: "center",
            }}
          >
            {headingText}
          </h2>
        ) : null}

        {note ? (
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 14,
              color: dark ? "#cbd5e1" : "#475569",
              textAlign: "center",
            }}
          >
            {note}
          </p>
        ) : null}

        <form
          onSubmit={submit}
          style={{
            display: "grid",
            gap: 14,
            background: dark ? "#1e293b" : "var(--lp-card-bg, #fff)",
            border: dark ? "1px solid #334155" : "1px solid var(--lp-line, #e2e8f0)",
            padding: 24,
            borderRadius: "var(--lp-radius-lg, 12px)",
            boxShadow: "var(--lp-shadow, 0 1px 3px rgba(0,0,0,0.08))",
            width: "100%",
          }}
        >
          <input
            type="text"
            placeholder="আপনার নাম"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle(dark)}
          />
          <input
            type="tel"
            placeholder="মোবাইল নাম্বার"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
            style={inputStyle(dark)}
          />
          <textarea
            placeholder="ডেলিভারি ঠিকানা"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            rows={3}
            style={{ ...inputStyle(dark), resize: "vertical" }}
          />

          {/* Shipping Zone Radio Options */}
          <div
            style={{
              borderRadius: "var(--lp-radius, 8px)",
              border: dark ? "1px solid #334155" : "1px solid var(--lp-line, #cbd5e1)",
              overflow: "hidden",
              background: dark ? "#0f172a" : "#fff",
            }}
          >
            {/* Outside Dhaka */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                cursor: "pointer",
                borderBottom: dark ? "1px solid #334155" : "1px solid var(--lp-line, #cbd5e1)",
                background:
                  shippingZone === "outside"
                    ? dark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.03)"
                    : "transparent",
                transition: "background-color 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="radio"
                  name="shippingZone"
                  value="outside"
                  checked={shippingZone === "outside"}
                  onChange={() => setShippingZone("outside")}
                  style={{
                    width: 18,
                    height: 18,
                    cursor: "pointer",
                    accentColor: "var(--lp-accent, #2563eb)",
                  }}
                />
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: dark ? "#f8fafc" : "var(--lp-fg, #0f172a)",
                  }}
                >
                  ঢাকার বাহিরে:
                </span>
              </div>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: dark ? "#f8fafc" : "var(--lp-fg, #0f172a)",
                }}
              >
                {outsideCharge} ৳
              </span>
            </label>

            {/* Inside Dhaka */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                cursor: "pointer",
                background:
                  shippingZone === "inside"
                    ? dark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.03)"
                    : "transparent",
                transition: "background-color 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="radio"
                  name="shippingZone"
                  value="inside"
                  checked={shippingZone === "inside"}
                  onChange={() => setShippingZone("inside")}
                  style={{
                    width: 18,
                    height: 18,
                    cursor: "pointer",
                    accentColor: "var(--lp-accent, #2563eb)",
                  }}
                />
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: dark ? "#f8fafc" : "var(--lp-fg, #0f172a)",
                  }}
                >
                  ঢাকার ভিতরে:
                </span>
              </div>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: dark ? "#f8fafc" : "var(--lp-fg, #0f172a)",
                }}
              >
                {insideCharge} ৳
              </span>
            </label>
          </div>

          {/* Delivery charge & total summary */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "var(--lp-radius, 8px)",
              background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
              border: dark ? "1px solid #334155" : "1px solid var(--lp-line, #e2e8f0)",
              fontSize: 14,
              display: "grid",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: dark ? "#cbd5e1" : "#64748b",
              }}
            >
              <span>পণ্যের মূল্য:</span>
              <span
                style={{
                  fontWeight: 600,
                  color: dark ? "#f8fafc" : "#0f172a",
                }}
              >
                ৳{totalAmount}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: dark ? "#cbd5e1" : "#64748b",
              }}
            >
              <span>ডেলিভারি চার্জ:</span>
              <span
                style={{
                  fontWeight: 600,
                  color: dark ? "#f8fafc" : "#0f172a",
                }}
              >
                ৳{deliveryCharge}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: 8,
                borderTop: dark
                  ? "1px solid #334155"
                  : "1px solid var(--lp-line, #e2e8f0)",
                fontWeight: 700,
                fontSize: 16,
                color: dark ? "#f8fafc" : "#0f172a",
              }}
            >
              <span>সর্বমোট:</span>
              <span style={{ color: "var(--lp-accent, #2563eb)" }}>
                ৳{grandTotal}
              </span>
            </div>
          </div>

          {error ? (
            <div style={{ color: "#dc2626", fontSize: 14 }}>{error}</div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading
                ? "#94a3b8"
                : "var(--lp-accent, var(--primary, #dc2626))",
              color: "var(--primary-foreground, #fff)",
              border: 0,
              padding: "14px 20px",
              borderRadius: "var(--lp-btn-radius, 8px)",
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              transition: "opacity 0.15s ease",
            }}
          >
            {loading ? "অপেক্ষা করুন…" : `অর্ডার কনফার্ম করুন — ৳${grandTotal}`}
          </button>
        </form>
      </div>
    </section>
  );
}

function inputStyle(dark?: boolean): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: "var(--lp-radius, 8px)",
    border: dark ? "1px solid #334155" : "1px solid var(--lp-line, #cbd5e1)",
    background: dark ? "#0f172a" : "#fff",
    color: dark ? "#f8fafc" : "var(--lp-fg, #0f172a)",
    fontSize: 15,
  };
}