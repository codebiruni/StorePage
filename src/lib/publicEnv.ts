/**
 * Client-safe environment configuration.
 *
 * IMPORTANT: This module is imported by both server-side and client-side code.
 * It MUST NOT touch server-only secrets or call `requireString` for keys that
 * only exist on the server (e.g. MONGODB_URI, JWT_*, API tokens). Doing so
 * would throw during the browser bundle's module evaluation, because Next.js
 * inlines `NEXT_PUBLIC_*` constants into the client at build time but never
 * ships server-only `process.env` keys.
 *
 * `requirePublic` is provided as a runtime helper for code paths that must
 * have a value at the moment they run (not at module-evaluation time).
 */

type PublicEnvShape = {
  NEXT_PUBLIC_SITE_URL: string;
  NEXT_PUBLIC_BRAND_NAME: string;
  NEXT_PUBLIC_BRAND_TAGLINE: string;
  NEXT_PUBLIC_THEME_COLOR: string;
  NEXT_PUBLIC_DEFAULT_LOGO: string;
  NEXT_PUBLIC_CONTACT_EMAIL: string;
  NEXT_PUBLIC_CONTACT_PHONE: string;
  NEXT_PUBLIC_FACEBOOK_URL: string;
  NEXT_PUBLIC_INSTAGRAM_URL: string;
  NEXT_PUBLIC_YOUTUBE_URL: string;
  NEXT_PUBLIC_WHATSAPP_NUMBER: string;
  NEXT_PUBLIC_TWITTER_URL: string;
  NEXT_PUBLIC_LINKEDIN_URL: string;
  NEXT_PUBLIC_IMAGE_HOSTS: string;
  NEXT_PUBLIC_META_PIXEL_ID?: string;
  NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
  NEXT_PUBLIC_CLOUDINARY_IMAGE_API: string;
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: string;
  NEXT_PUBLIC_CLOUDINARY_PRESET: string;
};

function readString(key: string, fallback?: string): string {
  const v = process.env[key];
  if (v && v.length > 0) return v;
  if (fallback !== undefined) return fallback;
  return "";
}

/**
 * Client-safe env. Every key must keep the `NEXT_PUBLIC_` prefix because
 * Next.js inlines only those into the browser bundle. Values here are
 * considered safe to expose publicly; secrets stay on the server.
 */
export const publicEnv: PublicEnvShape = {
  NEXT_PUBLIC_SITE_URL: readString(
    "NEXT_PUBLIC_SITE_URL",
    "http://localhost:3000",
  ),
  NEXT_PUBLIC_BRAND_NAME: readString("NEXT_PUBLIC_BRAND_NAME", "My Store"),
  NEXT_PUBLIC_BRAND_TAGLINE: readString(
    "NEXT_PUBLIC_BRAND_TAGLINE",
    "Quality products, fast delivery",
  ),
  NEXT_PUBLIC_THEME_COLOR: readString("NEXT_PUBLIC_THEME_COLOR", "#000000"),
  NEXT_PUBLIC_DEFAULT_LOGO: readString("NEXT_PUBLIC_DEFAULT_LOGO", "/logo.png"),
  NEXT_PUBLIC_CONTACT_EMAIL: readString("NEXT_PUBLIC_CONTACT_EMAIL", ""),
  NEXT_PUBLIC_CONTACT_PHONE: readString("NEXT_PUBLIC_CONTACT_PHONE", ""),
  NEXT_PUBLIC_FACEBOOK_URL: readString("NEXT_PUBLIC_FACEBOOK_URL", ""),
  NEXT_PUBLIC_INSTAGRAM_URL: readString("NEXT_PUBLIC_INSTAGRAM_URL", ""),
  NEXT_PUBLIC_YOUTUBE_URL: readString("NEXT_PUBLIC_YOUTUBE_URL", ""),
  NEXT_PUBLIC_WHATSAPP_NUMBER: readString("NEXT_PUBLIC_WHATSAPP_NUMBER", ""),
  NEXT_PUBLIC_TWITTER_URL: readString("NEXT_PUBLIC_TWITTER_URL", ""),
  NEXT_PUBLIC_LINKEDIN_URL: readString("NEXT_PUBLIC_LINKEDIN_URL", ""),
  NEXT_PUBLIC_IMAGE_HOSTS: readString("NEXT_PUBLIC_IMAGE_HOSTS", ""),
  NEXT_PUBLIC_META_PIXEL_ID: readString("NEXT_PUBLIC_META_PIXEL_ID", ""),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: readString(
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "",
  ),
  NEXT_PUBLIC_CLOUDINARY_IMAGE_API: readString(
    "NEXT_PUBLIC_CLOUDINARY_IMAGE_API",
    readString("CLOUDINARY_IMAGE_API", ""),
  ),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: readString(
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    readString("CLOUDINARY_CLOUD_NAME", ""),
  ),
  NEXT_PUBLIC_CLOUDINARY_PRESET: readString(
    "NEXT_PUBLIC_CLOUDINARY_PRESET",
    readString("CLOUDINARY_PRESET", ""),
  ),
};

export function requirePublic<T extends keyof PublicEnvShape>(key: T): string {
  const v = publicEnv[key];
  if (!v || (v as string).length === 0) {
    throw new Error(`❌ Missing required public env: ${String(key)}`);
  }
  return v as string;
}