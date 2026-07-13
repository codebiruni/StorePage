/**
 * MongoDB aggregation stages that add a single `inventoryValue` field to each
 * product document, expressed in the store's accounting currency (regular
 * / MSRP prices, not the storefront discount price).
 *
 * Why this exists:
 *   - The legacy formula `quentity * generalPrice.currentPrice` silently
 *     excludes products whose top-level `quentity` is missing or stored as a
 *     string (see `lib/inventory.ts` for the legacy coercion path), and uses
 *     the *sale* price as the "stock value" — which under-reports inventory
 *     value by the discount percentage whenever a product has an offer on.
 *   - Real inventory value should be MSRP × on-hand. That lives on
 *     `priceVariants[].regularPrice` and `priceVariants[].quentity`.
 *
 * Formula:
 *   inventoryValue =
 *       SUM(priceVariants[].regularPrice × priceVariants[].quentity)   // per-variant stock
 *     + (top-level quentity × generalPrice.currentPrice fallback)        // legacy/display-only stock
 *
 * Every numeric input is coerced through `$toDouble` so legacy rows where
 * `quentity` (or per-variant `quentity`) was stored as a string still
 * contribute correctly. `$toDouble` returns 0 for missing/null, which
 * replaces the earlier `$ifNull` 0 fallback.
 *
 * Returns a generic aggregation stage (not a strictly-typed `PipelineStage`)
 * because Mongoose's `AddFields` type only whitelists the model's known
 * fields and `inventoryValue` is a computed field. Each call site already
 * runs through `Product.aggregate([...])` so the runtime shape is valid.
 */
export const inventoryValueAddFields = {
  $addFields: {
    inventoryValue: {
      $add: [
        // Per-variant MSRP stock value.
        {
          $sum: {
            $map: {
              input: { $ifNull: ["$priceVariants", []] },
              as: "v",
              in: {
                $multiply: [
                  { $toDouble: { $ifNull: ["$$v.quentity", 0] } },
                  { $toDouble: { $ifNull: ["$$v.regularPrice", 0] } },
                ],
              },
            },
          },
        },
        // Top-level fallback for products that store stock at the root.
        {
          $multiply: [
            { $toDouble: { $ifNull: ["$quentity", 0] } },
            { $toDouble: { $ifNull: ["$generalPrice.currentPrice", 0] } },
          ],
        },
      ],
    },
  },
};

/**
 * Aggregation `$match` that includes every non-deleted product but excludes
 * rows that are pure ghosts (no variants, no top-level stock). Use this in
 * place of the previous `quentity: { $type: "number" }` filter when computing
 * inventory-value aggregates.
 */
export const inventoryValueMatch = {
  $match: {
    isDeleted: false,
    $or: [
      { "priceVariants.0": { $exists: true } },
      { quentity: { $exists: true } },
    ],
  },
};