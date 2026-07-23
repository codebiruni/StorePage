"use client";

/**
 * Pricing section — strikethrough-old-price / offer-price pattern with an
 * optional bundle note ("buy 2, save ৳133").
 */

import type { PricingSectionData } from "@/app/step/_lib/landing-config";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "৳0";
  // Bengali-style thousands separator (৳ symbol + comma).
  return `৳${Math.round(n).toLocaleString("en-IN")}`;
}

export default function PricingSection({ data }: { data: PricingSectionData }) {
  return (
    <section className="lp-section" data-tone="sunken">
      <div className="lp-container" data-width="narrow">
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <p
            className="text-sm font-medium uppercase tracking-wide"
            style={{ color: "var(--lp-fg-muted, #666)" }}
          >
            Special offer
          </p>
          <div className="my-3 flex items-baseline justify-center gap-3">
            <span className="text-2xl text-black/40 line-through">
              {fmt(data.regularPrice)}
            </span>
            <span
              className="text-5xl font-bold"
              style={{ color: "var(--lp-accent)" }}
            >
              {fmt(data.offerPrice)}
            </span>
          </div>
          {data.bundleNote ? (
            <p className="text-sm text-black/60">{data.bundleNote}</p>
          ) : null}
          <a
            href="#order"
            className="lp-btn mt-6"
            data-tone="solid"
            data-size="lg"
          >
            {data.ctaLabel || "Order now"}
          </a>
        </div>
      </div>
    </section>
  );
}