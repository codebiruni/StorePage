"use client";

/**
 * Hero section — the main pitch with optional badge, video embed, and
 * hero image. Falls back to solid primary background if no image is set.
 *
 * Image aspect is 16:9 (landscape) per the master plan.
 */

import type { HeroSectionData } from "@/app/step/_lib/landing-config";

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  );
  return m ? m[1] : null;
}

export default function HeroSection({ data }: { data: HeroSectionData }) {
  const ytId = extractYoutubeId(data.videoUrl ?? "");
  return (
    <section className="lp-section" data-tone="canvas">
      <div className="lp-container grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-5">
          {data.badge ? (
            <span className="lp-eyebrow" style={{ color: "var(--lp-accent)" }}>
              {data.badge}
            </span>
          ) : null}
          <h1
            className="lp-headline"
            data-size="display"
            style={{ color: "var(--lp-primary)" }}
          >
            {data.headline || "Your product headline"}
          </h1>
          {data.subheadline ? (
            <p className="lp-lede">{data.subheadline}</p>
          ) : null}
          <a href="#order" className="lp-btn" data-tone="solid" data-size="lg">
            {data.ctaLabel || "Order now"}
          </a>
        </div>

        <div
          className="relative aspect-video w-full overflow-hidden rounded-xl border border-dashed border-black/10"
          style={{ background: "var(--lp-primary)" }}
        >
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              title="Product video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : data.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.heroImage}
              alt="Hero"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/80">
              Hero image · 16:9
            </div>
          )}
        </div>
      </div>
    </section>
  );
}