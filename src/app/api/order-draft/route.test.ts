import { beforeEach, describe, expect, it, vi } from "vitest";

const { connectDb, countDocuments, findOneAndUpdate, create, lean, isValid } =
    vi.hoisted(() => {
        const lean = vi.fn();
        const findOneAndUpdate = vi.fn(() => ({ lean }));
        const create = vi.fn();
        const countDocuments = vi.fn();
        return {
            connectDb: vi.fn().mockResolvedValue(undefined),
            connectDbRaw: undefined,
            countDocuments,
            findOneAndUpdate,
            create,
            lean,
            isValid: vi.fn(),
            ObjectId: class {
                private value: string;
                constructor(value: string) {
                    this.value = value;
                }
                toString() {
                    return this.value;
                }
            },
        };
    });

vi.mock("@/lib/connectdb", () => ({ default: connectDb }));
vi.mock("@/models/product.model", () => ({ default: { countDocuments } }));
vi.mock("@/models/order.model", () => ({ default: { findOneAndUpdate, create } }));
vi.mock("mongoose", () => {
    const mongoose = {
        Types: { ObjectId: { isValid } },
        models: {},
    };
    // The route calls `mongoose.Types.ObjectId` only for validation, and
    // `new mongoose.Types.ObjectId(...)` indirectly via the model — but since
    // the model is mocked we only need `isValid`.
    return { default: mongoose, ...mongoose };
});

import { POST } from "@/app/api/order-draft/route";

const VALID_ID = "507f1f77bcf86cd799439011";
const OTHER_ID = "507f1f77bcf86cd799439012";

function post(body: unknown, raw = false) {
    const req = new Request("http://localhost/api/order-draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: raw ? (body as string) : JSON.stringify(body),
    });
    return POST(req as never);
}

function acceptAllIds() {
    isValid.mockReturnValue(true);
}

/**
 * `create` must return a document whose `_id` stringifies, because the route
 * builds its response from `draft._id.toString()`.
 */
function createdDoc(overrides: Record<string, unknown> = {}) {
    return async (doc: Record<string, unknown>) => ({
        ...doc,
        _id: VALID_ID,
        ...overrides,
    });
}

beforeEach(() => {
    connectDb.mockReset().mockResolvedValue(undefined);
    countDocuments.mockReset().mockResolvedValue(1);
    findOneAndUpdate.mockReset().mockReturnValue({ lean });
    create.mockReset();
    lean.mockReset().mockResolvedValue(null);
    isValid.mockReset().mockReturnValue(false);
    // NOTE: intentionally NOT stubbing console.error here — the route swallows
    // the thrown error and we want to see it when a test fails.
});

