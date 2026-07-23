"use client";

/**
 * Trust Badge section — single certification / lab-report image with
 * optional caption. Aspect ratio is 4:5 (portrait, like a certificate).
 */

import type { TrustBadgeSectionData } from "@/app/step/_lib/landing-config";

export default function TrustBadgeSection({
  data,
}: {
  data: TrustBadgeSectionData;
}) {
  if (!data.image) return null;
  return (
    <section className="lp-section" data-tone="canvas">
      <div className="lp-container" data-width="narrow">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="overflow-hidden rounded-lg border border-dashed border-black/10"
            style={{ aspectRatio: "4 / 5", maxWidth: 360, width: "100%" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.image}
              alt={data.caption || "Trust badge"}
              className="h-full w-full object-cover"
            />
          </div>
          {data.caption ? (
            <p className="text-sm text-black/60">{data.caption}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}