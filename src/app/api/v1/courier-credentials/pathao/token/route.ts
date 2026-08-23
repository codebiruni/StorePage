/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import { auth } from "@/lib/auth";
import SiteInfo from "@/models/siteInfo.model";

// Issues a fresh Pathao access token using the credentials stored in
// siteInfo.courier. Saves the access_token + refresh_token + expiry back to
// the same doc. Pathao tokens last 5 days (expires_in: 432000) so we cache
// the expiry and only re-issue when missing or expired.

interface PathaoTokenSuccess {
  token_type: "Bearer";
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

interface PathaoErrorEnvelope {
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  type?: string;
  code?: number;
}

export async function POST(request: NextRequest) {
  void request;

  try {
    await auth();
    await connectDb();

    const doc = await SiteInfo.findOne().select("courier");
    if (!doc) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Site info not configured yet. Set up your store profile first.",
        },
        { status: 404 }
      );
    }

    const courier = doc.courier ?? ({} as any);
    const baseUrl = stripSlash(courier.pathaoBaseUrl || "https://api-hermes.pathao.com");
    const clientId = courier.pathaoClientId;
    const clientSecret = courier.pathaoClientSecret;
    const username = courier.pathaoClientEmail;
    const password = courier.pathaoClientPassword;
    const refreshToken = courier.pathaoRefreshToken;

    if (!clientId || !clientSecret || !username || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing Pathao credentials. Fill Client ID, Client Secret, Email, and Password first.",
        },
        { status: 400 }
      );
    }

    // Try refresh-token first if we already have one — avoids spending the
    // password grant when the old access token is still alive.
    let tokenData: PathaoTokenSuccess | null = null;
    if (refreshToken) {
      tokenData = await tryIssueToken({
        url: `${baseUrl}/aladdin/api/v1/issue-token`,
        body: {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        },
      });
    }

    // Fall back to password grant when we have no refresh token or refresh
    // token is no longer valid.
    if (!tokenData) {
      tokenData = await tryIssueToken({
        url: `${baseUrl}/aladdin/api/v1/issue-token`,
        body: {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "password",
          username,
          password,
        },
      });
    }

    if (!tokenData) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Could not issue a Pathao access token. Double-check Client ID/Secret and login email/password.",
        },
        { status: 502 }
      );
    }

    // Pathao returns expires_in in seconds (default 432000 = 5 days).
    // Subtract a small safety buffer so we never use a token Pathao considers
    // already expired.
    const expiresAt = new Date(
      Date.now() + Math.max(tokenData.expires_in - 60, 1) * 1000
    ).toISOString();

    doc.courier = {
      ...courier,
      pathaoAccessToken: tokenData.access_token,
      pathaoRefreshToken: tokenData.refresh_token,
      pathaoTokenExpiresAt: expiresAt,
    };
    await doc.save();

    return NextResponse.json({
      success: true,
      message: "Pathao access token issued.",
      data: {
        courier: {
          pathaoAccessToken: doc.courier.pathaoAccessToken,
          pathaoRefreshToken: doc.courier.pathaoRefreshToken,
          pathaoTokenExpiresAt: doc.courier.pathaoTokenExpiresAt,
        },
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

async function tryIssueToken({
  url,
  body,
}: {
  url: string;
  body: Record<string, string>;
}): Promise<PathaoTokenSuccess | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Pathao issue-token failed", res.status, text);
      return null;
    }
    const json = (await res.json()) as PathaoTokenSuccess | PathaoErrorEnvelope;
    if (!isSuccessShape(json)) {
      console.error("Pathao issue-token rejected payload", json);
      return null;
    }
    return json;
  } catch (e) {
    console.error("Pathao issue-token network error", e);
    return null;
  }
}

function isSuccessShape(v: any): v is PathaoTokenSuccess {
  return (
    !!v &&
    typeof v === "object" &&
    typeof v.access_token === "string" &&
    typeof v.refresh_token === "string" &&
    typeof v.expires_in === "number"
  );
}

function stripSlash(s: string) {
  return s.replace(/\/$/, "");
}

function errorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : "Internal server error";
  const status = msg.toLowerCase().includes("not authorized") ? 401 : 500;
  console.error("pathao token route error:", err);
  return NextResponse.json({ success: false, message: msg }, { status });
}