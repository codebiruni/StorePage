import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import OrderModel from "@/models/order.model";
import { auth } from "@/lib/auth";
import {
  loadCourierCreds,
  isSteadfastConfigured,
  normalizePhone,
  stripSlash,
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

interface BulkOrderItem {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
  total_lot?: number;
  delivery_type?: 0 | 1;
}

interface SteadfastBulkOrderResponse {
  invoice: string;
  recipient_name: string;
  recipient_address: string;
  recipient_phone: string;
  cod_amount: string;
  note: string | null;
  consignment_id: number | null;
  tracking_code: string | null;
  status: "success" | "error";
}

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
    if (orderIds.length > 500) {
      return NextResponse.json(
        { success: false, message: "Maximum 500 orders allowed per bulk request." },
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

    const orders = await fetchActiveOrders(orderIds);
    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid orders found." },
        { status: 404 }
      );
    }

    const bulkOrders: BulkOrderItem[] = orders.map((order) => ({
      invoice: order.orderId,
      // Steadfast requires recipient_name ≤ 100 chars and recipient_address
      // ≤ 250 chars; clamp defensively so a long form input doesn't 502.
      recipient_name: clamp(order.name, 100),
      recipient_phone: normalizePhone(order.number),
      recipient_address: clamp(order.address, 250),
      cod_amount: codAmount(order),
      note: order.note || `Order ${order.orderId}`,
      item_description: itemDescription(order),
      total_lot: itemCount(order),
      delivery_type: 0,
    }));

    const baseUrl = stripSlash(creds.steadfastBaseUrl || DEFAULTS.steadfast);
    const response = await fetch(`${baseUrl}/create_order/bulk-order`, {
      method: "POST",
      headers: {
        "Api-Key": creds.steadfastApiKey!,
        "Secret-Key": creds.steadfastSecretKey!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: JSON.stringify(bulkOrders) }),
    });

    const raw = await response.text();
    // Steadfast returns non-2xx responses as JSON like
    // `{"status":401,"message":"Account is not active!"}` — handle that
    // explicitly so the client gets a useful message instead of a generic
    // "non-JSON" 502.
    const parsed = raw ? safeJson(raw) : null;
    if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
      const envelope = parsed as { status?: number; message?: string };
      const upstreamMessage = envelope.message || `Steadfast returned HTTP ${response.status}.`;
      console.error("steadfast bulk upstream error:", response.status, envelope);
      return NextResponse.json(
        {
          success: false,
          message: upstreamMessage,
          data: envelope,
        },
        { status: response.status || 502 }
      );
    }

    let steadfastResponses: SteadfastBulkOrderResponse[] = [];
    if (Array.isArray(parsed)) {
      steadfastResponses = parsed;
    } else {
      console.error("steadfast bulk non-JSON response:", response.status, raw);
      return NextResponse.json(
        {
          success: false,
          message: `Steadfast bulk returned non-JSON response (HTTP ${response.status}).`,
          data: raw,
        },
        { status: 502 }
      );
    }

    const results: CourierPushResult[] = [];
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const sf = steadfastResponses[i];
      if (sf && sf.status === "success" && sf.tracking_code && sf.consignment_id) {
        await OrderModel.findByIdAndUpdate(order._id, {
          trackingId: sf.tracking_code,
          orderStatus: "confirmed",
        });
        results.push({
          orderId: String(order._id),
          orderNumber: order.orderId,
          status: "success",
          courierName: "steadfast",
          consignmentId: sf.consignment_id,
          trackingCode: sf.tracking_code,
          message: "Order created in Steadfast.",
          raw: sf,
          httpStatus: 200,
        });
      } else {
        results.push({
          orderId: String(order._id),
          orderNumber: order.orderId,
          status: "error",
          courierName: "steadfast",
          message: sf ? "Steadfast rejected this order." : "Missing response from Steadfast.",
          raw: sf,
          httpStatus: 502,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk order processed. ${results.filter((r) => r.status === "success").length} successful, ${results.filter((r) => r.status !== "success").length} failed.`,
      data: buildCourierResponse(results),
    });
  } catch (err) {
    console.error("steadfast bulk order error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Failed to create bulk Steadfast orders.",
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

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