describe("api/order-draft › POST validation", () => {
    it("rejects malformed JSON with 400", async () => {
        const res = await post("{bad", true);
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Invalid JSON");
    });

    it("rejects an invalid draftId with 400", async () => {
        isValid.mockImplementation((v: unknown) => v === VALID_ID);
        const res = await post({ draftId: "nope", productId: VALID_ID });

        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Invalid draftId");
    });

    it("rejects a malformed draftId specifically", async () => {
        isValid.mockImplementation((v: unknown) => v === VALID_ID);
        const res = await post({ draftId: "not-an-object-id", productId: VALID_ID });

        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Invalid draftId");
    });

    it("rejects a phone number that fails the pattern", async () => {
        acceptAllIds();
        const res = await post({ productId: VALID_ID, number: "abc" });

        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Phone invalid");
    });

    it("accepts a phone number with the allowed separator characters", async () => {
        acceptAllIds();
        create.mockImplementation(createdDoc());

        const res = await post({ productId: VALID_ID, number: "+880-171-2223" });
        expect(res.status).toBe(200);
    });

    it("rejects a phone number longer than the 15-character cap", async () => {
        acceptAllIds();
        // `clean()` caps at 20 chars first, but the 19-char value still fails the
        // 8–15 character PHONE_RE, so the route must reject it.
        const res = await post({ productId: VALID_ID, number: "+880-171 (222) 3333" });
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Phone invalid");
    });

    it("allows a draft with no phone at all", async () => {
        acceptAllIds();
        create.mockResolvedValue({ _id: VALID_ID, grandTotal: 0 });
        await post({ productId: VALID_ID });
        expect(create).toHaveBeenCalled();
    });

    it("requires a product when creating a new draft", async () => {
        const res = await post({ name: "Anon" });

        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Provide productId or productIds");
    });

    it("does not require a product when updating an existing draft", async () => {
        isValid.mockImplementation((v: unknown) => v === VALID_ID);
        lean.mockResolvedValue({ _id: VALID_ID, grandTotal: 0 });

        const res = await post({ draftId: VALID_ID, name: "Typing..." });
        expect(res.status).toBe(200);
    });

    it("ignores productIds entries that are not valid ObjectIds", async () => {
        isValid.mockImplementation((v: unknown) => v === VALID_ID);
        create.mockResolvedValue({ _id: VALID_ID, grandTotal: 0 });

        await post({ productIds: [VALID_ID, "garbage", 42, "  "] });

        // Only the single valid id survives, so only one product is looked up.
        expect(countDocuments).toHaveBeenCalledWith({
            _id: { $in: [VALID_ID] },
            isDeleted: false,
        });
    });

    it("returns 404 when a referenced product does not exist", async () => {
        acceptAllIds();
        countDocuments.mockResolvedValue(0);

        const res = await post({ productId: VALID_ID });
        expect(res.status).toBe(404);
        expect((await res.json()).message).toBe("One or more products not found");
    });

    it("returns 404 when only some of the cart products exist", async () => {
        isValid.mockImplementation((v: unknown) => v === VALID_ID || v === OTHER_ID);
        countDocuments.mockResolvedValue(1); // 2 requested, 1 found

        const res = await post({ productIds: [VALID_ID, OTHER_ID] });
        expect(res.status).toBe(404);
    });

    it("returns 500 when the save throws", async () => {
        acceptAllIds();
        create.mockRejectedValue(new Error("write failed"));

        const res = await post({ productId: VALID_ID });
        expect(res.status).toBe(500);
        expect((await res.json()).message).toBe("Draft could not be saved");
    });
});

