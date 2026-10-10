import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

// Mock the DB and the product-tag helper before importing the route so the
// handler never touches a real MongoDB connection.
const { connectDb, getSiteConfig, productTag, revalidatePath, revalidateTag } =
    vi.hoisted(() => ({
        connectDb: vi.fn(),
        getSiteConfig: vi.fn(),
        productTag: vi.fn((id: string) => `product:${id}`),
        revalidatePath: vi.fn(),
        revalidateTag: vi.fn(),
    }));

const orderModel = vi.hoisted(() => ({
    findOneAndUpdate: vi.fn(),
    create: vi.fn(),
}));

vi.mock("@/lib/connectdb", () => ({ default: connectDb }));
vi.mock("@/lib/siteConfig", () => ({ getSiteConfig }));
vi.mock("@/app/step/_lib/landing-data", () => ({ productTag }));
vi.mock("@/models/order.model", () => ({ default: orderModel }));
vi.mock("next/cache", () => ({ revalidatePath, revalidateTag }));

import { GET, POST } from "@/app/api/landing-orders/route";

const PRODUCT_ID = new Types.ObjectId().toString();
const DRAFT_ID = new Types.ObjectId().toString();

function jsonRequest(body: unknown) {
    return {
        json: async () => body,
    } as unknown as Parameters<typeof POST>[0];
}

function validBody(overrides: Record<string, unknown> = {}) {
    return {
        productId: PRODUCT_ID,
        customerName: "Jane Doe",
        customerPhone: "01712345678",
        customerAddress: "12 Example Road, Dhaka",
        ...overrides,
    };
}

const fakeOrder = {
    _id: { toString: () => "order-object-id" },
    orderId: "ORD-1",
};

beforeEach(() => {
    connectDb.mockResolvedValue(undefined);
    getSiteConfig.mockResolvedValue({
        deliveryCharge: { outsideDhaka: 120 },
    });
    orderModel.create.mockResolvedValue(fakeOrder);
    orderModel.findOneAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
    });
    vi.spyOn(console, "error").mockImplementation(() => { });
});

describe("POST /api/landing-orders", () => {
    it("creates an order and returns 201 with the id and ref", async () => {
        const res = await POST(jsonRequest(validBody()));
        const json = await res.json();

        expect(res.status).toBe(201);
        expect(json).toEqual({ ok: true, orderId: "order-object-id", ref: "ORD-1" });
        expect(orderModel.create).toHaveBeenCalledTimes(1);
    });

    it("applies the outside-Dhaka delivery charge from site config", async () => {
        await POST(jsonRequest(validBody()));
        expect(orderModel.create).toHaveBeenCalledWith(
            expect.objectContaining({ deliveryCharge: 120, grandTotal: 120 }),
        );
    });

    it("marks the order as a pending cash-on-delivery landing order", async () => {
        await POST(jsonRequest(validBody()));
        expect(orderModel.create).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentMethod: "cash-on-delivery",
                paymentStatus: "pending",
                orderStatus: "pending",
                source: "landing",
            }),
        );
    });

    it("prefixes the note with the variant sku when one is supplied", async () => {
        await POST(jsonRequest(validBody({ variantSku: "SKU-9", note: "gift wrap" })));
        expect(orderModel.create).toHaveBeenCalledWith(
            expect.objectContaining({ note: "[SKU-9] gift wrap" }),
        );
    });

    it("returns 400 on malformed JSON", async () => {
        const req = {
            json: async () => {
                throw new SyntaxError("bad json");
            },
        } as unknown as Parameters<typeof POST>[0];
        const res = await POST(req);
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Invalid JSON");
    });

    it("returns 400 for an invalid productId", async () => {
        const res = await POST(jsonRequest(validBody({ productId: "not-an-id" })));
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Invalid productId");
        expect(orderModel.create).not.toHaveBeenCalled();
    });

    it("returns 400 when the name is too short", async () => {
        const res = await POST(jsonRequest(validBody({ customerName: "J" })));
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Name required");
    });

    it("returns 400 for a malformed phone number", async () => {
        const res = await POST(jsonRequest(validBody({ customerPhone: "abc" })));
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Phone invalid");
    });

    it("accepts a phone number with separators", async () => {
        const res = await POST(
            jsonRequest(validBody({ customerPhone: "+880 171-234 56" })),
        );
        expect(res.status).toBe(201);
    });

    it("returns 400 when the address is too short", async () => {
        const res = await POST(jsonRequest(validBody({ customerAddress: "abc" })));
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Address required");
    });

    it("promotes an existing draft when draftId is valid", async () => {
        const promoted = { _id: { toString: () => "promoted-id" }, orderId: "ORD-D" };
        orderModel.findOneAndUpdate.mockReturnValue({
            lean: vi.fn().mockResolvedValue(promoted),
        });

        const res = await POST(jsonRequest(validBody({ draftId: DRAFT_ID })));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({
            ok: true,
            orderId: "promoted-id",
            ref: "ORD-D",
            promotedFromDraft: true,
        });
        expect(orderModel.create).not.toHaveBeenCalled();
    });

    it("falls back to creating an order when the draft no longer exists", async () => {
        orderModel.findOneAndUpdate.mockReturnValue({
            lean: vi.fn().mockResolvedValue(null),
        });
        const res = await POST(jsonRequest(validBody({ draftId: DRAFT_ID })));
        expect(res.status).toBe(201);
        expect(orderModel.create).toHaveBeenCalledTimes(1);
    });

    it("ignores a draftId that is not a valid ObjectId", async () => {
        const res = await POST(jsonRequest(validBody({ draftId: "nope" })));
        expect(res.status).toBe(201);
        expect(orderModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("returns 500 with a generic message when the DB write throws", async () => {
        orderModel.create.mockRejectedValue(new Error("boom"));
        const res = await POST(jsonRequest(validBody()));
        expect(res.status).toBe(500);
        expect((await res.json()).message).toBe("Order could not be placed");
    });

    it("maps a Mongoose ValidationError to a friendly message", async () => {
        const err = new Error("validation");
        err.name = "ValidationError";
        orderModel.create.mockRejectedValue(err);
        const res = await POST(jsonRequest(validBody()));
        expect(res.status).toBe(500);
        expect((await res.json()).message).toBe("Validation failed");
    });

    it("revalidates the product cache without blocking the response", async () => {
        await POST(jsonRequest(validBody()));
        // The revalidation is scheduled on a microtask; flush it.
        await Promise.resolve();
        await Promise.resolve();
        expect(revalidateTag).toHaveBeenCalledWith(`product:${PRODUCT_ID}`, "default");
        expect(revalidatePath).toHaveBeenCalledWith(`/step/${PRODUCT_ID}`);
    });
});

describe("GET /api/landing-orders", () => {
    it("responds with a health payload", async () => {
        const res = await GET();
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true, route: "landing-orders" });
    });
});
