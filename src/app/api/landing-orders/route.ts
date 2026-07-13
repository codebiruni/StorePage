import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import mongoose from "mongoose";
import connectDb from "@/lib/connectdb";
import OrderModel from "@/models/order.model";
import { productTag } from "@/app/step/_lib/landing-data";
import { getSiteConfig } from "@/lib/siteConfig";

// Body validation -----------------------------------------------------

interface LandingOrderBody {
  productId?: unknown;
  productName?: unknown;
  variantSku?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  customerAddress?: unknown;
  note?: unknown;
}

const PHONE_RE = /^[\d+\-\s()]{8,15}$/;

function clean(v: unknown, max = 500): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

// IMPORTANT: This route is intentionally NOT wrapped in a heavy DB session
// check — landing funnels must respond in <100ms. We've still got input
// validation and a sane ObjectId check above the DB write.
// (Admin auth lives on /api/v1/product etc.)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: LandingOrderBody;
  try {
    body = (await req.json()) as LandingOrderBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const productId = clean(body.productId, 40);
  const customerName = clean(body.customerName, 80);
  const customerPhone = clean(body.customerPhone, 20);
  const customerAddress = clean(body.customerAddress, 500);
  const note = clean(body.note, 500);
  const variantSku = clean(body.variantSku, 80);

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return NextResponse.json(
      { ok: false, message: "Invalid productId" },
      { status: 400 },
    );
  }
  if (customerName.length < 2) {
    return NextResponse.json(
      { ok: false, message: "Name required" },
      { status: 400 },
    );
  }
  if (!PHONE_RE.test(customerPhone)) {
    return NextResponse.json(
      { ok: false, message: "Phone invalid" },
      { status: 400 },
    );
  }
  if (customerAddress.length < 5) {
    return NextResponse.json(
      { ok: false, message: "Address required" },
      { status: 400 },
    );
  }

  try {
    await connectDb();

    const totalAmount = 0; // shipping-only for funnel orders; admin reconciles real price
    const siteConfig = await getSiteConfig();
    // Landing forms don't ask for a district, so default to the
    // outside-Dhaka charge. Admins can change both prices from
    // /dashboard/website-info.
    const deliveryCharge = siteConfig.deliveryCharge?.outsideDhaka ?? 0;

    const order = await OrderModel.create({
      orderId: undefined,
      name: customerName,
      number: customerPhone,
      address: customerAddress,
      products: [productId],
      totalAmount,
      deliveryCharge,
      grandTotal: totalAmount + deliveryCharge,
      paymentMethod: "cash-on-delivery",
      paymentStatus: "pending",
      orderStatus: "pending",
      note: variantSku ? `[${variantSku}] ${note}` : note,
      isDelivered: false,
      isPaid: false,
      isDeleted: false,
      source: "landing",
      landingProductId: productId,
    });

    // Optimistic — soft-touch product cache so thanks-page price is fresh.
    // We don't await; it's best-effort.
    Promise.resolve().then(() => {
      try {
        revalidateTag(productTag(productId), "default");
        revalidatePath(`/step/${productId}`);
      } catch {
        /* revalidation failures shouldn't break the order */
      }
    });

    return NextResponse.json(
      {
        ok: true,
        orderId: order._id.toString(),
        ref: order.orderId,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[landing-orders] error", err);
    const msg =
      err instanceof Error && err.name === "ValidationError"
        ? "Validation failed"
        : "Order could not be placed";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}

export async function GET() {
  // Lightweight health probe — useful for uptime checks from the dashboard.
  return NextResponse.json({ ok: true, route: "landing-orders" });
}
