"use client";

/**
 * Footer section — copyright + optional "designed by" line.
 */

import type { FooterSectionData } from "@/app/step/_lib/landing-config";

export default function FooterSection({ data }: { data: FooterSectionData }) {
  return (
    <footer className="lp-section" data-tone="ink">
      <div className="lp-container flex flex-col items-center gap-2 text-center text-sm text-white/80">
        <p>{data.copyrightText || "© Your brand"}</p>
        {data.creditText ? (
          <p className="text-xs text-white/50">{data.creditText}</p>
        ) : null}
      </div>
    </footer>
  );
}