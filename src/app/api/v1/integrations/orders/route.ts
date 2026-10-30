import mongoose from "mongoose";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import OrderModel from "@/models/order.model";
import Product from "@/models/product.model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface OrderItem {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
}

export async function POST(request: NextRequest) {
  const configuredKey = process.env.N8N_PRODUCTS_API_KEY;
  const suppliedKey = request.headers.get("x-integration-key");

  if (!configuredKey) {
    console.error("Order integration API is not configured: N8N_PRODUCTS_API_KEY is missing.");
    return json({ success: false, message: "Order integration API is not configured." }, 500);
  }
  if (!suppliedKey || !securelyMatches(suppliedKey, configuredKey)) {
    return json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const customer = body.customer as Record<string, unknown> | undefined;
    const items = Array.isArray(body.items) ? (body.items as OrderItem[]) : [];
    const externalOrderId = clean(body.externalOrderId, 120);
    const name = clean(customer?.name, 80);
    const number = clean(customer?.phone, 20);
    const address = clean(customer?.address, 500);
    const customerNote = clean(body.note, 500);

    if (!name || !number || !address || items.length === 0) {
      return json(
        { success: false, message: "customer name, phone, address, and items are required." },
        400,
      );
    }

    await connectDb();

    if (externalOrderId) {
      const existing = await OrderModel.findOne({ externalOrderId }).lean();
      if (existing) return orderResponse(existing, 200);
    }

    const normalizedItems = items.map((item) => ({
      productId: clean(item.productId, 40),
      variantId: clean(item.variantId, 40),
      quantity: positiveInteger(item.quantity),
    }));
    if (
      normalizedItems.some(
        (item) =>
          !mongoose.Types.ObjectId.isValid(item.productId) ||
          (item.variantId && !mongoose.Types.ObjectId.isValid(item.variantId)) ||
          item.quantity < 1,
      )
    ) {
      return json({ success: false, message: "Each item needs valid product, variant, and quantity values." }, 400);
    }

    const products = await Product.find({
      _id: { $in: normalizedItems.map((item) => item.productId) },
      isDeleted: false,
    });
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));
    const stockUpdates: { filter: Record<string, unknown>; quantity: number }[] = [];
    let totalAmount = 0;
    const productIds: string[] = [];

    for (const item of normalizedItems) {
      const product = productMap.get(item.productId);
      if (!product) return json({ success: false, message: `Product not found: ${item.productId}` }, 404);
      productIds.push(item.productId);

      if (item.variantId) {
        const variant = product.priceVariants.id(item.variantId);
        if (!variant) return json({ success: false, message: "Selected product variant was not found." }, 400);
        const price = variant.salePrice && variant.salePrice > 0 ? variant.salePrice : variant.regularPrice;
        const currentStock = variant.stock ?? variant.quentity ?? 0;
        if (currentStock < item.quantity) return json({ success: false, message: `${product.name} variant is out of stock.` }, 409);
        totalAmount += price * item.quantity;
        stockUpdates.push({
          filter: { _id: product._id, "priceVariants._id": item.variantId, "priceVariants.stock": { $gte: item.quantity } },
          quantity: item.quantity,
        });
      } else {
        const price = product.generalPrice.currentPrice;
        if (product.quentity < item.quantity) return json({ success: false, message: `${product.name} is out of stock.` }, 409);
        totalAmount += price * item.quantity;
        stockUpdates.push({ filter: { _id: product._id, quentity: { $gte: item.quantity } }, quantity: item.quantity });
      }
    }

    const applied: typeof stockUpdates = [];
    for (const update of stockUpdates) {
      const result = update.filter["priceVariants._id"]
        ? await Product.updateOne(update.filter, { $inc: { "priceVariants.$.stock": -update.quantity, "priceVariants.$.quentity": -update.quantity } })
        : await Product.updateOne(update.filter, { $inc: { quentity: -update.quantity, stock: -update.quantity } });
      if (result.modifiedCount !== 1) {
        await rollback(applied);
        return json({ success: false, message: "Stock changed before the order could be created. Please retry." }, 409);
      }
      applied.push(update);
    }

    const note = customerNote
      ? `[automation] ${customerNote}`
      : "[automation] Order created from Messenger";
    try {
      const order = await OrderModel.create({
        externalOrderId: externalOrderId || undefined,
        name,
        number,
        address,
        products: productIds,
        totalAmount,
        deliveryCharge: 0,
        grandTotal: totalAmount,
        paymentMethod: "cash-on-delivery",
        paymentStatus: "pending",
        orderStatus: "pending",
        note,
        source: "automation",
        isCompleted: true,
        isDelivered: false,
        isPaid: false,
        isDeleted: false,
      });
      return orderResponse(order.toObject(), 201);
    } catch (error) {
      await rollback(applied);
      if (isDuplicate(error)) {
        const existing = externalOrderId && await OrderModel.findOne({ externalOrderId }).lean();
        if (existing) return orderResponse(existing, 200);
      }
      throw error;
    }
  } catch (error) {
    console.error("POST integration order error:", error);
    return json({ success: false, message: "Order could not be created." }, 500);
  }
}

async function rollback(updates: { filter: Record<string, unknown>; quantity: number }[]) {
  for (const update of updates) {
    if (update.filter["priceVariants._id"]) {
      await Product.updateOne({ _id: update.filter._id, "priceVariants._id": update.filter["priceVariants._id"] }, { $inc: { "priceVariants.$.stock": update.quantity, "priceVariants.$.quentity": update.quantity } });
    } else {
      await Product.updateOne({ _id: update.filter._id }, { $inc: { quentity: update.quantity, stock: update.quantity } });
    }
  }
}

function orderResponse(
  order: {
    _id?: { toString(): string };
    orderId?: string;
    orderStatus?: string;
    grandTotal?: number;
  },
  status: number,
) {
  return json(
    {
      success: true,
      message: "Order created successfully.",
      data: {
        orderId: order._id?.toString(),
        reference: order.orderId,
        status: order.orderStatus,
        total: order.grandTotal,
      },
    },
    status,
  );
}
function json(data: unknown, status: number) { return NextResponse.json(data, { status }); }
function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function positiveInteger(value: unknown) { const number = Number(value); return Number.isInteger(number) && number > 0 ? number : 0; }
function securelyMatches(supplied: string, configured: string) { const a = Buffer.from(supplied); const b = Buffer.from(configured); return a.length === b.length && crypto.timingSafeEqual(a, b); }
function isDuplicate(error: unknown) { return typeof error === "object" && error !== null && "code" in error && error.code === 11000; }
