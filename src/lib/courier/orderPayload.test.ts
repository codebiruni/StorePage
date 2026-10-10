import { beforeEach, describe, expect, it, vi } from "vitest";

const { find, populate } = vi.hoisted(() => {
    const populate = vi.fn();
    const find = vi.fn(() => ({ populate }));
    return { find, populate };
});

vi.mock("@/models/order.model", () => ({ default: { find } }));

import {
    buildCourierResponse,
    codAmount,
    fetchActiveOrders,
    itemCount,
    itemDescription,
} from "@/lib/courier/orderPayload";
import type { IOrder } from "@/interface/order.interface";

const baseOrder = {
    orderId: "ORD-1001",
    paymentMethod: "cash-on-delivery",
    grandTotal: 1500,
} as unknown as IOrder;

describe("lib/courier/orderPayload › buildCourierResponse", () => {
    it("counts successes and failures", () => {
        const result = buildCourierResponse([
            { orderId: "1", orderNumber: "A", status: "success", courierName: "pathao", message: "ok" },
            { orderId: "2", orderNumber: "B", status: "error", courierName: "pathao", message: "bad" },
            { orderId: "3", orderNumber: "C", status: "success", courierName: "redx", message: "ok" },
        ]);

        expect(result.successful).toBe(2);
        expect(result.failed).toBe(1);
        expect(result.results).toHaveLength(3);
    });

    it("handles an empty result set", () => {
        const result = buildCourierResponse([]);
        expect(result).toEqual({ results: [], successful: 0, failed: 0 });
    });
});

describe("lib/courier/orderPayload › codAmount", () => {
    it("returns the grand total for cash-on-delivery", () => {
        expect(codAmount(baseOrder)).toBe(1500);
    });

    it("returns 0 for prepaid orders", () => {
        const prepaid = { ...baseOrder, paymentMethod: "bkash" } as unknown as IOrder;
        expect(codAmount(prepaid)).toBe(0);
    });
});

describe("lib/courier/orderPayload › itemDescription", () => {
    it("joins populated product names with a comma", () => {
        const order = {
            ...baseOrder,
            products: [{ name: "Shirt" }, { name: "Pant" }],
        } as unknown as IOrder;
        expect(itemDescription(order)).toBe("Shirt, Pant");
    });

    it("uses the raw string when a product entry is a bare id", () => {
        const order = { ...baseOrder, products: ["id1", "id2"] } as unknown as IOrder;
        expect(itemDescription(order)).toBe("id1, id2");
    });

    it("skips products that expose no name, title, or string value", () => {
        const order = {
            ...baseOrder,
            products: [{ name: "Shirt" }, {}, null],
        } as unknown as IOrder;
        expect(itemDescription(order)).toBe("Shirt");
    });

    it("falls back to the order number when there are no products", () => {
        expect(itemDescription(baseOrder)).toBe("Order ORD-1001");
    });

    it("prefers `title` when a product has no `name`", () => {
        const order = {
            ...baseOrder,
            products: [{ title: "Cap" }],
        } as unknown as IOrder;
        expect(itemDescription(order)).toBe("Cap");
    });
});

describe("lib/courier/orderPayload › itemCount", () => {
    it("counts the products array", () => {
        const order = { ...baseOrder, products: ["a", "b", "c"] } as unknown as IOrder;
        expect(itemCount(order)).toBe(3);
    });

    it("returns 1 when products is not an array", () => {
        expect(itemCount(baseOrder)).toBe(1);
    });
});

describe("lib/courier/orderPayload › fetchActiveOrders", () => {
    beforeEach(() => {
        find.mockClear();
        populate.mockReset();
    });

    it("throws when no order ids are supplied", async () => {
        await expect(fetchActiveOrders([])).rejects.toThrowError(
            "Order IDs are required.",
        );
        expect(find).not.toHaveBeenCalled();
    });

    it("throws when order ids are undefined", async () => {
        // @ts-expect-error — exercising the defensive guard
        await expect(fetchActiveOrders(undefined)).rejects.toThrowError(
            "Order IDs are required.",
        );
    });

    it("queries only completed, non-deleted orders and populates products", async () => {
        populate.mockResolvedValue([{ _id: "1" }]);

        const orders = await fetchActiveOrders(["1", "2"]);

        // `isCompleted: true` is required: drafts lack an orderId, recipient
        // and products, so they must never be handed to a courier.
        expect(find).toHaveBeenCalledWith({
            _id: { $in: ["1", "2"] },
            isDeleted: false,
            isCompleted: true,
        });
        expect(populate).toHaveBeenCalledWith("products");
        expect(orders).toEqual([{ _id: "1" }]);
    });

    it("returns an empty array when nothing matches", async () => {
        populate.mockResolvedValue([]);
        await expect(fetchActiveOrders(["missing"])).resolves.toEqual([]);
    });
});
