import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import OrderModel from "@/models/order.model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/order-draft/list?status=draft|abandoned&page=1&limit=50
 *
 * Returns orders where `isCompleted === false`. Filters by the new
 * `draft` / `abandoned` statuses. Used by the admin "Recover leads" page.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "draft").trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(Math.max(1, Number(searchParams.get("limit") || 50)), 100);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      isCompleted: false,
      isDeleted: false,
    };
    if (status === "draft" || status === "abandoned") {
      query.orderStatus = status;
    }

    const [items, total] = await Promise.all([
      OrderModel.find(query)
        .sort({ lastActivityAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("products", "name images generalPrice")
        .lean(),
      OrderModel.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[order-draft/list] error", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch drafts" },
      { status: 500 },
    );
  }
}