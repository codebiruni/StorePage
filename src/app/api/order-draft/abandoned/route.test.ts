import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { connectDb, orderModel } = vi.hoisted(() => ({
    connectDb: vi.fn(),
    orderModel: {
        countDocuments: vi.fn(),
        updateMany: vi.fn(),
    },
}));

vi.mock("@/lib/connectdb", () => ({ default: connectDb }));
vi.mock("@/models/order.model", () => ({ default: orderModel }));

import { GET, POST } from "@/app/api/order-draft/abandoned/route";

const envBag = process.env as Record<string, string | undefined>;

function requestWith(
    body: unknown,
    headers: Record<string, string> = {},
): Parameters<typeof POST>[0] {
    return {
        headers: {
            get: (k: string) => headers[k] ?? null,
        },
        json: async () => body,
    } as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
    connectDb.mockResolvedValue(undefined);
    orderModel.countDocuments.mockResolvedValue(0);
    orderModel.updateMany.mockResolvedValue({ matchedCount: 2, modifiedCount: 2 });
    delete envBag.CRON_SECRET;
    vi.spyOn(console, "error").mockImplementation(() => { });
});

afterEach(() => {
    delete envBag.CRON_SECRET;
});

describe("POST /api/order-draft/abandoned", () => {
    it("is open when no CRON_SECRET is configured", async () => {
        const res = await POST(requestWith({}));
        expect(res.status).toBe(200);
        expect((await res.json()).ok).toBe(true);
    });

    it("rejects a mismatched cron secret with 401", async () => {
        envBag.CRON_SECRET = "s3cret";
        const res = await POST(requestWith({}, { "x-cron-secret": "wrong" }));
        expect(res.status).toBe(401);
        expect((await res.json()).message).toBe("Unauthorized");
        expect(orderModel.updateMany).not.toHaveBeenCalled();
    });

    it("accepts the matching cron secret", async () => {
        envBag.CRON_SECRET = "s3cret";
        const res = await POST(requestWith({}, { "x-cron-secret": "s3cret" }));
        expect(res.status).toBe(200);
    });

    it("marks stale drafts as abandoned and reports counts", async () => {
        const res = await POST(requestWith({ minutes: 45 }));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ ok: true, matched: 2, modified: 2, minutes: 45 });
        expect(orderModel.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({ orderStatus: "draft", isCompleted: false }),
            expect.objectContaining({ $set: expect.objectContaining({ orderStatus: "abandoned" }) }),
        );
    });

    it("defaults to a 30-minute window", async () => {
        const res = await POST(requestWith({}));
        expect((await res.json()).minutes).toBe(30);
    });

    it("caps the window at 7 days", async () => {
        const res = await POST(requestWith({ minutes: 10_000_000 }));
        expect((await res.json()).minutes).toBe(60 * 24 * 7);
    });

    it("ignores a non-positive minutes value", async () => {
        const res = await POST(requestWith({ minutes: -5 }));
        expect((await res.json()).minutes).toBe(30);
    });

    it("uses the cutoff derived from the window in the filter", async () => {
        await POST(requestWith({ minutes: 60 }));
        const filter = orderModel.updateMany.mock.calls[0][0] as {
            lastActivityAt: { $lt: Date };
        };
        const expected = Date.now() - 60 * 60 * 1000;
        expect(Math.abs(filter.lastActivityAt.$lt.getTime() - expected)).toBeLessThan(2000);
    });

    it("performs a dry run without mutating the database", async () => {
        orderModel.countDocuments.mockResolvedValue(7);
        const res = await POST(requestWith({ dryRun: true }));
        const json = await res.json();

        expect(json).toEqual({ ok: true, wouldAffect: 7, dryRun: true });
        expect(orderModel.updateMany).not.toHaveBeenCalled();
    });

    it("tolerates an unparseable body", async () => {
        const req = {
            headers: { get: () => null },
            json: async () => {
                throw new Error("bad json");
            },
        } as unknown as Parameters<typeof POST>[0];
        const res = await POST(req);
        expect(res.status).toBe(200);
    });

    it("returns 500 when the sweep fails", async () => {
        orderModel.updateMany.mockRejectedValue(new Error("db down"));
        const res = await POST(requestWith({}));
        expect(res.status).toBe(500);
        expect((await res.json()).message).toBe("Sweep failed");
    });
});

describe("GET /api/order-draft/abandoned", () => {
    it("returns a usage hint", async () => {
        const res = await GET();
        const json = await res.json();
        expect(res.status).toBe(200);
        expect(json.ok).toBe(true);
        expect(typeof json.hint).toBe("string");
    });
});
