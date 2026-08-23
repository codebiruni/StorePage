/**
 * reportData.ts
 * ----------------
 * Pure data-aggregation helpers used by the dashboard's PDF export.
 *
 * Two report shapes are produced:
 *
 *  • Monthly Sales Report — focused on the most recent 1–12 month window.
 *    Includes a per-month revenue table, top-selling products for that
 *    window, category contribution, payment-method mix, and an executive
 *    summary at the top.
 *
 *  • Corporate / Overview Report — lifetime KPIs across the entire store:
 *    total products, categories, customers, lifetime revenue, lifetime
 *    orders, fulfilment health, stock health, top categories, and
 *    inventory valuation summary. Intended for board / investor reviews.
 *
 * The functions in this file talk directly to Mongoose — the Next.js API
 * route at `app/api/v1/reports/route.ts` calls them, then hands the
 * resulting payload to `ReportPdf.tsx` for rendering.
 */

import connectDb from "@/lib/connectdb";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import OrderModel from "@/models/order.model";
import Customer from "@/models/customer.model";
import Branch from "@/models/branch.model";
import Review from "@/models/review.model";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type ReportType = "monthly" | "corporate";

export interface MonthlyReport {
  kind: "monthly";
  generatedAt: string;
  /** Human label such as "January 2026" — first day of the focused month. */
  monthLabel: string;
  /** First day (inclusive) of the focused month, ISO string. */
  monthStart: string;
  /** Last day (inclusive) of the focused month, ISO string. */
  monthEnd: string;

  // Executive summary KPIs
  totals: {
    orders: number;
    cancelledOrders: number;
    deliveredOrders: number;
    revenue: number; // Excludes cancelled
    avgOrderValue: number; // Excludes cancelled
    unitsSold: number;
    uniqueCustomers: number;
    newCustomers: number;
  };

  // Comparison vs. the prior calendar month (for "↑ 12% MoM" callouts)
  comparison: {
    priorMonthOrders: number;
    priorMonthRevenue: number;
    ordersDeltaPct: number; // 0 if no prior baseline
    revenueDeltaPct: number;
  };

  // 12-month trailing trend (oldest → newest) for the area chart
  trailingMonths: Array<{
    month: string; // "Jan", "Feb"…
    year: number;
    monthIndex: number; // 0–11
    label: string; // "Jan 2026"
    orders: number;
    revenue: number;
  }>;

  // Top sellers in the focused month
  topProducts: Array<{
    name: string;
    category: string;
    quantitySold: number;
    revenue: number;
  }>;

  // Category-level rollup for the focused month
  categoryBreakdown: Array<{
    category: string;
    orders: number;
    revenue: number;
    sharePct: number;
  }>;

  // Payment-method mix for the focused month
  paymentBreakdown: Array<{
    method: string;
    label: string;
    count: number;
    revenue: number;
    sharePct: number;
  }>;

  // Order-status mix for the focused month
  statusBreakdown: Array<{
    status: string;
    count: number;
    sharePct: number;
  }>;
}

export interface CorporateReport {
  kind: "corporate";
  generatedAt: string;

  // Headline KPIs
  totals: {
    products: number;
    categories: number;
    subCategories: number;
    branches: number;
    customers: number;
    orders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    revenue: number;
    avgOrderValue: number;
    averageRating: number;
    reviewCount: number;
    inventoryValue: number;
  };

  // Fulfilment health (% share)
  fulfilment: {
    deliveryRatePct: number;
    cancellationRatePct: number;
    pendingRatePct: number;
  };

  // Inventory health
  inventory: {
    outOfStock: number;
    lowStock: number;
    mediumStock: number;
    highStock: number;
    averagePrice: number;
    highestPriced: { name: string; price: number; category: string } | null;
    lowestPriced: { name: string; price: number; category: string } | null;
  };

  // Lifetime top categories by revenue
  topCategories: Array<{
    category: string;
    revenue: number;
    productCount: number;
    sharePct: number;
  }>;

  // Lifetime top products by revenue
  topProducts: Array<{
    name: string;
    category: string;
    quantitySold: number;
    revenue: number;
  }>;

  // Lifetime payment-method mix
  paymentMix: Array<{
    method: string;
    label: string;
    count: number;
    sharePct: number;
  }>;

