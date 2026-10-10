import { beforeEach, describe, expect, it, vi } from "vitest";
import { USER_ROLE } from "@/interface/auth.constent";

const { auth, connectDb, subCategory } = vi.hoisted(() => ({
    auth: vi.fn(),
    connectDb: vi.fn(),
    subCategory: {
        create: vi.fn(),
        countDocuments: vi.fn(),
        find: vi.fn(),
    },
}));

vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/connectdb", () => ({ default: connectDb }));
vi.mock("@/models/sub-category.model", () => ({ default: subCategory }));

import { GET, POST } from "@/app/api/v1/sub-category/route";

function jsonRequest(body: unknown) {
    return {
        json: async () => body,
        url: "https://example.com/api/v1/sub-category",
    } as unknown as Parameters<typeof POST>[0];
}

function getRequest(query: string) {
    return {
        url: `https://example.com/api/v1/sub-category${query}`,
    } as unknown as Parameters<typeof GET>[0];
}

/** Fluent chain used by the GET handler. */
function findChain(result: unknown[]) {
    const chain: Record<string, unknown> = {};
    chain.populate = vi.fn(() => chain);
    chain.skip = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.sort = vi.fn(() => chain);
    chain.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve(result).then(resolve);
    return chain;
}

beforeEach(() => {
    auth.mockResolvedValue({ id: "admin" });
    connectDb.mockResolvedValue(undefined);
    subCategory.create.mockResolvedValue({ _id: "s1", name: "Tees" });
    subCategory.countDocuments.mockResolvedValue(2);
    subCategory.find.mockReturnValue(findChain([{ name: "Tees" }]));
    vi.spyOn(console, "error").mockImplementation(() => { });
});

describe("POST /api/v1/sub-category", () => {
    it("creates a sub-category and returns 201", async () => {
        const res = await POST(jsonRequest({ name: "Tees" }));
        const json = await res.json();

        expect(res.status).toBe(201);
        expect(json).toEqual({
            success: true,
            data: { _id: "s1", name: "Tees" },
            message: "Category created successfully",
        });
        expect(subCategory.create).toHaveBeenCalledWith({ name: "Tees" });
    });

    it("requires super-admin auth", async () => {
        await POST(jsonRequest({ name: "Tees" }));
        expect(auth).toHaveBeenCalledWith(USER_ROLE.SUPER_ADMIN);
    });

    it("connects to the database before writing", async () => {
        await POST(jsonRequest({ name: "Tees" }));
        expect(connectDb).toHaveBeenCalledTimes(1);
    });

    it("returns 400 with the error message when creation fails", async () => {
        subCategory.create.mockRejectedValue(new Error("duplicate key"));
        const res = await POST(jsonRequest({ name: "Tees" }));
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("duplicate key");
    });

    it("falls back to a generic message when the failure has none", async () => {
        subCategory.create.mockRejectedValue({});
        const res = await POST(jsonRequest({ name: "Tees" }));
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("Failed to create category");
    });
});

describe("GET /api/v1/sub-category", () => {
    it("returns paginated sub-categories", async () => {
        const res = await GET(getRequest(""));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data).toEqual([{ name: "Tees" }]);
        expect(json.pagination).toEqual({
            total: 2,
            page: 1,
            limit: 50,
            totalPages: 1,
        });
    });

    it("accepts several management roles", async () => {
        await GET(getRequest(""));
        expect(auth).toHaveBeenCalledWith(
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.ADMIN,
            USER_ROLE.MENAGER,
        );
    });

    it("builds a case-insensitive regex from the search term", async () => {
        await GET(getRequest("?search=shirt"));
        expect(subCategory.countDocuments).toHaveBeenCalledWith({
            name: { $regex: "shirt", $options: "i" },
        });
    });

    it("applies pagination skip/limit and sorts newest first", async () => {
        const chain = findChain([]);
        subCategory.find.mockReturnValue(chain);
        subCategory.countDocuments.mockResolvedValue(120);

        const res = await GET(getRequest("?page=3&limit=10"));
        const json = await res.json();

        expect(chain.skip).toHaveBeenCalledWith(20);
        expect(chain.limit).toHaveBeenCalledWith(10);
        expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(json.pagination.totalPages).toBe(12);
    });

    it("populates the parent category name", async () => {
        const chain = findChain([]);
        subCategory.find.mockReturnValue(chain);
        await GET(getRequest(""));
        expect(chain.populate).toHaveBeenCalledWith({
            path: "category",
            select: "name -_id",
        });
    });

    it("returns 400 when the query fails", async () => {
        subCategory.countDocuments.mockRejectedValue(new Error("db down"));
        const res = await GET(getRequest(""));
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("db down");
    });
});
