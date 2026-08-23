import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  loadCourierCreds,
  isSteadfastConfigured,
  stripSlash,
  DEFAULTS,
} from "@/lib/courier";

// POST /api/v1/steadfast-order/return-request
// Body: { consignment_id?, invoice?, tracking_code?, reason? }
// Exactly one of consignment_id / invoice / tracking_code is required by
// Steadfast's docs ("consignment_id or invoice or tracking_code - Required").
interface CreateReturnRequestBody {
  consignment_id?: number | string;
  invoice?: string;
  tracking_code?: string;
  reason?: string;
}

export async function POST(request: NextRequest) {
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

    const body = (await request.json().catch(() => ({}))) as CreateReturnRequestBody;
    const identifierCount = [
      body.consignment_id !== undefined && body.consignment_id !== null && body.consignment_id !== "",
      body.invoice !== undefined && body.invoice !== "",
      body.tracking_code !== undefined && body.tracking_code !== "",
    ].filter(Boolean).length;

    if (identifierCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Provide one of: consignment_id, invoice, or tracking_code.",
        },
        { status: 400 }
      );
    }
    if (identifierCount > 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Provide only one identifier: consignment_id, invoice, or tracking_code.",
        },
        { status: 400 }
      );
    }

    // Forward only the fields that were actually supplied. Steadfast's docs
    // accept the optional `reason` string verbatim.
    const payload: Record<string, unknown> = {};
    if (body.consignment_id !== undefined) payload.consignment_id = body.consignment_id;
    if (body.invoice !== undefined) payload.invoice = body.invoice;
    if (body.tracking_code !== undefined) payload.tracking_code = body.tracking_code;
    if (body.reason !== undefined && body.reason !== "") payload.reason = body.reason;

    const baseUrl = stripSlash(creds.steadfastBaseUrl || DEFAULTS.steadfast);
    const res = await fetch(`${baseUrl}/create_return_request`, {
      method: "POST",
      headers: {
        "Api-Key": creds.steadfastApiKey!,
        "Secret-Key": creds.steadfastSecretKey!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    return NextResponse.json(
      {
        success: res.ok,
        message: res.ok ? "Return request created in Steadfast." : "Steadfast rejected the return request.",
        data,
      },
      { status: res.status }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    const status = msg.toLowerCase().includes("not authorized") ? 401 : 500;
    console.error("steadfast create_return_request error:", err);
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}