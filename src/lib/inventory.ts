import type { Model } from "mongoose";

type BulkOp = {
  updateOne: {
    filter: Record<string, unknown>;
    update: Record<string, unknown>;
  };
};

type ProductLike = {
  _id: unknown;
  quentity?: number | string | null;
};

/**
 * Apply a numeric $inc to `quentity` on each product, but self-heal legacy
 * rows first: older data may have `quentity` stored as a string, which makes
 * MongoDB reject `$inc` with "non-numeric type".
 *
 * For each id that needs adjusting, we:
 *   1. Coerce a non-numeric `quentity` to a Number (idempotent, one $set).
 *   2. Apply the requested delta as $inc.
 *
 * Returns counts so callers can log or react.
 */
export async function adjustProductQuantities(
  ProductModel: Model<unknown>,
  items: Array<{ _id: unknown; delta: number }>,
): Promise<{ coerced: number; incremented: number }> {
  if (!items?.length) return { coerced: 0, incremented: 0 };

  // First, check which docs have non-numeric `quentity` and coerce them.
  const ids = items.map((i) => i._id);
  const docs = (await ProductModel.find(
    { _id: { $in: ids } },
    { quentity: 1 },
  ).lean()) as ProductLike[];

  const coerceOps: BulkOp[] = [];
  for (const d of docs) {
    const q = d.quentity;
    if (q !== undefined && q !== null && typeof q !== "number") {
      const num = Number(q);
      const safe = Number.isFinite(num) ? num : 0;
      coerceOps.push({
        updateOne: {
          filter: { _id: d._id },
          update: { $set: { quentity: safe } },
        },
      });
    }
  }

  if (coerceOps.length > 0) {
    await ProductModel.bulkWrite(coerceOps);
  }

  // Now run the requested $inc operations.
  const incOps: BulkOp[] = items.map((i) => ({
    updateOne: {
      filter: { _id: i._id, isDeleted: false },
      update: {
        $inc: { quentity: i.delta },
        $set: { updatedAt: new Date() },
      },
    },
  }));

  const res = await ProductModel.bulkWrite(incOps);
  const incremented =
    typeof (res as { modifiedCount?: number }).modifiedCount === "number"
      ? (res as { modifiedCount: number }).modifiedCount
      : 0;
  return { coerced: coerceOps.length, incremented };
}