"use client";

/**
 * Comparison section — "Us vs Others" two-column layout. Each side has
 * a title and a list of claims. The "ours" column gets a green check,
 * the "theirs" column gets a red X (matches the Beetroot reference).
 */

import type { ComparisonSectionData } from "@/app/step/_lib/landing-config";

export default function ComparisonSection({
  data,
}: {
  data: ComparisonSectionData;
}) {
  const ours = data.ours ?? [];
  const theirs = data.theirs ?? [];
  if (ours.length === 0 && theirs.length === 0) return null;
  return (
    <section className="lp-section" data-tone="sunken">
      <div className="lp-container">
        <h2
          className="lp-headline mb-8 text-center"
          data-size="xl"
          style={{ color: "var(--lp-primary)" }}
        >
          আমরা VS অন্যরা
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div
            className="rounded-2xl border border-black/5 bg-white p-6"
            style={{ borderTop: "4px solid var(--lp-accent)" }}
          >
            <h3
              className="mb-4 text-lg font-semibold"
              style={{ color: "var(--lp-accent)" }}
            >
              {data.oursTitle || "আমাদের পণ্য"}
            </h3>
            <ul className="space-y-2">
              {ours.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span style={{ color: "var(--lp-accent)" }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-black/60">
              {data.theirsTitle || "অন্যরা"}
            </h3>
            <ul className="space-y-2">
              {theirs.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-black/60"
                >
                  <span>✕</span>
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