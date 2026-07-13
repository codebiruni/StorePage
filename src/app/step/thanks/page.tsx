"use client";

// Shared post-purchase success page. Used by both the public landing page
// (`/step/[id]` -> CheckoutForm) and the buy-product cart flow
// (`/buy-product` -> ParchessProducts). The orderId, if any, arrives via the
// `?orderId=` query string so the route stays identical across flows.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle, ShieldCheck, PhoneCall, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

function ThanksPageInner() {
  const params = useSearchParams();
  const orderId = params.get("orderId") ?? "";

  return (
    <div
      className="step-container step-container--narrow"
      style={{
        textAlign: "center",
        padding: "64px 20px 48px",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 72,
          height: 72,
          borderRadius: "9999px",
          background: "#dcfce7",
          margin: "0 auto",
        }}
      >
        <CheckCircle size={40} color="#16a34a" />
      </div>

      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          margin: "16px 0 8px",
          color: "#0f172a",
        }}
      >
        অর্ডার সফল!
      </h1>

      <p
        style={{
          color: "#475569",
          margin: "0 auto 24px",
          lineHeight: 1.6,
          maxWidth: 480,
        }}
      >
        আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। নিচের তথ্য দেখুন —
        আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          margin: "0 auto 24px",
          maxWidth: 460,
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <ShieldCheck size={18} color="#16a34a" />
          <span style={{ fontSize: 14, color: "#334155" }}>
            আপনার অর্ডারটি সফলভাবে প্লেস হয়েছে
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <PhoneCall size={18} color="#2563eb" />
          <span style={{ fontSize: 14, color: "#334155" }}>
            আমরা ১ ঘন্টার মধ্যে ফোনে যোগাযোগ করে অর্ডার কনফার্ম করব
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <Clock size={18} color="#ea580c" />
          <span style={{ fontSize: 14, color: "#334155" }}>
            ডেলিভারি সময়: ৩–৫ কার্যদিবস
          </span>
        </div>
      </div>

      {orderId ? (
        <div
          style={{
            margin: "0 auto 28px",
            background: "#f1f5f9",
            border: "1px dashed #cbd5e1",
            borderRadius: 10,
            padding: "12px 16px",
            maxWidth: 460,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#475569",
            }}
          >
            অর্ডার আইডি
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontWeight: 700,
              fontSize: 18,
              color: "#0f172a",
              wordBreak: "break-all",
            }}
          >
            {orderId}
          </p>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Button
          asChild
          style={{
            background: "#0f172a",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          <Link href="/">আরো পণ্য দেখুন</Link>
        </Button>
        <Button asChild variant="outline" style={{ fontWeight: 700 }}>
          <Link href="/products">আরও শপিং</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ThanksPage() {
  // useSearchParams requires a Suspense boundary during static rendering.
  return (
    <Suspense
      fallback={
        <div
          className="step-container step-container--narrow"
          style={{ textAlign: "center", padding: "80px 20px" }}
        >
          <CheckCircle size={64} color="#16a34a" style={{ margin: "0 auto" }} />
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              margin: "16px 0 12px",
            }}
          >
            আপনার অর্ডারটি গ্রহণ করা হয়েছে!
          </h1>
        </div>
      }
    >
      <ThanksPageInner />
    </Suspense>
  );
}