/**
 * Centralized, typed env loader.
 *
 * Single source of truth for environment variables across the StorePage
 * multi-tenant codebase. Throws early at boot if a *required* server-side
 * key is missing, so we never discover misconfiguration inside a request.
 *
 * Convention:
 *   - `process.env.X`            -> server-only secrets (DB URIs, JWT secrets,
 *                                   API keys, email credentials, Gemini key).
 *   - `NEXT_PUBLIC_X`            -> values that must reach the browser bundle
 *                                   (site URL, brand name, public analytics IDs,
 *                                   public image hosts).
 *
 * Reading from this module is preferred over touching `process.env` directly,
 * so we can refactor the naming convention centrally later.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type EnvShape = {
  // --- Infra (server) ---
  MONGODB_URI: string;
  NODE_ENV: "development" | "production" | "test";

  // --- Auth (server) ---
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // --- Email (server) ---
  APP_EMAIL: string;
  APP_PASS: string;
  EMAIL_HOST: string;
  EMAIL_PORT: string;
  SUPPORT_EMAIL: string;
  APP_URL: string;

  // --- SMS (server) ---
  BULK_API_URL: string;
  BULK_API_KEY: string;
  BULK_SENDER_ID: string;

  // --- Courier (server) ---
  BDCOURIER_API_URL: string;
  BDCOURIER_APIKEY: string;

  // --- Cloudinary (server) ---
  CLOUDINARY_IMAGE_API: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_PRESET: string;

  // --- Chatbot (server) ---
  GEMINI_API_KEY: string;

  // --- Analytics + Meta (server-only secrets) ---
  META_PIXEL_ID?: string;
  META_CONVERSIONS_API_TOKEN?: string;
  GA_MEASUREMENT_ID?: string;

  // --- PWA flags ---
  PWA_REGISTER: string;
  PWA_SKIP_WAITING: string;
  ALLOW_ALL_IMAGE_HOSTS: string;
};

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

function requireString(key: string): string {
  const v = process.env[key];
  if (!v || v.length === 0) {
    throw new Error(
      `❌ Missing required environment variable: ${key}. ` +
        `Add it to .env (see .env.example) before starting the server.`,
    );
  }
  return v;
}

const nodeEnvRaw = process.env.NODE_ENV ?? "development";
const nodeEnv: EnvShape["NODE_ENV"] =
  nodeEnvRaw === "production" || nodeEnvRaw === "test"
    ? nodeEnvRaw
    : "development";

export const env: EnvShape = {
  // Infra
  MONGODB_URI: requireString("MONGODB_URI"),
  NODE_ENV: nodeEnv,

  // Auth
  JWT_ACCESS_SECRET: requireString("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: requireString("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRES_IN: readString("JWT_ACCESS_EXPIRES_IN", "5h"),
  JWT_REFRESH_EXPIRES_IN: readString("JWT_REFRESH_EXPIRES_IN", "90d"),

  // Email
  APP_EMAIL: readString("APP_EMAIL"),
  APP_PASS: readString("APP_PASS"),
  EMAIL_HOST: readString("EMAIL_HOST", "smtp.gmail.com"),
  EMAIL_PORT: readString("EMAIL_PORT", "587"),
  SUPPORT_EMAIL: readString("SUPPORT_EMAIL", "support@example.com"),
  APP_URL: readString("APP_URL", "http://localhost:3000"),

  // SMS
  BULK_API_URL: readString("BULK_API_URL"),
  BULK_API_KEY: readString("BULK_API_KEY"),
  BULK_SENDER_ID: readString("BULK_SENDER_ID"),

  // Courier
  BDCOURIER_API_URL: readString("BDCOURIER_API_URL"),
  BDCOURIER_APIKEY: readString("BDCOURIER_APIKEY"),

  // Cloudinary
  CLOUDINARY_IMAGE_API: readString(
    "CLOUDINARY_IMAGE_API",
    "https://api.cloudinary.com/v1_1/demo/image/upload",
  ),
  CLOUDINARY_CLOUD_NAME: readString("CLOUDINARY_CLOUD_NAME", "demo"),
  CLOUDINARY_PRESET: readString("CLOUDINARY_PRESET", ""),

  // Chatbot
  GEMINI_API_KEY: readString("GEMINI_API_KEY"),

  // Analytics
  META_PIXEL_ID: readString("META_PIXEL_ID", ""),
  META_CONVERSIONS_API_TOKEN: readString(
    "META_CONVERSIONS_API_TOKEN",
    "",
  ),
  GA_MEASUREMENT_ID: readString("GA_MEASUREMENT_ID", ""),

  // PWA flags
  PWA_REGISTER: readString("PWA_REGISTER", "true"),
  PWA_SKIP_WAITING: readString("PWA_SKIP_WAITING", "true"),
  ALLOW_ALL_IMAGE_HOSTS: readString("ALLOW_ALL_IMAGE_HOSTS", "false"),
};

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
