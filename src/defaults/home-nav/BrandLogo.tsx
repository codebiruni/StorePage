"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * BrandLogo
 *
 * A polished, animated brand mark for the navbar. Renders the configured logo
 * image when present, otherwise falls back to a hand-crafted monogram SVG so
 * the navbar never looks "broken" out of the box.
 *
 * The mark is built from two overlapping gradient shapes (a square + a
 * diamond) plus a typographic glyph. The whole thing is one SVG so it scales
 * crisply at any size and inherits `currentColor` for theme-aware tinting.
 */
export interface BrandLogoProps {
  brandName: string;
  logoUrl?: string;
  /** Render the wordmark next to the mark. Defaults to true. */
  showName?: boolean;
  /** Visual size of the mark in px. */
  size?: number;
  className?: string;
  /** When true, wraps the result in a Next.js <Link href="/">. */
  asLink?: boolean;
}

function initials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "S";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function BrandLogo({
  brandName,
  logoUrl,
  showName = true,
  size = 36,
  className,
  asLink = true,
}: BrandLogoProps) {
  const glyph = initials(brandName);

  const mark = (
    <span
      className={cn(
        "relative inline-flex items-center justify-center shrink-0",
        "transition-transform duration-300 group-hover:scale-[1.04]",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden={logoUrl ? "true" : undefined}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={brandName}
          className="h-full w-full rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10"
        />
      ) : (
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <defs>
            <linearGradient id="brandMarkA" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="brandMarkB" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          {/* Background rounded square */}
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="12"
            fill="url(#brandMarkA)"
          />
          {/* Overlay diamond */}
          <path
            d="M24 8 L40 24 L24 40 L8 24 Z"
            fill="url(#brandMarkB)"
          />
          {/* Glyph */}
          <text
            x="24"
            y="29"
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
            fontWeight="800"
            fontSize="18"
            letterSpacing="0.5"
            fill="white"
          >
            {glyph}
          </text>
        </svg>
      )}
    </span>
  );

  const wordmark = showName ? (
    <span className="flex flex-col leading-none">
      <span className="text-[15px] sm:text-base font-extrabold tracking-tight text-foreground">
        {brandName}
      </span>
      <span className="mt-0.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Shop with confidence
      </span>
    </span>
  ) : null;

  const inner = (
    <span className="group inline-flex items-center gap-2.5 select-none">
      {mark}
      {wordmark}
    </span>
  );

  if (!asLink) return inner;

  return (
    <Link href="/" aria-label={`${brandName} home`} className="inline-flex">
      {inner}
    </Link>
  );
}