  // Lifetime order-status mix
  statusMix: Array<{
    status: string;
    count: number;
    sharePct: number;
  }>;

  // 12-month trailing sales trend for the executive chart
  trailingMonths: Array<{
    month: string;
    year: number;
    monthIndex: number;
    label: string;
    orders: number;
    revenue: number;
  }>;
}

export type ReportPayload = MonthlyReport | CorporateReport;

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const PAYMENT_LABELS: Record<string, string> = {
  "cash-on-delivery": "Cash on Delivery",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  card: "Card",
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10; // 1 decimal
}

function deltaPct(current: number, prior: number): number {
  if (!prior) return current > 0 ? 100 : 0;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

function labelForPayment(method: string): string {
  return PAYMENT_LABELS[method] ?? method;
}

/**
 * Normalise `Product.findOne(...).lean()` results into a single object.
 *
 * Mongoose's `findOne()` return type collapses to `FlattenMaps<any> | ...[]`
 * when chained with `.lean()`, which makes the type signature effectively
 * a union of "single doc OR array of docs". Runtime-wise it is always a
 * single doc here (we use `findOne` and sort by a single field), so we
 * pull the first element if TS sees an array.
 */
function pickPricedProduct(
  result: unknown,
): { name: string; price: number; category: string } | null {
  if (!result) return null;
  const doc = Array.isArray(result) ? result[0] : (result as Record<string, any>);
  if (!doc) return null;

  const name = (doc.name as string) || "—";
  const gp = doc.generalPrice as { currentPrice?: number } | undefined;
  const price = gp?.currentPrice ?? 0;

  let categoryName = "Uncategorized";
  const cat = doc.category as
    | string
    | { name?: string }
    | { _id?: string }
    | undefined;
  if (cat && typeof cat === "object" && "name" in cat) {
    categoryName = (cat as { name?: string }).name || "Uncategorized";
  }

  return { name, price, category: categoryName };
}

/* -------------------------------------------------------------------------- */
/*  Monthly sales report                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Build the monthly sales report for the given calendar month.
 * If `month` is omitted the current month is used.
 */
export async function buildMonthlyReport(month?: Date): Promise<MonthlyReport> {
  await connectDb();

  const focus = month ? new Date(month) : new Date();
  const monthStart = startOfMonth(focus);
  const monthEnd = endOfMonth(focus);
  const priorStart = startOfMonth(
    new Date(focus.getFullYear(), focus.getMonth() - 1, 1),
  );
  const priorEnd = endOfMonth(
    new Date(focus.getFullYear(), focus.getMonth() - 1, 1),
  );

  const monthLabel = `${MONTH_NAMES[focus.getMonth()]} ${focus.getFullYear()}`;

  // ---- Headline totals for the focused month (excludes cancelled in revenue)
  const totalsAgg = await OrderModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: monthStart, $lte: monthEnd },
      },
    },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0] },
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0] },
        },
        revenue: {
          $sum: {
            $cond: [
              { $ne: ["$orderStatus", "cancelled"] },
              "$grandTotal",
              0,
            ],
          },
        },
      },
    },
  ]);
  const totalsRaw = totalsAgg[0] || {
    orders: 0,
    cancelledOrders: 0,
    deliveredOrders: 0,
    revenue: 0,
  };

  // ---- Prior-month baseline for the delta callouts
  const priorAgg = await OrderModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: priorStart, $lte: priorEnd },
      },
    },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $ne: ["$orderStatus", "cancelled"] },
              "$grandTotal",
              0,
            ],
          },
        },
      },
    },
  ]);
  const priorRaw = priorAgg[0] || { orders: 0, revenue: 0 };

  // ---- Trailing 12-month trend (oldest → newest) for the area chart
  const trailingStart = startOfMonth(
    new Date(focus.getFullYear(), focus.getMonth() - 11, 1),
  );
  const trailingAgg = await OrderModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: trailingStart, $lte: monthEnd },
      },
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        orders: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $ne: ["$orderStatus", "cancelled"] },
              "$grandTotal",
              0,
            ],
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Build a dense 12-row array so missing months render as zeros
  const trailingMonths: MonthlyReport["trailingMonths"] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(focus.getFullYear(), focus.getMonth() - 11 + i, 1);
    const row = trailingAgg.find(
      (r) => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1,
    );
    trailingMonths.push({
      month: MONTH_SHORT[d.getMonth()],
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      label: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`,
      orders: row?.orders ?? 0,
      revenue: row?.revenue ?? 0,
    });
  }

  // ---- Unique customers, units sold, new customers for the month
  const customerAgg = await OrderModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: monthStart, $lte: monthEnd },
        orderStatus: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: "$number", // phone acts as a de-duped customer key
      },
    },
    { $count: "uniqueCustomers" },
  ]);

  const newCustomerCount = await Customer.countDocuments({
    createdAt: { $gte: monthStart, $lte: monthEnd },
  });

  // Units sold (sum of product quantities in non-cancelled orders)
  const unitsAgg = await OrderModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: monthStart, $lte: monthEnd },
        orderStatus: { $ne: "cancelled" },
      },
    },
    { $project: { productCount: { $size: { $ifNull: ["$products", []] } } } },
    { $group: { _id: null, units: { $sum: "$productCount" } } },
  ]);

  const totals: MonthlyReport["totals"] = {
    orders: totalsRaw.orders,
    cancelledOrders: totalsRaw.cancelledOrders,
    deliveredOrders: totalsRaw.deliveredOrders,
    revenue: totalsRaw.revenue,
    avgOrderValue:
      totalsRaw.orders - totalsRaw.cancelledOrders > 0
        ? totalsRaw.revenue /
          (totalsRaw.orders - totalsRaw.cancelledOrders)
        : 0,
    unitsSold: unitsAgg[0]?.units ?? 0,
    uniqueCustomers: customerAgg[0]?.uniqueCustomers ?? 0,
    newCustomers: newCustomerCount,
  };

  const comparison: MonthlyReport["comparison"] = {
    priorMonthOrders: priorRaw.orders,
    priorMonthRevenue: priorRaw.revenue,
    ordersDeltaPct: deltaPct(totalsRaw.orders, priorRaw.orders),
    revenueDeltaPct: deltaPct(totalsRaw.revenue, priorRaw.revenue),
  };

  // ---- Top products for the month (joins via $lookup onto Product)
  const topProductsAgg = await OrderModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: monthStart, $lte: monthEnd },
        orderStatus: { $ne: "cancelled" },
      },
    },
    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "categories",
        localField: "product.category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $group: {
        _id: "$product._id",
        name: { $first: "$product.name" },
        category: { $first: { $arrayElemAt: ["$category.name", 0] } },
        quantitySold: { $sum: 1 },
        revenue: { $sum: "$grandTotal" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);

  // ---- Category breakdown for the month (each product counted once)
  const categoryAgg = await OrderModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: monthStart, $lte: monthEnd },
        orderStatus: { $ne: "cancelled" },
      },
    },
    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "categories",
        localField: "product.category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $group: {
        _id: { $arrayElemAt: ["$category.name", 0] },
        orders: { $sum: 1 },
        revenue: { $sum: "$grandTotal" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 12 },
  ]);
  const categoryRevenueTotal = categoryAgg.reduce(
    (sum, c) => sum + c.revenue,
    0,
  );

  // ---- Payment + status mix for the month
  const paymentAgg = await OrderModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: monthStart, $lte: monthEnd },
        orderStatus: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
        revenue: { $sum: "$grandTotal" },
      },
    },
    { $sort: { revenue: -1 } },
  ]);
  const paymentRevenueTotal = paymentAgg.reduce(
    (sum, p) => sum + p.revenue,
    0,
  );

  const statusAgg = await OrderModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: monthStart, $lte: monthEnd },
      },
    },
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return {
    kind: "monthly",
    generatedAt: new Date().toISOString(),
    monthLabel,
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString(),
    totals,
    comparison,
    trailingMonths,
    topProducts: topProductsAgg.map((row) => ({
      name: row.name || "Unnamed Product",
      category: row.category || "Uncategorized",
      quantitySold: row.quantitySold,
      revenue: row.revenue,
    })),
    categoryBreakdown: categoryAgg.map((row) => ({
      category: row._id || "Uncategorized",
      orders: row.orders,
      revenue: row.revenue,
      sharePct: pct(row.revenue, categoryRevenueTotal),
    })),
    paymentBreakdown: paymentAgg.map((row) => ({
      method: row._id || "unknown",
      label: labelForPayment(row._id || "unknown"),
      count: row.count,
      revenue: row.revenue,
      sharePct: pct(row.revenue, paymentRevenueTotal),
    })),
    statusBreakdown: statusAgg.map((row) => ({
      status: row._id || "unknown",
      count: row.count,
      sharePct: pct(row.count, totalsRaw.orders),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Corporate / lifetime report                                               */
/* -------------------------------------------------------------------------- */

export async function buildCorporateReport(): Promise<CorporateReport> {
  await connectDb();

  // ---- Lifetime order totals
  const lifetimeAgg = await OrderModel.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $cond: [
              { $ne: ["$orderStatus", "cancelled"] },
              "$grandTotal",
              0,
            ],
          },
        },
        cancelledOrders: {
          $sum: {
            $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0],
          },
        },
        deliveredOrders: {
          $sum: {
            $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0],
          },
        },
        pendingOrders: {
          $sum: {
            $cond: [
              {
                $in: [
                  "$orderStatus",
                  ["pending", "confirmed", "processing"],
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const lifetime = lifetimeAgg[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    cancelledOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
  };

  // ---- Catalog sizes
  const [
    productsCount,
    categoriesCount,
    subCategoriesCount,
    branchesCount,
    customersCount,
  ] = await Promise.all([
    Product.countDocuments({ isDeleted: false }),
    Category.countDocuments({ isDeleted: false }),
    // Sub-categories — try a couple of common flag names defensively
    (async () => {
      try {
        const SubCategory = (await import("@/models/sub-category.model"))
          .default;
        return SubCategory.countDocuments({ isDeleted: false });
      } catch {
        return 0;
      }
    })(),
    Branch.countDocuments({ isDeleted: false }),
    Customer.countDocuments({ isDeleted: false }),
  ]);

  // ---- Reviews (count + average)
  const reviewsAgg = await Review.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const averageRating = reviewsAgg[0]?.avg ?? 0;
  const reviewCount = reviewsAgg[0]?.count ?? 0;

  // ---- Inventory valuation + distribution
  const inventoryAgg = await Product.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        avgPrice: { $avg: "$generalPrice.currentPrice" },
        maxPrice: { $max: "$generalPrice.currentPrice" },
        minPrice: { $min: "$generalPrice.currentPrice" },
        totalValue: {
          $sum: {
            $multiply: [
              { $ifNull: ["$quentity", 0] },
              { $ifNull: ["$generalPrice.currentPrice", 0] },
            ],
          },
        },
      },
    },
  ]);
  const inventory = inventoryAgg[0] || {
    avgPrice: 0,
    maxPrice: 0,
    minPrice: 0,
    totalValue: 0,
  };

  const [
    outOfStock,
    lowStock,
    mediumStock,
    highStock,
    highestProduct,
    lowestProduct,
  ] = await Promise.all([
    Product.countDocuments({ isDeleted: false, quentity: 0 }),
    Product.countDocuments({
      isDeleted: false,
      quentity: { $gt: 0, $lt: 5 },
    }),
    Product.countDocuments({
      isDeleted: false,
      quentity: { $gte: 5, $lt: 20 },
    }),
    Product.countDocuments({ isDeleted: false, quentity: { $gte: 20 } }),
    Product.findOne({ isDeleted: false })
      .sort({ "generalPrice.currentPrice": -1 })
      .select("name category generalPrice.currentPrice")
      .populate("category", "name")
      .lean(),
    Product.findOne({ isDeleted: false })
      .sort({ "generalPrice.currentPrice": 1 })
      .select("name category generalPrice.currentPrice")
      .populate("category", "name")
      .lean(),
  ]);

  // ---- Top categories (lifetime)
  const topCategoriesAgg = await OrderModel.aggregate([
    { $match: { isDeleted: false, orderStatus: { $ne: "cancelled" } } },
    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "categories",
        localField: "product.category",
        foreignField: "_id",
        as: "cat",
      },
    },
    { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$cat._id",
        category: { $first: "$cat.name" },
        revenue: { $sum: "$grandTotal" },
        productCount: { $addToSet: "$product._id" },
      },
    },
    {
      $project: {
        category: 1,
        revenue: 1,
        productCount: { $size: "$productCount" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);
  const topCategoriesTotal = topCategoriesAgg.reduce(
    (sum, c) => sum + c.revenue,
    0,
  );

  // ---- Top products (lifetime)
  const topProductsAgg = await OrderModel.aggregate([
    { $match: { isDeleted: false, orderStatus: { $ne: "cancelled" } } },
    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "categories",
        localField: "product.category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $group: {
        _id: "$product._id",
        name: { $first: "$product.name" },
        category: { $first: { $arrayElemAt: ["$category.name", 0] } },
        quantitySold: { $sum: 1 },
        revenue: { $sum: "$grandTotal" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);

  // ---- Payment / status mix (lifetime)
  const paymentMixAgg = await OrderModel.aggregate([
    { $match: { isDeleted: false, orderStatus: { $ne: "cancelled" } } },
    {
      $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
        revenue: { $sum: "$grandTotal" },
      },
    },
    { $sort: { revenue: -1 } },
  ]);
  const paymentMixTotal = paymentMixAgg.reduce(
    (sum, p) => sum + p.revenue,
    0,
  );

  const statusMixAgg = await OrderModel.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // ---- Trailing 12-month trend for the executive chart
  const now = new Date();
  const trailingStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 11, 1),
  );
  const trailingAgg = await OrderModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: trailingStart, $lte: now },
      },
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        orders: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $ne: ["$orderStatus", "cancelled"] },
              "$grandTotal",
              0,
            ],
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
  const trailingMonths: CorporateReport["trailingMonths"] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const row = trailingAgg.find(
      (r) => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1,
    );
    trailingMonths.push({
      month: MONTH_SHORT[d.getMonth()],
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      label: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`,
      orders: row?.orders ?? 0,
      revenue: row?.revenue ?? 0,
    });
  }

  // ---- Fulfilment health
  const totalOrders = lifetime.totalOrders || 1; // avoid div-by-zero
  const fulfilment = {
    deliveryRatePct: pct(lifetime.deliveredOrders, totalOrders),
    cancellationRatePct: pct(lifetime.cancelledOrders, totalOrders),
    pendingRatePct: pct(lifetime.pendingOrders, totalOrders),
  };

  return {
    kind: "corporate",
    generatedAt: new Date().toISOString(),
    totals: {
      products: productsCount,
      categories: categoriesCount,
      subCategories: subCategoriesCount,
      branches: branchesCount,
      customers: customersCount,
      orders: lifetime.totalOrders,
      deliveredOrders: lifetime.deliveredOrders,
      cancelledOrders: lifetime.cancelledOrders,
      revenue: lifetime.totalRevenue,
      avgOrderValue:
        lifetime.totalOrders - lifetime.cancelledOrders > 0
          ? lifetime.totalRevenue /
            (lifetime.totalOrders - lifetime.cancelledOrders)
          : 0,
      averageRating,
      reviewCount,
      inventoryValue: inventory.totalValue,
    },
    fulfilment,
    inventory: {
      outOfStock,
      lowStock,
      mediumStock,
      highStock,
      averagePrice: inventory.avgPrice || 0,
      highestPriced: pickPricedProduct(highestProduct),
      lowestPriced: pickPricedProduct(lowestProduct),
    },
    topCategories: topCategoriesAgg.map((row) => ({
      category: row.category || "Uncategorized",
      revenue: row.revenue,
      productCount: row.productCount,
      sharePct: pct(row.revenue, topCategoriesTotal),
    })),
    topProducts: topProductsAgg.map((row) => ({
      name: row.name || "Unnamed Product",
      category: row.category || "Uncategorized",
      quantitySold: row.quantitySold,
      revenue: row.revenue,
    })),
    paymentMix: paymentMixAgg.map((row) => ({
      method: row._id || "unknown",
      label: labelForPayment(row._id || "unknown"),
      count: row.count,
      sharePct: pct(row.revenue, paymentMixTotal),
    })),
    statusMix: statusMixAgg.map((row) => ({
      status: row._id || "unknown",
      count: row.count,
      sharePct: pct(row.count, lifetime.totalOrders),
    })),
    trailingMonths,
  };
}
