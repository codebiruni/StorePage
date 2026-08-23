import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import OrderModel from "@/models/order.model";
import { auth } from "@/lib/auth";
import {
  loadCourierCreds,
  isRedXConfigured,
  stripSlash,
  normalizePhone,
  DEFAULTS,
} from "@/lib/courier";
import {
  codAmount,
  itemCount,
  itemDescription,
  type CourierPushResult,
} from "@/lib/courier/orderPayload";
import type { IOrder } from "@/interface/order.interface";

// RedX Courier API integration. Bearer-token auth via the API_TOKEN saved in
// the Courier API settings. We only push orders here — tracking, returns,
// payments, etc. are handled inside RedX itself, so this route is POST-only.

interface RedXParcelRequest {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_area?: string;
  delivery_area_id?: number;
  cash_collection_amount: string;
  parcel_weight: string;
  value: string;
  merchant_invoice_id?: string;
  instruction?: string;
  pickup_store_id?: number | string;
  parcel_details_json?: Array<{ name: string; category?: string; value: number }>;
}

interface RedXParcelResponse {
  tracking_id?: string;
  message?: string;
  // Legacy wrappers some RedX responses use.
  success?: boolean;
  data?: { tracking_id?: string; consignment_id?: string };
  errors?: unknown;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    await auth();
    await connectDb();

    const body = (await request.json().catch(() => ({}))) as { orderId?: string };
    if (!body.orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required." },
        { status: 400 }
      );
    }

    const creds = await loadCourierCreds();
    if (!isRedXConfigured(creds)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "RedX is not configured. Add API token in Courier API settings.",
        },
        { status: 412 }
      );
    }
    if (!creds.redxEnabled) {
      return NextResponse.json(
        {
          success: false,
          message:
            "RedX integration is disabled. Toggle Enable inside Courier API settings.",
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

    const payload: RedXParcelRequest = {
      customer_name: clamp(order.name, 100),
      customer_phone: normalizePhone(order.number),
      customer_address: clamp(order.address, 250),
      cash_collection_amount: codAmount(order).toFixed(2),
      // RedX docs use grams as a string. 500g is the typical sample minimum.
      parcel_weight: "500",
      value: order.grandTotal.toFixed(2),
      merchant_invoice_id: order.orderId,
      instruction: order.note || undefined,
      // pickup_store_id is saved in creds as redxStoreId.
      pickup_store_id: creds.redxStoreId,
      parcel_details_json: buildParcelDetails(order),
    };

    const baseUrl = stripSlash(creds.redxBaseUrl || DEFAULTS.redx);
    const res = await fetch(`${baseUrl}/parcel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.redxApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const json = parseRedX(text);

    if (!res.ok) {
      console.error("redx create upstream error:", res.status, json);
      return NextResponse.json(
        {
          success: false,
          message: json.message || `RedX returned HTTP ${res.status}.`,
          data: json,
        },
        { status: res.status || 502 }
      );
    }

    const trackingId = String(json.tracking_id ?? json.data?.tracking_id ?? "");
    if (!trackingId) {
      console.error("redx create missing tracking_id:", json);
      return NextResponse.json(
        {
          success: false,
          message: json.message || "RedX did not return a tracking_id.",
          data: json,
        },
        { status: 502 }
      );
    }

    const updated = await OrderModel.findByIdAndUpdate(
      order._id,
      {
        trackingId,
        orderStatus: "confirmed",
      },
      { new: true }
    );

    const result: CourierPushResult = {
      orderId: String(order._id),
      orderNumber: order.orderId,
      status: "success",
      courierName: "redx",
      // RedX only returns tracking_id; surface it as both fields on the result
      // so the courier adapter can stay uniform with Steadfast.
      consignmentId: trackingId,
      trackingCode: trackingId,
      message: json.message || "Order created in RedX.",
      raw: json,
      httpStatus: res.status,
    };

    return NextResponse.json({
      success: true,
      message: "Order created in RedX.",
      data: { order: updated, result, redx: json },
    });
  } catch (err) {
    console.error("redx-order error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "RedX order failed.",
      },
      { status: 500 }
    );
  }
}

function clamp(value: string, max: number): string {
  if (!value) return "";
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function parseRedX(text: string): RedXParcelResponse {
  if (!text) return {};
  try {
    return JSON.parse(text) as RedXParcelResponse;
  } catch {
    return { message: text };
  }
}

function buildParcelDetails(order: IOrder): Array<{
  name: string;
  category?: string;
  value: number;
}> {
  const description = itemDescription(order);
  if (!description || description === `Order ${order.orderId}`) {
    // No meaningful product names — still need at least one item per RedX's
    // documented sample, so fall back to a single placeholder entry.
    return [{ name: "Item", value: 1 }];
  }
  const names = description.split(",").map((s) => s.trim()).filter(Boolean);
  const count = itemCount(order) || names.length;
  return names.map((name) => ({ name, value: count }));
}
