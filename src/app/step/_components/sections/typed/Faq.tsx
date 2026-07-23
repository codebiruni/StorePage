"use client";

/**
 * FAQ section — list of {q, a} pairs. Plain disclosure pattern using
 * <details> for zero-JS progressive enhancement.
 */

import type { FaqSectionData } from "@/app/step/_lib/landing-config";

export default function FaqSection({ data }: { data: FaqSectionData }) {
  const items = data.items ?? [];
  if (items.length === 0) return null;
  return (
    <section className="lp-section" data-tone="canvas">
      <div className="lp-container" data-width="narrow">
        <h2
          className="lp-headline mb-6"
          data-size="xl"
          style={{ color: "var(--lp-primary)" }}
        >
          সচরাচর জিজ্ঞাসা
        </h2>
        <div className="divide-y divide-black/10 rounded-xl border border-black/5 bg-white">
          {items.map((it, i) => (
            <details key={i} className="group p-4 [&_summary]:cursor-pointer">
              <summary className="flex items-center justify-between gap-4 text-sm font-medium">
                <span>{it.q}</span>
                <span
                  aria-hidden
                  className="text-black/40 transition-transform group-open:rotate-180"
                >
                  ▾
                </span>
              </summary>
              <p className="mt-2 text-sm text-black/70">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}