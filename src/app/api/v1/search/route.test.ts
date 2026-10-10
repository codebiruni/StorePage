import { beforeEach, describe, expect, it, vi } from "vitest";

const { connectDb, product, category, subCategory } = vi.hoisted(() => ({
    connectDb: vi.fn(),
    product: { find: vi.fn() },
    category: { find: vi.fn() },
    subCategory: { find: vi.fn() },
}));

vi.mock("@/lib/connectdb", () => ({ default: connectDb }));
vi.mock("@/models/product.model", () => ({ default: product }));
vi.mock("@/models/category.model", () => ({ default: category }));
vi.mock("@/models/sub-category.model", () => ({ default: subCategory }));

import { GET } from "@/app/api/v1/search/route";

/** Build the fluent chain the route uses for each model. */
function queryChain(result: unknown[]) {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.populate = vi.fn(() => chain);
    chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
    return chain;
}

function requestFor(query: string) {
    return {
        url: `https://example.com/api/v1/search${query}`,
    } as unknown as Parameters<typeof GET>[0];
}

beforeEach(() => {
    connectDb.mockResolvedValue(undefined);
    product.find.mockReturnValue(queryChain([{ name: "P1" }]));
    category.find.mockReturnValue(queryChain([{ name: "C1" }]));
    subCategory.find.mockReturnValue(queryChain([{ name: "S1" }]));
    vi.spyOn(console, "error").mockImplementation(() => { });
});

describe("GET /api/v1/search", () => {
    it("returns empty buckets when no search term is supplied", async () => {
        const res = await GET(requestFor(""));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.data).toEqual({ products: [], categories: [], subCategories: [] });
        expect(json.meta.totalResults).toBe(0);
        expect(json.message).toBe("No search term provided");
        expect(product.find).not.toHaveBeenCalled();
    });

    it("returns combined results when a search term is supplied", async () => {
        const res = await GET(requestFor("?search=shirt"));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.data.products).toEqual([{ name: "P1" }]);
        expect(json.data.categories).toEqual([{ name: "C1" }]);
        expect(json.data.subCategories).toEqual([{ name: "S1" }]);
        expect(json.meta.totalResults).toBe(3);
        expect(json.meta.searchTerm).toBe("shirt");
        expect(json.message).toBe("Search results fetched successfully");
    });

    it("defaults the limit to 30 when not provided", async () => {
        const res = await GET(requestFor("?search=x"));
        const json = await res.json();
        expect(json.meta.limit).toBe(30);
    });

    it("honours an explicit limit", async () => {
        const res = await GET(requestFor("?search=x&limit=5"));
        const json = await res.json();
        expect(json.meta.limit).toBe(5);
    });

    it("excludes soft-deleted documents from every query", async () => {
        await GET(requestFor("?search=x"));
        expect(product.find).toHaveBeenCalledWith(
            expect.objectContaining({ isDeleted: false }),
        );
        expect(category.find).toHaveBeenCalledWith(
            expect.objectContaining({ isDeleted: false }),
        );
    });

    it("builds a case-insensitive regex across product fields", async () => {
        await GET(requestFor("?search=Blue"));
        const arg = product.find.mock.calls[0][0] as {
            $or: Array<Record<string, unknown>>;
        };
        expect(arg.$or).toHaveLength(3);
        expect(arg.$or[0]).toEqual({ name: { $regex: "Blue", $options: "i" } });
        expect(arg.$or[1]).toEqual({ brand: { $regex: "Blue", $options: "i" } });
    });

    it("searches only the name for categories and sub-categories", async () => {
        await GET(requestFor("?search=Blue"));
        expect(category.find).toHaveBeenCalledWith({
            isDeleted: false,
            name: { $regex: "Blue", $options: "i" },
        });
    });

    it("populates the category name on sub-category results", async () => {
        const chain = queryChain([]);
        subCategory.find.mockReturnValue(chain);
        await GET(requestFor("?search=x"));
        expect(chain.populate).toHaveBeenCalledWith("category", "name");
    });

    it("returns 500 with the error message when the DB throws", async () => {
        product.find.mockImplementation(() => {
            throw new Error("db down");
        });
        const res = await GET(requestFor("?search=x"));
        expect(res.status).toBe(500);
        expect((await res.json()).message).toBe("db down");
    });

    it("falls back to a generic message when the error has no message", async () => {
        product.find.mockImplementation(() => {
            throw {};
        });
        const res = await GET(requestFor("?search=x"));
        expect(res.status).toBe(500);
        expect((await res.json()).message).toBe("Failed to fetch search results");
    });
});
