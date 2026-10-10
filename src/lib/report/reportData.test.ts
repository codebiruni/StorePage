import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    aggregate,
    countDocuments,
    findOne,
    orderModel,
    productModel,
    categoryModel,
    subCategoryModel,
    customerModel,
    branchModel,
    reviewModel,
} = vi.hoisted(() => {
    const aggregate = vi.fn();
    const countDocuments = vi.fn();
    const findOne = vi.fn();
    return {
        aggregate,
        countDocuments,
        findOne,
        orderModel: { aggregate, countDocuments },
        productModel: { aggregate, countDocuments, findOne },
        categoryModel: { countDocuments },
        subCategoryModel: { countDocuments },
        customerModel: { countDocuments },
        branchModel: { countDocuments },
        reviewModel: { aggregate },
    };
});

vi.mock("@/lib/connectdb", () => ({ default: vi.fn(async () => undefined) }));
vi.mock("@/models/product.model", () => ({ default: productModel }));
vi.mock("@/models/category.model", () => ({ default: categoryModel }));
vi.mock("@/models/order.model", () => ({ default: orderModel }));
vi.mock("@/models/customer.model", () => ({ default: customerModel }));
vi.mock("@/models/branch.model", () => ({ default: branchModel }));
vi.mock("@/models/review.model", () => ({ default: reviewModel }));
vi.mock("@/models/sub-category.model", () => ({ default: subCategoryModel }));

import {
    buildCorporateReport,
    buildMonthlyReport,
} from "@/lib/report/reportData";

/**
 * Route each `aggregate()` call to the right canned payload by inspecting the
 * `$match`/pipeline shape, mirroring how each query is written in the source.
 */
beforeEach(() => {
    aggregate.mockReset().mockResolvedValue([]);
    countDocuments.mockReset().mockResolvedValue(0);
    findOne.mockReset().mockReturnValue({
        sort: () => ({
            select: () => ({ populate: () => ({ lean: async () => null }) }),
        }),
    });
});

/** Route an `aggregate()` call to a canned payload by a unique marker. */
function routeAggregate(
    marker: string,
    payload: unknown[],
    fallback: unknown[] = [],
) {
    return vi.fn(async (pipeline: unknown[]) => {
        if (JSON.stringify(pipeline).includes(marker)) return payload as never;
        return fallback as never;
    });
}

/* -------------------------------------------------------------------------- */
/*  Monthly                                                                   */
/* -------------------------------------------------------------------------- */

