"use client";
// PhoneStrip: full-bleed band that drives callers to dial the configured
// site phone. Renders between social proof and the checkout form on the
// Health theme. The phone number is read from SiteConfig so each tenant
// keeps its own line. Hidden gracefully when no number is configured so the
// section doesn't render a broken button.
import { Phone } from "lucide-react";
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider";

export default function PhoneStrip({
  note,
  variant,
}: {
  note?: string;
  variant?: string;
}) {
  const { config } = useSiteConfig();
  const phone = config?.contact?.phone ?? "";
  if (!phone) return null;
  const dark = variant === "bold" || variant === "midnight";
  return (
    <section
      data-variant={variant}
      style={{
        background: dark ? "#0f172a" : "#16a34a",
        color: "#fff",
        padding: "36px 0",
      }}
    >
      <div
        className="step-container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {note || "ফোনে অর্ডার করুন অথবা প্রয়োজনে কল করুন"}
        </h3>
        <a
          href={`tel:${phone}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            color: dark ? "#0f172a" : "#16a34a",
            padding: "12px 20px",
            borderRadius: 10,
            fontWeight: 700,
            textDecoration: "none",
            fontSize: 16,
          }}
        >
          <Phone size={18} />
          <span>{phone}</span>
        </a>
      </div>
    </section>
  );
}