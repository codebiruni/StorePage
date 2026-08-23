import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  loadCourierCreds,
  isSteadfastConfigured,
  stripSlash,
  DEFAULTS,
} from "@/lib/courier";

// GET /api/v1/steadfast-order/payments/[payment_id]
// Proxies Steadfast's GET /payments/{payment_id} and returns the payment
// detail along with its associated consignments.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ payment_id: string }> }
) {
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

    const { payment_id } = await params;
    const paymentId = payment_id?.trim();
    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: "payment_id path parameter is required." },
        { status: 400 }
      );
    }

    const baseUrl = stripSlash(creds.steadfastBaseUrl || DEFAULTS.steadfast);
    const res = await fetch(`${baseUrl}/payments/${encodeURIComponent(paymentId)}`, {
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
    console.error("steadfast payments/[payment_id] error:", err);
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}