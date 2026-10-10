import { beforeEach, describe, expect, it, vi } from "vitest";

const { connectDb, orderModel } = vi.hoisted(() => ({
    connectDb: vi.fn(),
    orderModel: {
        find: vi.fn(),
        countDocuments: vi.fn(),
    },
}));

vi.mock("@/lib/connectdb", () => ({ default: connectDb }));
vi.mock("@/models/order.model", () => ({ default: orderModel }));

import { GET } from "@/app/api/order-draft/list/route";

function requestFor(query: string) {
    return {
        url: `https://example.com/api/order-draft/list${query}`,
    } as unknown as Parameters<typeof GET>[0];
}

/** Fluent chain used by the list handler. */
function listChain(result: unknown[]) {
    const chain: Record<string, unknown> = {};
    chain.sort = vi.fn(() => chain);
    chain.skip = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.populate = vi.fn(() => chain);
    chain.lean = vi.fn(() => Promise.resolve(result));
    return chain;
}

beforeEach(() => {
    connectDb.mockResolvedValue(undefined);
    orderModel.find.mockReturnValue(listChain([{ _id: "o1" }]));
    orderModel.countDocuments.mockResolvedValue(1);
    vi.spyOn(console, "error").mockImplementation(() => { });
});

describe("GET /api/order-draft/list", () => {
    it("lists incomplete, non-deleted drafts by default", async () => {
        const res = await GET(requestFor(""));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data).toEqual([{ _id: "o1" }]);
        expect(orderModel.find).toHaveBeenCalledWith({
            isCompleted: false,
            isDeleted: false,
            orderStatus: "draft",
        });
    });

    it("filters by the abandoned status when requested", async () => {
        await GET(requestFor("?status=abandoned"));
        expect(orderModel.find).toHaveBeenCalledWith(
            expect.objectContaining({ orderStatus: "abandoned" }),
        );
    });

    it("ignores an unknown status value", async () => {
        await GET(requestFor("?status=bogus"));
        expect(orderModel.find).toHaveBeenCalledWith({
            isCompleted: false,
            isDeleted: false,
        });
    });

    it("sorts by most recent activity first", async () => {
        const chain = listChain([]);
        orderModel.find.mockReturnValue(chain);
        await GET(requestFor(""));
        expect(chain.sort).toHaveBeenCalledWith({ lastActivityAt: -1 });
    });

    it("paginates with a default page of 1 and limit of 50", async () => {
        const chain = listChain([]);
        orderModel.find.mockReturnValue(chain);
        orderModel.countDocuments.mockResolvedValue(120);

        const res = await GET(requestFor(""));
        const json = await res.json();

        expect(chain.skip).toHaveBeenCalledWith(0);
        expect(chain.limit).toHaveBeenCalledWith(50);
        expect(json.pagination).toEqual({
            total: 120,
            page: 1,
            limit: 50,
            totalPages: 3,
        });
    });

    it("computes skip from the requested page", async () => {
        const chain = listChain([]);
        orderModel.find.mockReturnValue(chain);
        await GET(requestFor("?page=3&limit=10"));
        expect(chain.skip).toHaveBeenCalledWith(20);
        expect(chain.limit).toHaveBeenCalledWith(10);
    });

    it("caps the limit at 100", async () => {
        const chain = listChain([]);
        orderModel.find.mockReturnValue(chain);
        await GET(requestFor("?limit=1000"));
        expect(chain.limit).toHaveBeenCalledWith(100);
    });

    it("clamps a negative page to 1", async () => {
        const chain = listChain([]);
        orderModel.find.mockReturnValue(chain);
        await GET(requestFor("?page=-5"));
        expect(chain.skip).toHaveBeenCalledWith(0);
    });

    it("populates the products field with the display columns", async () => {
        const chain = listChain([]);
        orderModel.find.mockReturnValue(chain);
        await GET(requestFor(""));
        expect(chain.populate).toHaveBeenCalledWith(
            "products",
            "name images generalPrice",
        );
    });

    it("returns 500 with a generic message when the query fails", async () => {
        orderModel.find.mockImplementation(() => {
            throw new Error("db down");
        });
        const res = await GET(requestFor(""));
        expect(res.status).toBe(500);
        expect((await res.json()).message).toBe("Failed to fetch drafts");
    });
});
