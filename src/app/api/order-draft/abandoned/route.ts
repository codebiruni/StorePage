import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import OrderModel from "@/models/order.model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/order-draft/abandoned
 *
 * Marks drafts that haven't been touched in `minutes` (default 30) as
 * `orderStatus: "abandoned"`. Designed to be hit by an external cron
 * (Vercel Cron, GitHub Actions, etc.) — protected by a shared secret.
 *
 * Body (all optional):
 *   { minutes?: number, dryRun?: boolean }
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== expected) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  let minutes = 30;
  let dryRun = false;
  try {
    const body = (await req.json().catch(() => ({}))) as {
      minutes?: number;
      dryRun?: boolean;
    };
    if (typeof body.minutes === "number" && body.minutes > 0) {
      minutes = Math.min(body.minutes, 60 * 24 * 7); // cap at 7 days
    }
    if (typeof body.dryRun === "boolean") dryRun = body.dryRun;
  } catch {
    /* empty body is fine */
  }

  try {
    await connectDb();
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);

    const filter = {
      isCompleted: false,
      isDeleted: false,
      orderStatus: "draft",
      lastActivityAt: { $lt: cutoff },
    };

    if (dryRun) {
      const count = await OrderModel.countDocuments(filter);
      return NextResponse.json({ ok: true, wouldAffect: count, dryRun: true });
    }

    const result = await OrderModel.updateMany(filter, {
      $set: { orderStatus: "abandoned", abandonedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      minutes,
    });
  } catch (err) {
    console.error("[order-draft/abandoned] error", err);
    return NextResponse.json(
      { ok: false, message: "Sweep failed" },
      { status: 500 },
    );
  }
}

/** GET works as a manual trigger / health check too. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "POST { minutes?: number, dryRun?: boolean } to sweep drafts.",
  });
}