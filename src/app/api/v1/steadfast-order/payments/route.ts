import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  loadCourierCreds,
  isSteadfastConfigured,
  stripSlash,
  DEFAULTS,
} from "@/lib/courier";

// GET /api/v1/steadfast-order/payments
// Proxies Steadfast's GET /payments. Supports the optional pagination params
// the upstream accepts (e.g. `page`, `per_page`) by forwarding the raw query
// string.
export async function GET(request: NextRequest) {
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
    const search = request.nextUrl.search ?? "";
    const res = await fetch(`${baseUrl}/payments${search}`, {
      method: "GET",
      headers: {
        "Api-Key": creds.steadfastApiKey!,
        "Secret-Key": creds.steadfastSecretKey!,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    return NextResponse.json({ success: res.ok, data }, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    const status = msg.toLowerCase().includes("not authorized") ? 401 : 500;
    console.error("steadfast payments error:", err);
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}