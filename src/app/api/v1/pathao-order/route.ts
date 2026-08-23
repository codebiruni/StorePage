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
  codAmount,
  itemCount,
  itemDescription,
  type CourierPushResult,
} from "@/lib/courier/orderPayload";

// Per Pathao docs:
//   recipient_name      - string, length 3-100
//   recipient_phone     - string, length 11
//   recipient_address   - string, length 10-220
//   delivery_type       - 48 (Normal) or 12 (On Demand)
//   item_type           - 1 (Document) or 2 (Parcel)
//   item_quantity       - integer
//   item_weight         - float/string, 0.5-10 kg
//   amount_to_collect   - integer (0 for prepaid)
// recipient_city/zone/area are optional - leave them out if we do not have
// real ids and Pathao will auto-populate from recipient_address.

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
    order_status?: string;
    delivery_fee?: number;
  };
}

const clamp = (s: string, min: number, max: number): string => {
  const trimmed = (s ?? "").trim();
  if (trimmed.length < min) return trimmed.padEnd(min, " ");
  return trimmed.slice(0, max);
};

export async function POST(request: NextRequest) {
  try {
    await auth();
    await connectDb();

    const body = (await request.json().catch(() => ({}))) as {
      orderId?: string;
    };
    if (!body.orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required." },
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

    const order = await OrderModel.findById(body.orderId).populate("products");
    if (!order || order.isDeleted) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    const baseUrl = stripSlash(creds.pathaoBaseUrl || DEFAULTS.pathao);
    const payload: PathaoOrderRequest = {
      store_id: Number(creds.pathaoStoreId),
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
    };

    const res = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.pathaoAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json: PathaoOrderEnvelope;
    try {
      json = text ? JSON.parse(text) : ({} as PathaoOrderEnvelope);
    } catch {
      json = { message: text || "Unknown response" };
    }

    if (!res.ok || json.type === "error" || !json.data?.consignment_id) {
      console.error("pathao single order upstream error", {
        httpStatus: res.status,
        body: json,
        sent: payload,
      });
      return NextResponse.json(
        {
          success: false,
          message: json.message || `Pathao returned HTTP ${res.status}.`,
          data: json,
        },
        { status: 502 }
      );
    }

    const updated = await OrderModel.findByIdAndUpdate(
      order._id,
      {
        trackingId: json.data.consignment_id,
        orderStatus: "confirmed",
      },
      { new: true }
    );

    const result: CourierPushResult = {
      orderId: String(order._id),
      orderNumber: order.orderId,
      status: "success",
      courierName: "pathao",
      consignmentId: json.data.consignment_id,
      trackingCode: json.data.consignment_id,
      message: "Order created in Pathao.",
      raw: json,
      httpStatus: 200,
    };

    return NextResponse.json({
      success: true,
      message: "Order created in Pathao.",
      data: { order: updated, result, pathao: json.data },
    });
  } catch (err) {
    console.error("pathao-order error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Pathao order failed.",
      },
      { status: 500 }
    );
  }
}