describe("lib/report/reportData › buildMonthlyReport", () => {
    const month = new Date("2026-01-15T12:00:00.000Z");

    it("labels the report for the requested month", async () => {
        const report = await buildMonthlyReport(month);

        expect(report.kind).toBe("monthly");
        expect(report.monthLabel).toBe("January 2026");
        expect(report.monthStart).toBe(new Date(2026, 0, 1).toISOString());
        expect(report.generatedAt).toEqual(expect.any(String));
    });

    it("spans the full month from first to last millisecond", async () => {
        const report = await buildMonthlyReport(month);

        const start = new Date(report.monthStart);
        const end = new Date(report.monthEnd);
        expect(start.getDate()).toBe(1);
        expect(end.getDate()).toBe(31);
        expect(end.getHours()).toBe(23);
    });

    it("always emits a dense 12-row trailing series", async () => {
        const report = await buildMonthlyReport(month);

        expect(report.trailingMonths).toHaveLength(12);
        expect(report.trailingMonths[11].label).toBe("Jan 2026");
        expect(report.trailingMonths[0].label).toBe("Feb 2025");
    });

    it("fills missing trailing months with zeros", async () => {
        const report = await buildMonthlyReport(month);
        const row = report.trailingMonths[0];

        expect(row.orders).toBe(0);
        expect(row.revenue).toBe(0);
        expect(row.month).toBe("Feb");
    });

    it("merges aggregated month rows into the trailing series", async () => {
        aggregate.mockImplementation(
            routeAggregate('"$year"', [
                { _id: { year: 2026, month: 1 }, orders: 5, revenue: 500 },
            ]),
        );

        const report = await buildMonthlyReport(month);
        const jan = report.trailingMonths[11];

        expect(jan.orders).toBe(5);
        expect(jan.revenue).toBe(500);
    });

    it("computes totals and average order value from the headline aggregate", async () => {
        aggregate.mockImplementation(
            routeAggregate("cancelledOrders", [
                {
                    orders: 10,
                    cancelledOrders: 2,
                    deliveredOrders: 6,
                    revenue: 8000,
                },
            ]),
        );

        const report = await buildMonthlyReport(month);

        expect(report.totals.orders).toBe(10);
        expect(report.totals.cancelledOrders).toBe(2);
        expect(report.totals.deliveredOrders).toBe(6);
        expect(report.totals.revenue).toBe(8000);
        // Revenue excludes cancelled orders (10 - 2 = 8 orders).
        expect(report.totals.avgOrderValue).toBe(1000);
    });

    it("reports a zero average order value when every order was cancelled", async () => {
        aggregate.mockImplementation(
            routeAggregate("cancelledOrders", [
                { orders: 3, cancelledOrders: 3, revenue: 0 },
            ]),
        );

        const report = await buildMonthlyReport(month);
        expect(report.totals.avgOrderValue).toBe(0);
    });

    it("computes the month-over-month percentage deltas", async () => {
        // Call order: 1 = headline totals, 2 = prior month, 3 = trailing trend.
        aggregate
            .mockResolvedValueOnce([
                { orders: 10, cancelledOrders: 0, deliveredOrders: 0, revenue: 1000 },
            ] as never)
            .mockResolvedValueOnce([{ orders: 8, revenue: 800 }] as never)
            .mockResolvedValue([] as never);

        const report = await buildMonthlyReport(month);

        expect(report.comparison.priorMonthOrders).toBe(8);
        expect(report.comparison.priorMonthRevenue).toBe(800);
        expect(report.comparison.ordersDeltaPct).toBe(25);
        expect(report.comparison.revenueDeltaPct).toBe(25);
    });

    it("treats a missing prior month as a 100% increase", async () => {
        aggregate.mockResolvedValue([]);
        const report = await buildMonthlyReport(month);

        expect(report.comparison.ordersDeltaPct).toBe(0);
        expect(report.comparison.revenueDeltaPct).toBe(0);
    });

    it("reads unique customers, units sold and new customers from their aggregates", async () => {
        aggregate.mockImplementation(
            vi.fn(async (pipeline: unknown[]) => {
                const s = JSON.stringify(pipeline);
                if (s.includes('"$count":"uniqueCustomers"')) {
                    return [{ uniqueCustomers: 7 }] as never;
                }
                if (s.includes("$size")) return [{ units: 21 }] as never;
                return [] as never;
            }),
        );
        countDocuments.mockResolvedValue(3);

        const report = await buildMonthlyReport(month);

        expect(report.totals.uniqueCustomers).toBe(7);
        expect(report.totals.unitsSold).toBe(21);
        expect(report.totals.newCustomers).toBe(3);
    });

    it("defaults the totals to zero when the aggregates return nothing", async () => {
        const report = await buildMonthlyReport(month);

        expect(report.totals).toEqual({
            orders: 0,
            cancelledOrders: 0,
            deliveredOrders: 0,
            revenue: 0,
            avgOrderValue: 0,
            unitsSold: 0,
            uniqueCustomers: 0,
            newCustomers: 0,
        });
    });

    it("maps top products and applies display fallbacks", async () => {
        aggregate.mockImplementation(
            routeAggregate("quantitySold", [
                { name: "Widget", category: "Tools", quantitySold: 4, revenue: 400 },
                { name: null, category: null, quantitySold: 1, revenue: 10 },
            ]),
        );

        const report = await buildMonthlyReport(month);

        expect(report.topProducts[0]).toEqual({
            name: "Widget",
            category: "Tools",
            quantitySold: 4,
            revenue: 400,
        });
        expect(report.topProducts[1]).toEqual({
            name: "Unnamed Product",
            category: "Uncategorized",
            quantitySold: 1,
            revenue: 10,
        });
    });

    it("computes category shares as a percentage of category revenue", async () => {
        aggregate.mockImplementation(
            routeAggregate("$arrayElemAt", [
                { _id: "Tools", orders: 3, revenue: 750 },
                { _id: "Toys", orders: 1, revenue: 250 },
            ]),
        );

        const report = await buildMonthlyReport(month);

        expect(report.categoryBreakdown[0].sharePct).toBe(75);
        expect(report.categoryBreakdown[1].sharePct).toBe(25);
    });

    it("labels known payment methods and echoes unknown ones", async () => {
        aggregate.mockImplementation(
            routeAggregate("paymentMethod", [
                { _id: "bkash", count: 2, revenue: 200 },
                { _id: "crypto", count: 1, revenue: 100 },
            ]),
        );

        const report = await buildMonthlyReport(month);

        const bkash = report.paymentBreakdown.find((p) => p.method === "bkash");
        const crypto = report.paymentBreakdown.find((p) => p.method === "crypto");
        expect(bkash?.label).toBe("bKash");
        expect(crypto?.label).toBe("crypto");
    });

    it("falls back to 'unknown' when a payment method is missing", async () => {
        aggregate.mockImplementation(
            routeAggregate("paymentMethod", [{ _id: null, count: 1, revenue: 1 }]),
        );

        const report = await buildMonthlyReport(month);
        expect(report.paymentBreakdown[0].method).toBe("unknown");
    });

    it("computes status shares against the total order count", async () => {
        aggregate.mockImplementation(
            vi.fn(async (pipeline: unknown[]) => {
                const s = JSON.stringify(pipeline);
                if (s.includes("cancelledOrders")) {
                    return [{ orders: 4, cancelledOrders: 1, revenue: 100 }] as never;
                }
                if (s.includes("orderStatus")) {
                    return [
                        { _id: "delivered", count: 3 },
                        { _id: "cancelled", count: 1 },
                    ] as never;
                }
                return [] as never;
            }),
        );

        const report = await buildMonthlyReport(month);

        expect(report.statusBreakdown[0]).toEqual({
            status: "delivered",
            count: 3,
            sharePct: 75,
        });
        expect(report.statusBreakdown[1].sharePct).toBe(25);
    });

    it("uses the current month when no month is supplied", async () => {
        const report = await buildMonthlyReport();
        const now = new Date();

        expect(report.monthLabel).toBe(
            `${new Date(now.getFullYear(), now.getMonth(), 1).toLocaleString("en-US", { month: "long" })} ${now.getFullYear()}`,
        );
    });
});

