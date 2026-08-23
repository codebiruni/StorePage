import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import OrderModel from "@/models/order.model";
import { auth } from "@/lib/auth";
import {
  loadCourierCreds,
  isSteadfastConfigured,
  stripSlash,
  DEFAULTS,
} from "@/lib/courier";
import {
  codAmount,
  itemCount,
  itemDescription,
  type CourierPushResult,
} from "@/lib/courier/orderPayload";

// Steadfast push — now backed by credentials stored in siteInfo. The hard-
// coded keys that lived here previously were a security hole (committable,
// shared by every tenant) and have been removed in favour of the
// /dashboard/account/courier-api settings page.

interface SteadfastCreateOrderRequest {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  alternative_phone?: string;
  recipient_email?: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
  total_lot?: number;
  delivery_type?: 0 | 1;
}

interface SteadfastCreateOrderEnvelope {
  status: number;
  message: string;
  consignment?: {
    consignment_id: number;
    invoice: string;
    tracking_code: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    status: string;
    note?: string;
    created_at?: string;
    updated_at?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    await auth();
    await connectDb();

    const parsed = await request.json().catch(() => ({} as { orderId?: string }));
    const body = parsed as { orderId?: string };
    if (!body.orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required." },
        { status: 400 }
      );
    }

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

    const order = await OrderModel.findById(body.orderId).populate("products");
    if (!order || order.isDeleted) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    const baseUrl = stripSlash(creds.steadfastBaseUrl || DEFAULTS.steadfast);
    const payload: SteadfastCreateOrderRequest = {
      invoice: order.orderId,
      recipient_name: order.name,
      recipient_phone: order.number,
      recipient_address: order.address,
      cod_amount: codAmount(order),
      note: order.note || `Order ${order.orderId}`,
      item_description: itemDescription(order),
      total_lot: itemCount(order),
      delivery_type: 0,
    };

    const res = await fetch(`${baseUrl}/create_order`, {
      method: "POST",
      headers: {
        "Api-Key": creds.steadfastApiKey!,
        "Secret-Key": creds.steadfastSecretKey!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json: SteadfastCreateOrderEnvelope;
    try {
      json = text ? JSON.parse(text) : ({} as SteadfastCreateOrderEnvelope);
    } catch {
      json = { status: res.status, message: text || "Unknown response" };
    }

    if (!res.ok || json.status !== 200 || !json.consignment) {
      return NextResponse.json(
        {
          success: false,
          message: json.message || `Steadfast returned HTTP ${res.status}.`,
          data: json,
        },
        { status: 502 }
      );
    }

    const updated = await OrderModel.findByIdAndUpdate(
      order._id,
      {
        trackingId: json.consignment.tracking_code,
        orderStatus: "confirmed",
      },
      { new: true }
    );

    const result: CourierPushResult = {
      orderId: String(order._id),
      orderNumber: order.orderId,
      status: "success",
      courierName: "steadfast",
      consignmentId: json.consignment.consignment_id,
      trackingCode: json.consignment.tracking_code,
      message: "Order created in Steadfast.",
      raw: json,
      httpStatus: 200,
    };

    return NextResponse.json({
      success: true,
      message: "Order created in Steadfast.",
      data: { order: updated, result, steadfast: json.consignment },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    await auth();
    await connectDb();

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

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

    const baseUrl = stripSlash(creds.steadfastBaseUrl || DEFAULTS.steadfast);
    const headers = {
      "Api-Key": creds.steadfastApiKey!,
      "Secret-Key": creds.steadfastSecretKey!,
      "Content-Type": "application/json",
    } as const;

    switch (action) {
      case "balance":
        return await fetchAndForward(`${baseUrl}/get_balance`, { method: "GET", headers });
      case "status": {
        const trackingCode = url.searchParams.get("trackingCode");
        const invoice = url.searchParams.get("invoice");
        const consignmentId = url.searchParams.get("consignmentId");
        if (trackingCode) {
          return await fetchAndForward(
            `${baseUrl}/status_by_trackingcode/${encodeURIComponent(trackingCode)}`,
            { method: "GET", headers }
          );
        }
        if (invoice) {
          return await fetchAndForward(
            `${baseUrl}/status_by_invoice/${encodeURIComponent(invoice)}`,
            { method: "GET", headers }
          );
        }
        if (consignmentId) {
          return await fetchAndForward(
            `${baseUrl}/status_by_cid/${encodeURIComponent(consignmentId)}`,
            { method: "GET", headers }
          );
        }
        return NextResponse.json(
          { success: false, message: "Provide trackingCode, invoice, or consignmentId." },
          { status: 400 }
        );
      }
      default:
        return NextResponse.json(
          { success: false, message: "Valid action parameter is required." },
          { status: 400 }
        );
    }
  } catch (err) {
    return errorResponse(err);
  }
}

async function fetchAndForward(
  url: string,
  init: { method: string; headers: Record<string, string> }
) {
  const res = await fetch(url, init);
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
  console.error("steadfast-order error:", err);
  return NextResponse.json({ success: false, message: msg }, { status });
}
