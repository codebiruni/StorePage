import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Model } from "mongoose";
import { adjustProductQuantities } from "@/lib/inventory";
import {
    inventoryValueAddFields,
    inventoryValueMatch,
} from "@/lib/inventoryValue";

/**
 * Build a minimal fake Mongoose model exposing just the two methods
 * `adjustProductQuantities` actually calls: `find(...).lean()` and
 * `bulkWrite(...)`.
 */
function makeModel(leanDocs: unknown[]) {
    const bulkWrite = vi.fn().mockResolvedValue({ modifiedCount: 0 });
    const lean = vi.fn().mockResolvedValue(leanDocs);
    const find = vi.fn().mockReturnValue({ lean });
    return {
        model: { find, bulkWrite } as unknown as Model<unknown>,
        find,
        lean,
        bulkWrite,
    };
}

describe("lib/inventory › adjustProductQuantities", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warnSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        warnSpy.mockRestore();
    });

    it("no-ops for an empty item list without touching the model", async () => {
        const { model, find, bulkWrite } = makeModel([]);
        const result = await adjustProductQuantities(model, []);

        expect(result).toEqual({ coerced: 0, incremented: 0 });
        expect(find).not.toHaveBeenCalled();
        expect(bulkWrite).not.toHaveBeenCalled();
    });

    it("no-ops for a null/undefined item list", async () => {
        const { model, bulkWrite } = makeModel([]);
        // @ts-expect-error — exercising the defensive `!items?.length` guard
        const result = await adjustProductQuantities(model, undefined);

        expect(result).toEqual({ coerced: 0, incremented: 0 });
        expect(bulkWrite).not.toHaveBeenCalled();
    });

    it("applies only $inc when every document is already numeric", async () => {
        const { model, bulkWrite } = makeModel([
            { _id: "a", quentity: 10 },
            { _id: "b", quentity: 5 },
        ]);
        bulkWrite.mockResolvedValueOnce({ modifiedCount: 2 });

        const result = await adjustProductQuantities(model, [
            { _id: "a", delta: -2 },
            { _id: "b", delta: 3 },
        ]);

        expect(result).toEqual({ coerced: 0, incremented: 2 });
        // A single bulkWrite call — no coercion pass needed.
        expect(bulkWrite).toHaveBeenCalledTimes(1);

        const ops = bulkWrite.mock.calls[0][0];
        expect(ops).toHaveLength(2);
        expect(ops[0].updateOne.filter).toEqual({ _id: "a", isDeleted: false });
        expect(ops[0].updateOne.update.$inc).toEqual({ quentity: -2 });
    });

    it("coerces legacy string quantities before applying the delta", async () => {
        const { model, bulkWrite } = makeModel([
            { _id: "a", quentity: "7" },
            { _id: "b", quentity: 4 },
        ]);

        const result = await adjustProductQuantities(model, [
            { _id: "a", delta: -1 },
            { _id: "b", delta: 1 },
        ]);

        expect(result.coerced).toBe(1);
        // First call = coercion $set, second = the $inc batch.
        expect(bulkWrite).toHaveBeenCalledTimes(2);

        const coerceOps = bulkWrite.mock.calls[0][0];
        expect(coerceOps).toHaveLength(1);
        expect(coerceOps[0].updateOne.filter).toEqual({ _id: "a" });
        expect(coerceOps[0].updateOne.update.$set.quentity).toBe(7);

        const incOps = bulkWrite.mock.calls[1][0];
        expect(incOps).toHaveLength(2);
    });

    it("coerces a non-finite string to 0 rather than NaN", async () => {
        const { model, bulkWrite } = makeModel([{ _id: "a", quentity: "not-a-number" }]);

        const result = await adjustProductQuantities(model, [{ _id: "a", delta: 5 }]);

        expect(result.coerced).toBe(1);
        expect(bulkWrite.mock.calls[0][0][0].updateOne.update.$set.quentity).toBe(0);
    });

    it("does not coerce null or undefined quantities", async () => {
        const { model, bulkWrite } = makeModel([
            { _id: "a", quentity: null },
            { _id: "b", quentity: undefined },
        ]);

        const result = await adjustProductQuantities(model, [
            { _id: "a", delta: 1 },
            { _id: "b", delta: 1 },
        ]);

        expect(result.coerced).toBe(0);
        expect(bulkWrite).toHaveBeenCalledTimes(1);
    });

    it("only increments non-deleted products", async () => {
        const { model, bulkWrite } = makeModel([{ _id: "a", quentity: 1 }]);

        await adjustProductQuantities(model, [{ _id: "a", delta: 1 }]);

        const ops = bulkWrite.mock.calls[0][0];
        expect(ops[0].updateOne.filter.isDeleted).toBe(false);
    });

    it("also stamps updatedAt on each increment", async () => {
        const { model, bulkWrite } = makeModel([{ _id: "a", quentity: 1 }]);

        await adjustProductQuantities(model, [{ _id: "a", delta: 1 }]);

        const update = bulkWrite.mock.calls[0][0][0].updateOne.update;
        expect(update.$set.updatedAt).toBeInstanceOf(Date);
    });

    it("reports a zero modifiedCount when bulkWrite omits it", async () => {
        const { model, bulkWrite } = makeModel([{ _id: "a", quentity: 1 }]);
        bulkWrite.mockResolvedValueOnce({});

        const result = await adjustProductQuantities(model, [{ _id: "a", delta: 1 }]);
        expect(result.incremented).toBe(0);
    });
});

describe("lib/inventoryValue › aggregation stages", () => {
    it("adds a computed inventoryValue field", () => {
        expect(inventoryValueAddFields.$addFields).toHaveProperty("inventoryValue");
    });

    it("sums per-variant MSRP stock value plus the top-level fallback", () => {
        const add = inventoryValueAddFields.$addFields.inventoryValue.$add as unknown[];
        expect(add).toHaveLength(2);

        interface VariantSum {
            $sum: { $map: { input: { $ifNull: unknown[] }; as: string } };
        }
        interface FallbackTerm {
            $multiply: {
                $toDouble: { $ifNull: [string, number] };
            }[];
        }
        const [variants, fallback] = add as [VariantSum, FallbackTerm];
        // Variant term: $sum over a $map of priceVariants
        expect(variants.$sum.$map.input.$ifNull).toEqual(["$priceVariants", []]);
        expect(variants.$sum.$map.as).toBe("v");
        // Fallback term: top-level quentity * generalPrice.currentPrice
        expect(fallback.$multiply).toHaveLength(2);
        expect(fallback.$multiply[1].$toDouble.$ifNull).toEqual([
            "$generalPrice.currentPrice",
            0,
        ]);
    });

    it("coerces every numeric input through $toDouble for legacy string data", () => {
        const json = JSON.stringify(inventoryValueAddFields.$addFields);
        // 4 coercions: variant quentity, variant regularPrice, top-level quentity,
        // top-level currentPrice.
        expect(json.match(/\$toDouble/g)?.length).toBe(4);
    });

    it("excludes deleted products in the match stage", () => {
        expect(inventoryValueMatch.$match.isDeleted).toBe(false);
    });

    it("keeps rows that have either variants or top-level stock", () => {
        const or = inventoryValueMatch.$match.$or as unknown[];
        expect(or).toHaveLength(2);
        expect(or[0]).toEqual({ "priceVariants.0": { $exists: true } });
        expect(or[1]).toEqual({ quentity: { $exists: true } });
    });
});
