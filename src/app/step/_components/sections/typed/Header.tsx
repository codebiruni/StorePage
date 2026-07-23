"use client";

/**
 * Header section — site logo + optional contact CTA. The simplest section:
 * just two slots of text/image and a button. The CTA scrolls to the
 * order form on the page (the renderer ensures an `#order` anchor exists
 * at the bottom of every landing page).
 */

import Link from "next/link";
import type { HeaderSectionData } from "@/app/step/_lib/landing-config";

export default function HeaderSection({ data }: { data: HeaderSectionData }) {
  return (
    <header
      className="lp-section"
      data-tone="canvas"
      style={{ padding: "24px 0" }}
    >
      <div className="lp-container flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logoUrl}
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span
              className="text-sm font-semibold tracking-wide"
              style={{ color: "var(--lp-primary)" }}
            >
              Your brand
            </span>
          )}
        </div>
        {data.ctaLabel ? (
          <Link
            href={data.ctaHref || "#order"}
            className="lp-btn"
            data-tone="solid"
            data-size="sm"
          >
            {data.ctaLabel}
          </Link>
        ) : null}
      </div>
    </header>
  );
}