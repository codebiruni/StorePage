/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/connectdb";
import OrderModel from "@/models/order.model";
import Product from "@/models/product.model";
import type { OrderSource } from "@/interface/order.interface";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface DraftBody {
  draftId?: unknown;
  source?: unknown;
  productId?: unknown;          // single-product (landing page)
  productIds?: unknown;         // multi-product (buy-product)
  name?: unknown;
  number?: unknown;
  address?: unknown;
  note?: unknown;
  variantSku?: unknown;
  deliveryCharge?: unknown;
  totalAmount?: unknown;
  discount?: unknown;
}

const PHONE_RE = /^[\d+\-\s()]{8,15}$/;

function clean(v: unknown, max = 500): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? (n as number) : fallback;
}

/**
 * POST /api/order-draft
 *
 * Upserts an incomplete order so we never lose a lead. Accepts:
 *   - draftId      → updates an existing draft
 *   - productId    → landing-page flow (one product)
 *   - productIds[] → buy-product flow (cart)
 *
 * Returns the draftId on every call so the client can keep editing.
 */
export async function POST(req: NextRequest) {
  let body: DraftBody;
  try {
    body = (await req.json()) as DraftBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const draftId = clean(body.draftId, 40);
  const source: OrderSource =
    body.source === "buy-product" || body.source === "landing"
      ? body.source
      : "manual";

  const name = clean(body.name, 80);
  const number = clean(body.number, 20);
  const address = clean(body.address, 500);
  const note = clean(body.note, 500);
  const variantSku = clean(body.variantSku, 80);
  const deliveryCharge = num(body.deliveryCharge, 0);
  const totalAmount = num(body.totalAmount, 0);
  const discount = num(body.discount, 0);

  // Validate Mongo id only when an existing draft is being updated.
  if (draftId && !mongoose.Types.ObjectId.isValid(draftId)) {
    return NextResponse.json(
      { ok: false, message: "Invalid draftId" },
      { status: 400 },
    );
  }

  // Phone & address are optional at draft time so we can save as the user
  // types. Only block when both are missing (avoids storing empty garbage).
  if (number && !PHONE_RE.test(number)) {
    return NextResponse.json(
      { ok: false, message: "Phone invalid" },
      { status: 400 },
    );
  }

  // Resolve product ids (landing = 1, buy-product = N).
  let productIds: string[] = [];
  if (Array.isArray(body.productIds)) {
    productIds = (body.productIds as unknown[])
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim())
      .filter((v) => mongoose.Types.ObjectId.isValid(v));
  }
  const singleProductId =
    typeof body.productId === "string" &&
    mongoose.Types.ObjectId.isValid(body.productId)
      ? body.productId
      : "";
  if (!draftId && productIds.length === 0 && !singleProductId) {
    return NextResponse.json(
      { ok: false, message: "Provide productId or productIds" },
      { status: 400 },
    );
  }

  try {
    await connectDb();

    // Make sure referenced products actually exist before we save the draft.
    const lookupIds = productIds.length
      ? productIds
      : singleProductId
        ? [singleProductId]
        : [];
    if (lookupIds.length > 0) {
      const found = await Product.countDocuments({
        _id: { $in: lookupIds },
        isDeleted: false,
      });
      if (found !== lookupIds.length) {
        return NextResponse.json(
          { ok: false, message: "One or more products not found" },
          { status: 404 },
        );
      }
    }

    const grandTotal = totalAmount + deliveryCharge - (discount || 0);

    let draft;
    if (draftId) {
      // Update existing draft — never let an already-completed order be
      // downgraded back to a draft.
      draft = await OrderModel.findOneAndUpdate(
        { _id: draftId, isCompleted: false, isDeleted: false },
        {
          $set: {
            name,
            number,
            address,
            note: variantSku ? `[${variantSku}] ${note}` : note,
            totalAmount,
            deliveryCharge,
            discount,
            grandTotal,
            products: lookupIds.length ? lookupIds : undefined,
            source,
            landingProductId: singleProductId || undefined,
            lastActivityAt: new Date(),
            orderStatus: "draft",
          },
        },
        { new: true },
      ).lean();
    }

    if (!draft) {
      // No orderId until completion — the schema's required() function only
      // enforces it when isCompleted === true (see order.model.ts).
      draft = await OrderModel.create({
        name,
        number,
        address,
        products: lookupIds,
        totalAmount,
        deliveryCharge,
        discount,
        grandTotal,
        paymentMethod: "cash-on-delivery",
        paymentStatus: "pending",
        orderStatus: "draft",
        isCompleted: false,
        isDelivered: false,
        isPaid: false,
        isDeleted: false,
        source,
        landingProductId: singleProductId || undefined,
        lastActivityAt: new Date(),
        note: variantSku ? `[${variantSku}] ${note}` : note,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        draftId: (draft as any)._id.toString(),
        grandTotal: (draft as any).grandTotal,
        isCompleted: false,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[order-draft] error", err);
    return NextResponse.json(
      { ok: false, message: "Draft could not be saved" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/order-draft
 *
 * Marks a draft as fully submitted. Called right after the real order route
 * succeeds, so the draft flips to isCompleted=true / orderStatus=pending
 * and we keep a single document for the lifecycle.
 */
export async function PATCH(req: NextRequest) {
  let body: { draftId?: unknown; orderId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const draftId = clean(body.draftId, 40);
  const orderId = clean(body.orderId, 40);
  if (!draftId || !mongoose.Types.ObjectId.isValid(draftId)) {
    return NextResponse.json(
      { ok: false, message: "Invalid draftId" },
      { status: 400 },
    );
  }

  try {
    await connectDb();
    const updated = await OrderModel.findOneAndUpdate(
      { _id: draftId, isCompleted: false },
      {
        $set: {
          isCompleted: true,
          orderStatus: "pending",
          ...(orderId ? { orderId } : {}),
          lastActivityAt: new Date(),
        },
      },
      { new: true },
    ).lean();

    return NextResponse.json(
      {
        ok: true,
        completed: !!updated,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[order-draft PATCH] error", err);
    return NextResponse.json(
      { ok: false, message: "Draft could not be completed" },
      { status: 500 },
    );
  }
}