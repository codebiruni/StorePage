/**
 * Centralized, typed env loader.
 *
 * Single source of truth for environment variables across the StorePage
 * multi-tenant codebase. Throws early at boot if a *required* server-side
 * key is missing, so we never discover misconfiguration inside a request.
 *
 * IMPORTANT: This module imports `requireString` calls at the top level, so
 * it must NEVER be bundled to the browser. Only `'use server'` modules
 * (Server Components, Route Handlers, `lib/*.ts` called from those) may
 * import `env` from here.
 *
 * Client-side code that needs branding/URL defaults must import `publicEnv`
 * from `@/lib/publicEnv` instead — that module is safe to ship to the
 * browser because it doesn't reference any server-only key.
 *
 * Convention:
 *   - `process.env.X`            -> server-only secrets (DB URIs, JWT secrets,
 *                                   API keys, email credentials, Gemini key).
 *   - `NEXT_PUBLIC_X`            -> values that must reach the browser bundle
 *                                   (site URL, brand name, public analytics IDs,
 *                                   public image hosts). See `publicEnv.ts`.
 *
 * Reading from this module is preferred over touching `process.env` directly,
 * so we can refactor the naming convention centrally later.
 */

// Re-export for server callers that already imported `publicEnv` from
// `@/lib/env`. The actual definition lives in `./publicEnv` so client bundles
// don't drag the server-only `requireString` calls below into the browser.
export { publicEnv, requirePublic } from "./publicEnv";

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

  // --- Cloudflare R2 (server) ---
  // New image uploads go through R2 (S3-compatible) and are served from the
  // custom CDN domain below. Existing Cloudinary URLs in the DB are left
  // untouched and continue to render on the front-end.
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_DOMAIN: string;

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

  // Cloudflare R2 — new image upload pipeline. Keys are server-only secrets.
  // R2_PUBLIC_DOMAIN is the custom CDN domain that fronts the bucket; it is
  // also needed client-side for rendering, so a NEXT_PUBLIC_ mirror is read
  // in publicEnv (see below). Here we keep the server copy for signing.
  R2_ACCOUNT_ID: readString("R2_ACCOUNT_ID", ""),
  R2_ACCESS_KEY_ID: readString("R2_ACCESS_KEY_ID", ""),
  R2_SECRET_ACCESS_KEY: readString("R2_SECRET_ACCESS_KEY", ""),
  R2_BUCKET_NAME: readString("R2_BUCKET_NAME", "client-brandx-assets"),
  R2_PUBLIC_DOMAIN: readString(
    "R2_PUBLIC_DOMAIN",
    "https://storepage.codebiruni.com",
  ),

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
