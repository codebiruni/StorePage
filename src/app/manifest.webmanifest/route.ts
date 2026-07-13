/**
 * GET /manifest.webmanifest
 *
 * Dynamic PWA manifest. Replaces the static `public/manifest.json` so each
 * deployment shows its own brand name, theme color, and logo in the
 * "Add to Home Screen" prompt on iOS/Android.
 *
 * Note: the `next-pwa` generated service worker (`/sw.js`) still uses the
 * static manifest that ships in `public/`. We keep that file as a fallback
 * for the service worker; the live `<link rel="manifest">` always points
 * here so browsers pick up the dynamic version.
 */
import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

function absoluteUrl(siteUrl: string, maybeRelative: string): string {
  if (!maybeRelative) return "";
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
  try {
    return new URL(maybeRelative, siteUrl).toString();
  } catch {
    return maybeRelative;
  }
}

export async function GET() {
  const config = await getSiteConfig();
  const logo = config.logo || "/logo.png";

  const manifest = {
    name: config.name,
    short_name: config.name,
    description: config.tagline,
    icons: [
      {
        src: absoluteUrl(config.siteUrl, logo),
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: absoluteUrl(config.siteUrl, logo),
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: absoluteUrl(config.siteUrl, logo),
        sizes: "512x512",
        type: "image/png",
      },
    ],
    theme_color: config.themeColor,
    background_color: config.themeColor,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
  };

  return NextResponse.json(manifest, {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=60, s-maxage=300",
    },
  });
}