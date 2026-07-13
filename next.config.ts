import type { NextConfig } from "next";
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
type RemotePattern = { protocol: string; hostname: string };

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

  const hosts = Array.from(
    new Set(
      raw
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
  },
};

export default withPWA(nextConfig);
