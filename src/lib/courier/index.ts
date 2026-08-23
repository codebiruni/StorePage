/* eslint-disable @typescript-eslint/no-explicit-any */
import connectDb from "@/lib/connectdb";
import SiteInfo from "@/models/siteInfo.model";
import type { ICourierCredentials } from "@/interface/siteInfo.interface";

// Default base URLs match what we seed in the siteInfo schema. If the admin
// saved a different one, that wins.
export const DEFAULTS = {
  pathao: "https://api-hermes.pathao.com",
  steadfast: "https://portal.packzy.com/api/v1",
  redx: "https://openapi.redx.com.bd/v1.0.0-beta",
} as const;

export type Provider = "pathao" | "steadfast" | "redx";

/**
 * Load the courier credentials from the siteInfo document.
 *
 * Returns an empty-object fallback for tenants whose siteInfo doc has not
 * yet been seeded; the caller is expected to check the relevant fields and
 * reject with a 400 when missing.
 */
export async function loadCourierCreds(): Promise<ICourierCredentials> {
  await connectDb();
  const doc = await SiteInfo.findOne().select("courier").lean();
  return ((doc as any)?.courier ?? {}) as ICourierCredentials;
}

export function isPathaoConfigured(c: ICourierCredentials) {
  return Boolean(
    c.pathaoBaseUrl &&
      c.pathaoStoreId &&
      c.pathaoClientId &&
      c.pathaoClientSecret &&
      c.pathaoClientEmail &&
      c.pathaoClientPassword
  );
}

export function isSteadfastConfigured(c: ICourierCredentials) {
  return Boolean(c.steadfastApiKey && c.steadfastSecretKey);
}

export function isRedXConfigured(c: ICourierCredentials) {
  return Boolean(c.redxApiToken);
}

export function stripSlash(s: string) {
  return s.replace(/\/$/, "");
}

/**
 * Refreshes the Pathao access token when missing or about to expire, then
 * returns the credentials with a guaranteed non-empty `pathaoAccessToken`.
 * Throws on failure — callers should turn that into a 502 to the client.
 */
export async function ensurePathaoToken(
  creds: ICourierCredentials
): Promise<ICourierCredentials> {
  // Still valid? Pathao tokens are 5d; we conservatively refresh when less
  // than 60s remains.
  if (
    creds.pathaoAccessToken &&
    creds.pathaoTokenExpiresAt &&
    new Date(creds.pathaoTokenExpiresAt).getTime() - Date.now() > 60_000
  ) {
    return creds;
  }

  const baseUrl = stripSlash(creds.pathaoBaseUrl || DEFAULTS.pathao);
  if (!creds.pathaoClientId || !creds.pathaoClientSecret) {
    throw new Error("Pathao is not configured.");
  }

  let token: { access_token: string; refresh_token: string; expires_in: number } | null = null;

  // Prefer refresh-token grant.
  if (creds.pathaoRefreshToken) {
    token = await issuePathaoToken(`${baseUrl}/aladdin/api/v1/issue-token`, {
      client_id: creds.pathaoClientId,
      client_secret: creds.pathaoClientSecret,
      grant_type: "refresh_token",
      refresh_token: creds.pathaoRefreshToken,
    });
  }

  // Fall back to password grant.
  if (!token && creds.pathaoClientEmail && creds.pathaoClientPassword) {
    token = await issuePathaoToken(`${baseUrl}/aladdin/api/v1/issue-token`, {
      client_id: creds.pathaoClientId,
      client_secret: creds.pathaoClientSecret,
      grant_type: "password",
      username: creds.pathaoClientEmail,
      password: creds.pathaoClientPassword,
    });
  }

  if (!token) {
    throw new Error("Failed to issue Pathao access token.");
  }

  const updated: ICourierCredentials = {
    ...creds,
    pathaoAccessToken: token.access_token,
    pathaoRefreshToken: token.refresh_token,
    pathaoTokenExpiresAt: new Date(
      Date.now() + Math.max(token.expires_in - 60, 1) * 1000
    ).toISOString(),
  };

  // Persist for the next caller.
  await SiteInfo.updateOne(
    {},
    {
      $set: {
        "courier.pathaoAccessToken": updated.pathaoAccessToken,
        "courier.pathaoRefreshToken": updated.pathaoRefreshToken,
        "courier.pathaoTokenExpiresAt": updated.pathaoTokenExpiresAt,
      },
    }
  );

  return updated;
}

async function issuePathaoToken(
  url: string,
  body: Record<string, string>
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    if (!json?.access_token || !json?.refresh_token || !json?.expires_in) {
      return null;
    }
    return {
      access_token: String(json.access_token),
      refresh_token: String(json.refresh_token),
      expires_in: Number(json.expires_in),
    };
  } catch (e) {
    console.error("issuePathaoToken network error", e);
    return null;
  }
}

/**
 * Resolve the recipient phone to the 11-digit form Pathao expects (no +88,
 * no spaces). Falls back to the raw input if it's already 11 digits.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits.slice(2);
  if (digits.startsWith("88")) return digits.slice(2);
  return digits;
}
