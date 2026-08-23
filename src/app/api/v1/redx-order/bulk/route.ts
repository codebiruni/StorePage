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
  fetchActiveOrders,
  buildCourierResponse,
  codAmount,
  itemCount,
  itemDescription,
  type CourierPushResult,
} from "@/lib/courier/orderPayload";
import type { IOrder } from "@/interface/order.interface";

// RedX bulk push. Sends one parcel create call per order so a single bad row
// doesn't take down the rest of the batch. Tracking, returns, etc. are
// handled inside RedX — we only push.

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
  success?: boolean;
  data?: { tracking_id?: string; consignment_id?: string };
  errors?: unknown;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    await auth();
    await connectDb();

    const body = (await request.json().catch(() => ({}))) as { orderIds?: unknown };
    const orderIds = body?.orderIds;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Order IDs array is required." },
        { status: 400 }
      );
    }
    if (orderIds.length > 200) {
      return NextResponse.json(
        { success: false, message: "Maximum 200 orders allowed per bulk request." },
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

    const orders = await fetchActiveOrders(orderIds as string[]);
    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid orders found." },
        { status: 404 }
      );
    }

    const baseUrl = stripSlash(creds.redxBaseUrl || DEFAULTS.redx);
    const headers = {
      Authorization: `Bearer ${creds.redxApiToken}`,
      "Content-Type": "application/json",
    } as const;

    const results: CourierPushResult[] = [];
    for (const order of orders) {
      const payload: RedXParcelRequest = {
        customer_name: clamp(order.name, 100),
        customer_phone: normalizePhone(order.number),
        customer_address: clamp(order.address, 250),
        cash_collection_amount: codAmount(order).toFixed(2),
        parcel_weight: "500",
        value: order.grandTotal.toFixed(2),
        merchant_invoice_id: order.orderId,
        instruction: order.note || undefined,
        pickup_store_id: creds.redxStoreId,
        parcel_details_json: buildParcelDetails(order),
      };

      try {
        const res = await fetch(`${baseUrl}/parcel`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        const json = parseRedX(text);

        if (!res.ok) {
          console.error("redx bulk upstream error:", res.status, json);
          results.push({
            orderId: String(order._id),
            orderNumber: order.orderId,
            status: "error",
            courierName: "redx",
            message: json.message || `RedX returned HTTP ${res.status}.`,
            raw: json,
            httpStatus: res.status,
          });
          continue;
        }

        const trackingId = String(
          json.tracking_id ?? json.data?.tracking_id ?? ""
        );
        if (!trackingId) {
          results.push({
            orderId: String(order._id),
            orderNumber: order.orderId,
            status: "error",
            courierName: "redx",
            message: json.message || "RedX did not return a tracking_id.",
            raw: json,
            httpStatus: 502,
          });
          continue;
        }

        await OrderModel.findByIdAndUpdate(order._id, {
          trackingId,
          orderStatus: "confirmed",
        });
        results.push({
          orderId: String(order._id),
          orderNumber: order.orderId,
          status: "success",
          courierName: "redx",
          consignmentId: trackingId,
          trackingCode: trackingId,
          message: json.message || "Order created in RedX.",
          raw: json,
          httpStatus: res.status,
        });
      } catch (err) {
        console.error("redx bulk per-order error:", err);
        results.push({
          orderId: String(order._id),
          orderNumber: order.orderId,
          status: "error",
          courierName: "redx",
          message: err instanceof Error ? err.message : "Unknown error",
          httpStatus: 500,
        });
      }
    }

    const successful = results.filter((r) => r.status === "success").length;
    const failed = results.length - successful;
    return NextResponse.json({
      success: true,
      message: `Bulk processed. ${successful} successful, ${failed} failed.`,
      data: buildCourierResponse(results),
    });
  } catch (err) {
    console.error("redx bulk order error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "RedX bulk order failed.",
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
    return [{ name: "Item", value: 1 }];
  }
  const names = description.split(",").map((s) => s.trim()).filter(Boolean);
  const count = itemCount(order) || names.length;
  return names.map((name) => ({ name, value: count }));
}
