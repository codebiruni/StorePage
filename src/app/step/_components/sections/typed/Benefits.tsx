"use client";

/**
 * Benefits section — checklist of product benefits. The icon slot is
 * reserved for a future icon-library; for now every item renders the same
 * green checkmark.
 */

import type { BenefitsSectionData } from "@/app/step/_lib/landing-config";

export default function BenefitsSection({
  data,
}: {
  data: BenefitsSectionData;
}) {
  if (!data.items || data.items.length === 0) return null;
  return (
    <section className="lp-section" data-tone="raised">
      <div className="lp-container">
        {data.title ? (
          <h2
            className="lp-headline mb-6"
            data-size="xl"
            style={{ color: "var(--lp-primary)" }}
          >
            {data.title}
          </h2>
        ) : null}
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.items.map((it, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4"
            >
              <span
                className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "var(--lp-accent)" }}
                aria-hidden
              >
                ✓
              </span>
              <span className="text-sm leading-relaxed">{it.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}