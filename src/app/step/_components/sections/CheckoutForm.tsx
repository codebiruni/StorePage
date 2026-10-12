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
  const totalAmount = product.generalPrice.currentPrice;
  // Landing forms don't capture a district, so apply the outside-Dhaka
  // charge as the default. Admins can edit both values from the dashboard.
  const deliveryCharge = siteConfig?.deliveryCharge?.outsideDhaka ?? 0;
  const grandTotal = totalAmount + deliveryCharge;
  const dark = variant === "bold";
  // Precedence: explicit `note` prop (from Form Title section) → legacy
  // `checkoutNote` prop → persisted checkoutNote on the product.
  const note = noteProp ?? checkoutNote ?? product.landingPage?.checkoutNote ?? "";

  // Auto-save partial input so we never lose the lead.
  const { draftId, saveDraft } = useOrderDraft({ source: "landing" });
  useEffect(() => {
    if (!name && !number && !address) return; // skip initial empty render
    saveDraft({
      productId: product._id,
      name,
      number,
      address,
      note,
      deliveryCharge,
      totalAmount,
    });
  }, [name, number, address, note, deliveryCharge, totalAmount, product._id, saveDraft]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          number,
          address,
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
      className="step-section"
      data-variant={variant}
      style={dark ? { background: "#0f172a", color: "#f8fafc" } : undefined}
    >
      <div className="step-container step-container--narrow">
        {headingText ? (
          <h2
            id={`order-${product._id}`}
            style={{
              fontSize: 24,
              fontWeight: 800,
              margin: "0 0 16px",
              color: dark ? "#f8fafc" : undefined,
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
            }}
          >
            {note}
          </p>
        ) : null}

        <form
          onSubmit={submit}
          style={{
            display: "grid",
            gap: 12,
            background: dark ? "#1e293b" : "var(--lp-card-bg, #fff)",
            border: dark ? "1px solid #334155" : "1px solid var(--lp-line, #e2e8f0)",
            padding: 20,
            borderRadius: "var(--lp-radius-lg, 12px)",
            boxShadow: "var(--lp-shadow, 0 1px 3px rgba(0,0,0,0.08))",
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
          {error ? (
            <div style={{ color: "#dc2626", fontSize: 14 }}>{error}</div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#94a3b8" : "var(--lp-accent, var(--primary, #dc2626))",
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
            {loading ? "অপেক্ষা করুন…" : `অর্ডার করুন — ৳${grandTotal}`}
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