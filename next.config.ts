import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import nextPWA from "next-pwa";

/**
 * Build an allowlist of remote image hosts for `next/image` from env.
 *
 *   NEXT_PUBLIC_IMAGE_HOSTS   → comma-separated allowlist, e.g. "i.imgur.com,cdn.example.com"
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME → appended if set
 *   CLOUDINARY_CLOUD_NAME              → appended if set
 *   ALLOW_ALL_IMAGE_HOSTS=true         → falls back to "**" (dev convenience only)
 *
 * The static `hostname: "**"` form is intentionally NOT used in production
 * because it bypasses Next.js' built-in image-domain guard. A per-deployment
 * allowlist is required by the multi-tenant plan (see .puku/plans/...).
 */

function buildRemotePatterns(): RemotePattern[] {
  const allowAll = process.env.ALLOW_ALL_IMAGE_HOSTS === "true";
  if (allowAll) {
    return [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ];
  }

  const raw =
    process.env.NEXT_PUBLIC_IMAGE_HOSTS ||
    [
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      process.env.CLOUDINARY_CLOUD_NAME,
      "res.cloudinary.com",
    ]
      .filter(Boolean)
      .join(",");

  // Always allow the Cloudflare R2 public CDN domain (new image pipeline) so
  // next/image can optimize/render R2-hosted product images without extra
  // env wiring. We parse the host out of R2_PUBLIC_DOMAIN / NEXT_PUBLIC_*
  // so both server and build-time-only configs are covered.
  const r2Domain =
    process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN;
  const rawWithR2 = (() => {
    if (!r2Domain) return raw;
    try {
      const host = new URL(r2Domain).hostname;
      if (host) return `${raw},${host}`;
    } catch {
      /* not a valid URL — ignore */
    }
    return raw;
  })();

  const hosts = Array.from(
    new Set(
      rawWithR2
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean),
    ),
  );

  if (hosts.length === 0) {
    // Hard floor — never ship a config with zero remotePatterns or
    // next/image will throw at request time. Keep res.cloudinary.com as the
    // last-resort default because Cloudinary is the canonical image host
    // for this codebase.
    hosts.push("res.cloudinary.com");
  }

  const patterns: RemotePattern[] = [];
  for (const hostname of hosts) {
    patterns.push({ protocol: "https", hostname });
    patterns.push({ protocol: "http", hostname });
  }
  return patterns;
}

const pwaRegister = (process.env.PWA_REGISTER ?? "true") !== "false";
const pwaSkipWaiting = (process.env.PWA_SKIP_WAITING ?? "true") !== "false";

const withPWA = nextPWA({
  dest: "public",
  register: pwaRegister,
  skipWaiting: pwaSkipWaiting,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Standalone build produces a self-contained server (no node_modules) that
  // boots in ~200ms. Works on Vercel (build output) and on BDIX/Nginx/Coolify
  // for self-hosted deployments.
  output: "standalone",

  // Enable gzip compression for all responses.
  compress: true,

  // Don't advertise the framework version.
  poweredByHeader: false,

  turbopack: {
    root: __dirname,
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Directs webpack to ignore handlebars' internal runtime extensions feature
      config.externals.push({
        handlebars: "commonjs handlebars",
      });
    }
    return config;
  },

  images: {
    remotePatterns: buildRemotePatterns(),
    // Serve modern formats first; fall back to original if browser is old.
    formats: ["image/avif", "image/webp"],
    // Cache optimized images at the CDN edge for 1 year.
    minimumCacheTTL: 31536000,
  },

  experimental: {
    // Tree-shake icons / dates / motion libs so unused exports don't ship.
    optimizePackageImports: ["lucide-react", "date-fns", "framer-motion"],
  },

  // Long-lived Cache-Control headers for immutable assets. Public CDNs (Vercel
  // Edge, Cloudflare, Nginx) will respect these and serve them from cache
  // for the full year, removing the round-trip to origin for repeat visits.
  //
  // Next.js 16 tightened path-to-regexp parsing — bare `:path*` segments
  // now require a prefix segment. Add a leading `/:file*` so the matcher
  // has a stable prefix, which is the minimum shape Next 16 accepts.
  async headers() {
    // Dev: Turbopack recompiles chunks on every edit. If we ship immutable
    // Cache-Control here, the browser caches the old chunk graph and after
    // an edit (e.g. removing an import) throws "module factory is not
    // available" because the cached chunk still references the removed
    // module. Only apply long-cache headers in production.
    if (process.env.NODE_ENV !== "production") return [];

    const longCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];
    return [
      { source: "/_next/static/:file*", headers: longCache },
      { source: "/_next/image/:file*", headers: longCache },
      { source: "/images/:file*", headers: longCache },
      { source: "/fonts/:file*", headers: longCache },
    ];
  },
};

export default withPWA(nextConfig);
