import { beforeEach, describe, expect, it, vi } from "vitest";
import { USER_ROLE } from "@/interface/auth.constent";

const { auth, connectDb, siteInfo, revalidateTag } = vi.hoisted(() => ({
    auth: vi.fn(),
    connectDb: vi.fn(),
    siteInfo: {
        deleteMany: vi.fn(),
        create: vi.fn(),
        findOne: vi.fn(),
        findOneAndDelete: vi.fn(),
    },
    revalidateTag: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/connectdb", () => ({ default: connectDb }));
vi.mock("@/models/siteInfo.model", () => ({ default: siteInfo }));
vi.mock("next/cache", () => ({ revalidateTag }));
vi.mock("@/lib/siteConfig", () => ({ SITE_CONFIG_TAG: "siteinfo:current" }));

import { DELETE, GET, PATCH, POST } from "@/app/api/v1/web-info/route";

function jsonRequest(body: unknown) {
    return {
        json: async () => body,
    } as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
    auth.mockResolvedValue({ id: "admin" });
    connectDb.mockResolvedValue(undefined);
    siteInfo.deleteMany.mockResolvedValue({ deletedCount: 1 });
    siteInfo.create.mockResolvedValue({ _id: "w1", siteName: "Shop" });
    siteInfo.findOne.mockResolvedValue({ _id: "w1", siteName: "Shop" });
    siteInfo.findOneAndDelete.mockResolvedValue({ _id: "w1" });
    vi.spyOn(console, "error").mockImplementation(() => { });
});

describe("POST /api/v1/web-info", () => {
    it("replaces any existing record and returns 201", async () => {
        const res = await POST(jsonRequest({ siteName: "Shop" }));
        const json = await res.json();

        expect(res.status).toBe(201);
        expect(json.success).toBe(true);
        expect(siteInfo.deleteMany).toHaveBeenCalledWith({});
        expect(siteInfo.create).toHaveBeenCalledWith({ siteName: "Shop" });
    });

    it("requires super-admin auth", async () => {
        await POST(jsonRequest({}));
        expect(auth).toHaveBeenCalledWith(USER_ROLE.SUPER_ADMIN);
    });

    it("busts the site config cache tag", async () => {
        await POST(jsonRequest({}));
        expect(revalidateTag).toHaveBeenCalledWith("siteinfo:current", "max");
    });

    it("returns 400 when creation fails", async () => {
        siteInfo.create.mockRejectedValue(new Error("bad payload"));
        const res = await POST(jsonRequest({}));
        expect(res.status).toBe(400);
        expect((await res.json()).message).toBe("bad payload");
    });

    it("falls back to a generic message on failure", async () => {
        siteInfo.create.mockRejectedValue({});
        const res = await POST(jsonRequest({}));
        expect((await res.json()).message).toBe("Failed to create SiteInfo");
    });
});

describe("GET /api/v1/web-info", () => {
    it("returns the single record", async () => {
        const res = await GET();
        const json = await res.json();
        expect(res.status).toBe(200);
        expect(json).toEqual({ success: true, data: { _id: "w1", siteName: "Shop" } });
    });

    it("does not require auth", async () => {
        await GET();
        expect(auth).not.toHaveBeenCalled();
    });

    it("returns 404 when nothing is stored", async () => {
        siteInfo.findOne.mockResolvedValue(null);
        const res = await GET();
        expect(res.status).toBe(404);
        expect((await res.json()).message).toBe("No SiteInfo found");
    });
});

describe("PATCH /api/v1/web-info", () => {
    it("merges the update and saves the document", async () => {
        const doc: Record<string, unknown> = { _id: "w1", siteName: "Old" };
        doc.save = vi.fn().mockResolvedValue(undefined);
        siteInfo.findOne.mockResolvedValue(doc);

        const res = await PATCH(jsonRequest({ siteName: "New" }));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(doc.siteName).toBe("New");
        expect(doc.save).toHaveBeenCalledTimes(1);
        expect(json.success).toBe(true);
    });

    it("requires super-admin auth", async () => {
        const doc: Record<string, unknown> = { save: vi.fn() };
        siteInfo.findOne.mockResolvedValue(doc);
        await PATCH(jsonRequest({}));
        expect(auth).toHaveBeenCalledWith(USER_ROLE.SUPER_ADMIN);
    });

    it("returns 404 when there is nothing to update", async () => {
        siteInfo.findOne.mockResolvedValue(null);
        const res = await PATCH(jsonRequest({ siteName: "New" }));
        expect(res.status).toBe(404);
        expect((await res.json()).message).toBe("No SiteInfo found to update");
    });
});

describe("DELETE /api/v1/web-info", () => {
    it("deletes the record and busts the cache", async () => {
        const res = await DELETE();
        expect(res.status).toBe(200);
        expect((await res.json()).message).toBe("SiteInfo deleted successfully");
        expect(revalidateTag).toHaveBeenCalledWith("siteinfo:current", "max");
    });

    it("requires super-admin auth", async () => {
        await DELETE();
        expect(auth).toHaveBeenCalledWith(USER_ROLE.SUPER_ADMIN);
    });

    it("returns 404 when there is nothing to delete", async () => {
        siteInfo.findOneAndDelete.mockResolvedValue(null);
        const res = await DELETE();
        expect(res.status).toBe(404);
        expect((await res.json()).message).toBe("No SiteInfo found to delete");
    });
});
