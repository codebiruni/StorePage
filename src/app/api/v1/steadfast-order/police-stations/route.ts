import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  loadCourierCreds,
  isSteadfastConfigured,
  stripSlash,
  DEFAULTS,
} from "@/lib/courier";

// GET /api/v1/steadfast-order/police-stations
// Proxies Steadfast's GET /police_stations so the dashboard can populate
// recipient police-station dropdowns without exposing API keys to the client.
export async function GET() {
  try {
    await auth();

    const creds = await loadCourierCreds();
    if (!isSteadfastConfigured(creds)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Steadfast is not configured. Add API Key + Secret Key in Courier API settings.",
        },
        { status: 412 }
      );
    }
    if (!creds.steadfastEnabled) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Steadfast integration is disabled. Toggle Enable inside Courier API settings.",
        },
        { status: 412 }
      );
    }

    const baseUrl = stripSlash(creds.steadfastBaseUrl || DEFAULTS.steadfast);
    const res = await fetch(`${baseUrl}/police_stations`, {
      method: "GET",
      headers: steadfastHeaders(creds),
      cache: "no-store",
    });

    return forwardSteadfastResponse(res);
  } catch (err) {
    return errorResponse(err);
  }
}

function steadfastHeaders(creds: { steadfastApiKey?: string; steadfastSecretKey?: string }) {
  return {
    "Api-Key": creds.steadfastApiKey!,
    "Secret-Key": creds.steadfastSecretKey!,
    "Content-Type": "application/json",
  } as Record<string, string>;
}

async function forwardSteadfastResponse(res: Response) {
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return NextResponse.json({ success: res.ok, data }, { status: res.status });
}

function errorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : "Internal server error";
  const status = msg.toLowerCase().includes("not authorized") ? 401 : 500;
  console.error("steadfast police-stations error:", err);
  return NextResponse.json({ success: false, message: msg }, { status });
}