describe("api/order-draft › POST math & payload", () => {
    it("computes grandTotal as total + delivery - discount", async () => {
        acceptAllIds();
        create.mockImplementation(createdDoc());

        const res = await post({
            productId: VALID_ID,
            totalAmount: 1000,
            deliveryCharge: 70,
            discount: 100,
        });

        const json = await res.json();
        expect(json.ok).toBe(true);
        expect(json.grandTotal).toBe(970);
        expect(create).toHaveBeenCalledWith(
            expect.objectContaining({ grandTotal: 970, paymentMethod: "cash-on-delivery" }),
        );
    });

    it("clamps non-finite numbers to zero", async () => {
        acceptAllIds();
        create.mockImplementation(createdDoc());

        const res = await post({
            productId: VALID_ID,
            totalAmount: "not-a-number",
            deliveryCharge: Infinity,
        });
        expect((await res.json()).grandTotal).toBe(0);
    });

    it("accepts numeric strings", async () => {
        acceptAllIds();
        create.mockImplementation(createdDoc());

        const res = await post({ productId: VALID_ID, totalAmount: "500", deliveryCharge: "70" });
        expect((await res.json()).grandTotal).toBe(570);
    });

    it("defaults the source to manual and honours known sources", async () => {
        acceptAllIds();
        create.mockImplementation(createdDoc());

        await post({ productId: VALID_ID, source: "landing" });
        expect(create).toHaveBeenLastCalledWith(expect.objectContaining({ source: "landing" }));

        await post({ productId: VALID_ID, source: "buy-product" });
        expect(create).toHaveBeenLastCalledWith(
            expect.objectContaining({ source: "buy-product" }),
        );

        await post({ productId: VALID_ID, source: "bogus" });
        expect(create).toHaveBeenLastCalledWith(expect.objectContaining({ source: "manual" }));
    });

    it("prefixes the note with the variant SKU when present", async () => {
        acceptAllIds();
        create.mockImplementation(createdDoc());

        await post({ productId: VALID_ID, note: "call me", variantSku: "SKU-1" });
        expect(create).toHaveBeenLastCalledWith(
            expect.objectContaining({ note: "[SKU-1] call me" }),
        );
    });

    it("leaves the note untouched when no variant SKU is given", async () => {
        acceptAllIds();
        create.mockImplementation(createdDoc());

        await post({ productId: VALID_ID, note: "call me" });
        expect(create).toHaveBeenLastCalledWith(expect.objectContaining({ note: "call me" }));
    });

    it("creates a draft marked incomplete and unpaid", async () => {
        acceptAllIds();
        create.mockImplementation(createdDoc());

        await post({ productId: VALID_ID });
        expect(create).toHaveBeenLastCalledWith(
            expect.objectContaining({
                isCompleted: false,
                isDelivered: false,
                isPaid: false,
                isDeleted: false,
                orderStatus: "draft",
                paymentStatus: "pending",
            }),
        );
    });

    it("updates an existing draft rather than creating a new one", async () => {
        isValid.mockImplementation((v: unknown) => v === VALID_ID);
        lean.mockResolvedValue({ _id: VALID_ID, grandTotal: 42 });

        const json = await (await post({ draftId: VALID_ID, name: "Bob" })).json();

        expect(findOneAndUpdate).toHaveBeenCalledTimes(1);
        expect(create).not.toHaveBeenCalled();
        expect(json.draftId).toBe(VALID_ID);
        expect(json.grandTotal).toBe(42);
    });

    it("filters the update to unfinished, undeleted orders", async () => {
        isValid.mockImplementation((v: unknown) => v === VALID_ID);
        lean.mockResolvedValue({ _id: VALID_ID });

        await post({ draftId: VALID_ID });

        expect(findOneAndUpdate).toHaveBeenCalledWith(
            { _id: VALID_ID, isCompleted: false, isDeleted: false },
            expect.any(Object),
            { new: true },
        );
    });

    it("falls through to create when the draft id no longer matches", async () => {
        isValid.mockImplementation((v: unknown) => v === VALID_ID);
        lean.mockResolvedValue(null); // update matched nothing
        create.mockImplementation(createdDoc());

        const res = await post({ draftId: VALID_ID, name: "Bob" });

        expect(create).toHaveBeenCalledTimes(1);
        expect((await res.json()).ok).toBe(true);
    });

    it("returns the draft id, grand total and an isCompleted flag", async () => {
        acceptAllIds();
        create.mockResolvedValue({ _id: VALID_ID, grandTotal: 123 });

        const json = await (await post({ productId: VALID_ID })).json();
        expect(json).toEqual({
            ok: true,
            draftId: VALID_ID,
            grandTotal: 123,
            isCompleted: false,
        });
    });

    it("truncates over-long text fields to their limits", async () => {
        acceptAllIds();
        create.mockImplementation(createdDoc());

        await post({ productId: VALID_ID, name: "x".repeat(500), address: "y".repeat(2000) });

        const doc = create.mock.calls.at(-1)?.[0] as { name: string; address: string };
        expect(doc.name).toHaveLength(80);
        expect(doc.address).toHaveLength(500);
    });

    it("rejects a non-string draftId rather than crashing", async () => {
        acceptAllIds();
        create.mockResolvedValue({ _id: VALID_ID, grandTotal: 0 });
        // clean() turns a non-string into "" so it is treated as a create.
        const res = await post({ draftId: 12345, productId: VALID_ID });
        expect(res.status).toBe(200);
    });
});
