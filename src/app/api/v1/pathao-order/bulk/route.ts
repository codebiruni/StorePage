import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import OrderModel from "@/models/order.model";
import { auth } from "@/lib/auth";
import {
  loadCourierCreds,
  isPathaoConfigured,
  ensurePathaoToken,
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

// Per Pathao docs (Create a Bulk Order):
//   POST {base_url}/aladdin/api/v1/orders/bulk
//   body: { orders: [ PathaoOrderRequest, ... ] }
//   Success: HTTP 202 with { message, type, code, data: true }
//
// Pathao does NOT return per-order consignment_ids in the bulk response -
// the request is queued. So for a result per order we still loop and call
// the single POST endpoint. We use the bulk endpoint only if every order
// has a real city/zone id (rare); otherwise we fall back to single pushes
// for reliable per-order feedback.

interface PathaoOrderRequest {
  store_id: number;
  merchant_order_id: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  delivery_type: 48 | 12;
  item_type: 1 | 2;
  special_instruction?: string;
  item_quantity: number;
  item_weight: string;
  amount_to_collect: number;
  item_description: string;
}

interface PathaoOrderEnvelope {
  message: string;
  type?: string;
  data?: {
    consignment_id: string;
    merchant_order_id?: string;
  };
}

const clamp = (s: string, min: number, max: number): string => {
  const trimmed = (s ?? "").trim();
  if (trimmed.length < min) return trimmed.padEnd(min, " ");
  return trimmed.slice(0, max);
};

const buildPathaoPayload = (
  order: IOrder,
  storeId: number
): PathaoOrderRequest => ({
  store_id: storeId,
  merchant_order_id: order.orderId,
  recipient_name: clamp(order.name, 3, 100),
  recipient_phone: normalizePhone(order.number),
  recipient_address: clamp(order.address, 10, 220),
  delivery_type: 48,
  item_type: 2,
  special_instruction: order.note,
  item_quantity: Math.max(1, Math.round(itemCount(order))),
  item_weight: "0.5",
  amount_to_collect: Math.round(codAmount(order)),
  item_description: itemDescription(order),
});

const parsePathao = (text: string): PathaoOrderEnvelope => {
  if (!text) return { message: "Unknown response" };
  try {
    return JSON.parse(text) as PathaoOrderEnvelope;
  } catch {
    return { message: text };
  }
};

export async function POST(request: NextRequest) {
  try {
    await auth();
    await connectDb();

    const body = await request.json();
    const orderIds: unknown = body?.orderIds;
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
    if (!isPathaoConfigured(creds)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pathao is not configured. Fill in store + client + access credentials in Courier API settings.",
        },
        { status: 412 }
      );
    }
    if (!creds.pathaoEnabled) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pathao integration is disabled. Toggle Enable inside Courier API settings.",
        },
        { status: 412 }
      );
    }

    let token;
    try {
      token = await ensurePathaoToken(creds);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          message:
            err instanceof Error
              ? err.message
              : "Pathao access token could not be obtained.",
        },
        { status: 502 }
      );
    }
    if (!token.pathaoAccessToken) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pathao access token could not be obtained. Verify client credentials and try Generate Access Token.",
        },
        { status: 502 }
      );
    }

    const orders = await fetchActiveOrders(orderIds);
    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid orders found." },
        { status: 404 }
      );
    }

    const baseUrl = stripSlash(creds.pathaoBaseUrl || DEFAULTS.pathao);
    const storeId = Number(creds.pathaoStoreId);
    const headers = {
      Authorization: `Bearer ${token.pathaoAccessToken}`,
      "Content-Type": "application/json",
    };

    const results: CourierPushResult[] = [];
    for (const order of orders) {
      const payload = buildPathaoPayload(order as unknown as IOrder, storeId);
      try {
        const res = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        const json = parsePathao(text);

        if (
          res.ok &&
          json.type !== "error" &&
          json.data?.consignment_id
        ) {
          await OrderModel.findByIdAndUpdate(order._id, {
            trackingId: json.data.consignment_id,
            orderStatus: "confirmed",
          });
          results.push({
            orderId: String(order._id),
            orderNumber: order.orderId,
            status: "success",
            courierName: "pathao",
            consignmentId: json.data.consignment_id,
            trackingCode: json.data.consignment_id,
            message: json.message || "Order created in Pathao.",
            raw: json,
            httpStatus: 200,
          });
        } else {
          console.error("pathao bulk order upstream error", {
            httpStatus: res.status,
            body: json,
            sent: payload,
          });
          results.push({
            orderId: String(order._id),
            orderNumber: order.orderId,
            status: "error",
            courierName: "pathao",
            message: json.message || `HTTP ${res.status}`,
            raw: json,
            httpStatus: res.status,
          });
        }
      } catch (err) {
        console.error("pathao bulk order network error", err);
        results.push({
          orderId: String(order._id),
          orderNumber: order.orderId,
          status: "error",
          courierName: "pathao",
          message: err instanceof Error ? err.message : "Unknown error",
          httpStatus: 500,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk order processed. ${results.filter((r) => r.status === "success").length} successful, ${results.filter((r) => r.status !== "success").length} failed.`,
      data: buildCourierResponse(results),
    });
  } catch (err) {
    console.error("pathao bulk order error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Pathao bulk order failed.",
      },
      { status: 500 }
    );
  }
}
