"use client";
// PhoneWhatsapp: floating contact buttons (call + WhatsApp) backed by the
// SiteConfig so the number is configurable per-tenant. The `product` and
// `compact` props are accepted (and ignored) so the modern themes can render
// it alongside other sections without a type mismatch.
import { Phone, MessageCircle } from "lucide-react";
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider";
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";

export default function PhoneWhatsapp({
  variant,
  product,
  compact,
}: {
  variant?: string;
  product?: SerializedLandingProduct;
  compact?: boolean;
}) {
  const { config } = useSiteConfig();
  const phone = config?.contact?.phone ?? "";
  const whatsappNumber = config?.social?.whatsApp ?? phone;
  const whatsappDigits = whatsappNumber.replace(/[^0-9]/g, "");
  const dark = variant === "bold";
  const fg = dark ? "#f8fafc" : "#0f172a";

  // suppress unused-prop lint without changing behavior
  void product;
  void compact;

  if (!phone) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 80,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 40,
      }}
    >
      <a
        href={`tel:${phone}`}
        aria-label="Call us"
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#16a34a",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
        }}
      >
        <Phone size={20} />
      </a>
      <a
        href={`https://wa.me/${whatsappDigits}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp us"
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#22c55e",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
        }}
      >
        <MessageCircle size={20} />
      </a>
      <span style={{ display: "none" }}>{fg}</span>
    </div>
  );
}