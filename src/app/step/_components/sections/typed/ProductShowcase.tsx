"use client";

/**
 * Product Showcase section — square product shots (1:1) in a grid with
 * optional caption underneath.
 */

import type { ProductShowcaseSectionData } from "@/app/step/_lib/landing-config";

export default function ProductShowcaseSection({
  data,
}: {
  data: ProductShowcaseSectionData;
}) {
  if (!data.images || data.images.length === 0) return null;
  return (
    <section className="lp-section" data-tone="canvas">
      <div className="lp-container">
        {data.caption ? (
          <p className="mb-6 text-center text-sm font-medium uppercase tracking-wide text-black/60">
            {data.caption}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.images.map((src, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-black/5 bg-white"
              style={{ aspectRatio: "1 / 1" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Product ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}