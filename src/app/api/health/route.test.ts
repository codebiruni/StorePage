import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mongooseMock } = vi.hoisted(() => {
    const connection: Record<string, unknown> = {
        readyState: 0,
        host: null,
        name: null,
    };
    return {
        mongooseMock: {
            connection,
            Types: { ObjectId: { isValid: () => false } },
        },
    };
});

vi.mock("mongoose", () => ({
    default: mongooseMock,
    ...mongooseMock,
}));

import { GET } from "@/app/api/health/route";

function setState(state: number, host: string | null = null, name: string | null = null) {
    mongooseMock.connection.readyState = state;
    mongooseMock.connection.host = host;
    mongooseMock.connection.name = name;
}

describe("api/health › GET", () => {
    beforeEach(() => setState(0));
    afterEach(() => setState(0));

    it("returns 200 when MongoDB is connected", async () => {
        setState(1, "cluster0.example.net", "storepage");
        const res = await GET();

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.status).toBe("ok");
        expect(body.db.state).toBe("connected");
        expect(body.db.readyState).toBe(1);
    });

    it("returns 503 when MongoDB is disconnected", async () => {
        setState(0);
        const res = await GET();

        expect(res.status).toBe(503);
        expect((await res.json()).status).toBe("degraded");
    });

    it("returns 503 while still connecting", async () => {
        setState(2);
        const res = await GET();
        expect(res.status).toBe(503);
        expect((await res.json()).db.state).toBe("connecting");
    });

    it("returns 503 while disconnecting", async () => {
        setState(3);
        expect((await GET()).status).toBe(503);
        expect((await (await GET()).json()).db.state).toBe("disconnecting");
    });

    it("describes an unknown readyState as disconnected", async () => {
        setState(99);
        const body = await (await GET()).json();
        expect(body.db.state).toBe("disconnected");
    });

    it("sets the no-store cache header and the health-check marker", async () => {
        setState(1);
        const res = await GET();
        expect(res.headers.get("Cache-Control")).toBe("no-store, max-age=0");
        expect(res.headers.get("X-Health-Check")).toBe("storepage");
    });

    it("includes a parseable timestamp and non-negative timings", async () => {
        setState(1);
        const body = await (await GET()).json();

        expect(Number.isNaN(new Date(body.timestamp).getTime())).toBe(false);
        expect(body.uptimeSeconds).toBeTypeOf("number");
        expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
        expect(body.responseTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("reports the db host and name, defaulting to null", async () => {
        setState(1, "h", "n");
        let body = await (await GET()).json();
        expect(body.db.host).toBe("h");
        expect(body.db.name).toBe("n");

        setState(1, null, null);
        body = await (await GET()).json();
        expect(body.db.host).toBeNull();
        expect(body.db.name).toBeNull();
    });

    it("falls back to version 0.0.0 when npm_package_version is unset", async () => {
        const previous = process.env.npm_package_version;
        delete process.env.npm_package_version;

        const body = await (await GET()).json();
        expect(body.version).toBe("0.0.0");

        if (previous !== undefined) process.env.npm_package_version = previous;
    });
});