/* -------------------------------------------------------------------------- */
/*  Corporate                                                                 */
/* -------------------------------------------------------------------------- */

describe("lib/report/reportData › buildCorporateReport", () => {
    it("marks the payload as the corporate report", async () => {
        const report = await buildCorporateReport();
        expect(report.kind).toBe("corporate");
        expect(report.generatedAt).toEqual(expect.any(String));
    });

    it("returns zeroed KPIs against an empty database", async () => {
        const report = await buildCorporateReport();

        expect(report.totals).toMatchObject({
            products: 0,
            categories: 0,
            branches: 0,
            customers: 0,
            orders: 0,
            revenue: 0,
            avgOrderValue: 0,
            averageRating: 0,
            reviewCount: 0,
            inventoryValue: 0,
        });
    });

    it("populates catalogue counts from countDocuments", async () => {
        countDocuments.mockResolvedValue(12);
        const report = await buildCorporateReport();

        expect(report.totals.products).toBe(12);
        expect(report.totals.categories).toBe(12);
        expect(report.totals.subCategories).toBe(12);
    });

    it("computes the lifetime average order value excluding cancelled orders", async () => {
        aggregate.mockImplementation(async (pipeline: unknown[]) => {
            const s = JSON.stringify(pipeline);
            if (s.includes("pendingOrders")) {
                return [
                    {
                        totalOrders: 10,
                        totalRevenue: 9000,
                        cancelledOrders: 2,
                        deliveredOrders: 7,
                        pendingOrders: 1,
                    },
                ] as never;
            }
            return [] as never;
        });

        const report = await buildCorporateReport();

        expect(report.totals.orders).toBe(10);
        expect(report.totals.revenue).toBe(9000);
        expect(report.totals.avgOrderValue).toBe(1125);
    });

    it("derives fulfilment percentages from the lifetime totals", async () => {
        aggregate.mockImplementation(async (pipeline: unknown[]) => {
            const s = JSON.stringify(pipeline);
            if (s.includes("pendingOrders")) {
                return [
                    {
                        totalOrders: 10,
                        totalRevenue: 0,
                        cancelledOrders: 1,
                        deliveredOrders: 8,
                        pendingOrders: 4,
                    },
                ] as never;
            }
            return [] as never;
        });

        const report = await buildCorporateReport();

        expect(report.fulfilment.deliveryRatePct).toBe(80);
        expect(report.fulfilment.cancellationRatePct).toBe(10);
        expect(report.fulfilment.pendingRatePct).toBe(40);
    });

    it("reports review average and count", async () => {
        aggregate.mockImplementation(async (pipeline: unknown[]) => {
            const s = JSON.stringify(pipeline);
            if (s.includes("$avg")) {
                return [{ avg: 4.25, count: 40 }] as never;
            }
            return [] as never;
        });

        const report = await buildCorporateReport();

        expect(report.totals.averageRating).toBe(4.25);
        expect(report.totals.reviewCount).toBe(40);
    });

    it("distributes stock levels into the four buckets", async () => {
        countDocuments.mockImplementation(async (filter: Record<string, unknown>) => {
            const q = filter?.quentity as
                | number
                | { $gt?: number; $gte?: number }
                | undefined;
            // outOfStock uses a scalar equality; the other buckets use operators.
            if (q === 0) return 1;
            if (q === undefined || typeof q === "number") return 0;
            if (q.$gt === 0) return 2;
            if (q.$gte === 5) return 3;
            if (q.$gte === 20) return 4;
            return 0;
        });

        const report = await buildCorporateReport();

        expect(report.inventory.outOfStock).toBe(1);
        expect(report.inventory.lowStock).toBe(2);
        expect(report.inventory.mediumStock).toBe(3);
        expect(report.inventory.highStock).toBe(4);
    });

    it("picks the highest and lowest priced products", async () => {
        findOne.mockImplementation(() => ({
            sort: () => ({
                select: () => ({
                    populate: () => ({
                        lean: async () => ({
                            name: "Expensive",
                            generalPrice: { currentPrice: 999 },
                            category: { name: "Luxury" },
                        }),
                    }),
                }),
            }),
        }));

        const report = await buildCorporateReport();

        expect(report.inventory.highestPriced).toEqual({
            name: "Expensive",
            price: 999,
            category: "Luxury",
        });
        expect(report.inventory.lowestPriced).toEqual({
            name: "Expensive",
            price: 999,
            category: "Luxury",
        });
    });

    it("normalises an unwrapped array result from findOne", async () => {
        findOne.mockImplementation(() => ({
            sort: () => ({
                select: () => ({
                    populate: () => ({
                        lean: async () => [
                            { name: "A", generalPrice: { currentPrice: 5 }, category: "Cat" },
                        ],
                    }),
                }),
            }),
        }));

        const report = await buildCorporateReport();
        expect(report.inventory.highestPriced?.name).toBe("A");
    });

    it("falls back to placeholder values for an unnamed product", async () => {
        findOne.mockImplementation(() => ({
            sort: () => ({
                select: () => ({
                    populate: () => ({ lean: async () => ({ _id: "x" }) }),
                }),
            }),
        }));

        const report = await buildCorporateReport();
        expect(report.inventory.highestPriced).toEqual({
            name: "—",
            price: 0,
            category: "Uncategorized",
        });
    });

    it("reports null for priced products when the collection is empty", async () => {
        const report = await buildCorporateReport();
        expect(report.inventory.highestPriced).toBeNull();
        expect(report.inventory.lowestPriced).toBeNull();
    });

    it("maps lifetime top categories with revenue shares", async () => {
        aggregate.mockImplementation(async (pipeline: unknown[]) => {
            const s = JSON.stringify(pipeline);
            if (s.includes("productCount")) {
                return [
                    { category: "Tools", revenue: 600, productCount: 3 },
                    { category: "Toys", revenue: 400, productCount: 2 },
                ] as never;
            }
            return [] as never;
        });

        const report = await buildCorporateReport();

        expect(report.topCategories[0].sharePct).toBe(60);
        expect(report.topCategories[1].sharePct).toBe(40);
    });

    it("supplies 'Uncategorized' when a top category has no name", async () => {
        aggregate.mockImplementation(async (pipeline: unknown[]) => {
            const s = JSON.stringify(pipeline);
            if (s.includes("productCount")) {
                return [{ category: null, revenue: 10, productCount: 1 }] as never;
            }
            return [] as never;
        });

        const report = await buildCorporateReport();
        expect(report.topCategories[0].category).toBe("Uncategorized");
    });

    it("computes lifetime payment shares against payment revenue", async () => {
        aggregate.mockImplementation(async (pipeline: unknown[]) => {
            const s = JSON.stringify(pipeline);
            if (s.includes("paymentMethod")) {
                return [
                    { _id: "cash-on-delivery", count: 3, revenue: 300 },
                    { _id: "nagad", count: 1, revenue: 100 },
                ] as never;
            }
            return [] as never;
        });

        const report = await buildCorporateReport();

        expect(report.paymentMix[0].label).toBe("Cash on Delivery");
        expect(report.paymentMix[0].sharePct).toBe(75);
        expect(report.paymentMix[1].label).toBe("Nagad");
    });

    it("falls back to 'unknown' for a lifetime payment method", async () => {
        aggregate.mockImplementation(async (pipeline: unknown[]) => {
            const s = JSON.stringify(pipeline);
            if (s.includes("paymentMethod")) {
                return [{ _id: null, count: 1, revenue: 1 }] as never;
            }
            return [] as never;
        });

        const report = await buildCorporateReport();
        expect(report.paymentMix[0].method).toBe("unknown");
    });

    it("emits a dense 12-month trailing series", async () => {
        const report = await buildCorporateReport();
        expect(report.trailingMonths).toHaveLength(12);
    });

    it("does not divide by zero when there are no orders at all", async () => {
        const report = await buildCorporateReport();

        expect(report.fulfilment.deliveryRatePct).toBe(0);
        expect(report.fulfilment.cancellationRatePct).toBe(0);
        expect(report.fulfilment.pendingRatePct).toBe(0);
    });
});
