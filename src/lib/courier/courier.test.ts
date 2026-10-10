import { beforeEach, describe, expect, it, vi } from "vitest";

// `ensurePathaoToken` persists the refreshed token via `SiteInfo.updateOne`
// and `loadCourierCreds` calls `connectDb()` + `SiteInfo.findOne()`. Both hit
// the real database, so they must be mocked before importing the module.
// `vi.hoisted` keeps these above the hoisted `vi.mock` factories.
const { updateOne, findOne, connectDb } = vi.hoisted(() => ({
  updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
  findOne: vi.fn(),
  connectDb: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/connectdb", () => ({ default: connectDb }));
vi.mock("@/models/siteInfo.model", () => ({
  default: { findOne, updateOne },
}));

import {
  DEFAULTS,
  ensurePathaoToken,
  isPathaoConfigured,
  isRedXConfigured,
  isSteadfastConfigured,
  loadCourierCreds,
  normalizePhone,
  stripSlash,
} from "@/lib/courier";
import type { ICourierCredentials } from "@/interface/siteInfo.interface";

describe("lib/courier › defaults", () => {
  it("exposes the canonical provider base URLs", () => {
    expect(DEFAULTS.pathao).toBe("https://api-hermes.pathao.com");
    expect(DEFAULTS.steadfast).toBe("https://portal.packzy.com/api/v1");
    expect(DEFAULTS.redx).toBe("https://openapi.redx.com.bd/v1.0.0-beta");
  });
});

describe("lib/courier › stripSlash", () => {
  it("removes a single trailing slash", () => {
    expect(stripSlash("https://api.example.com/")).toBe("https://api.example.com");
  });

  it("leaves a URL without a trailing slash untouched", () => {
    expect(stripSlash("https://api.example.com")).toBe("https://api.example.com");
  });

  it("collapses repeated trailing slashes into none", () => {
    expect(stripSlash("https://api.example.com//")).toBe("https://api.example.com/");
  });
});

describe("lib/courier › configuration predicates", () => {
  it("treats an empty credential object as unconfigured", () => {
    const c = {} as ICourierCredentials;
    expect(isPathaoConfigured(c)).toBe(false);
    expect(isSteadfastConfigured(c)).toBe(false);
    expect(isRedXConfigured(c)).toBe(false);
  });

  it("requires every Pathao field", () => {
    const partial = {
      pathaoBaseUrl: DEFAULTS.pathao,
      pathaoStoreId: "1",
      pathaoClientId: "cid",
      pathaoClientSecret: "secret",
      pathaoClientEmail: "a@b.com",
    } as ICourierCredentials;
    expect(isPathaoConfigured(partial)).toBe(false);

    const full = { ...partial, pathaoClientPassword: "pw" } as ICourierCredentials;
    expect(isPathaoConfigured(full)).toBe(true);
  });

  it("requires both Steadfast keys", () => {
    expect(
      isSteadfastConfigured({ steadfastApiKey: "k" } as ICourierCredentials),
    ).toBe(false);
    expect(
      isSteadfastConfigured({
        steadfastApiKey: "k",
        steadfastSecretKey: "s",
      } as ICourierCredentials),
    ).toBe(true);
  });

  it("requires the RedX token", () => {
    expect(isRedXConfigured({ redxApiToken: "" } as ICourierCredentials)).toBe(false);
    expect(isRedXConfigured({ redxApiToken: "t" } as ICourierCredentials)).toBe(true);
  });
});

describe("lib/courier › normalizePhone", () => {
  it("strips a 880 country code", () => {
    expect(normalizePhone("8801712345678")).toBe("01712345678");
  });

  it("strips a bare 88 country code", () => {
    expect(normalizePhone("881712345678")).toBe("1712345678");
  });

  it("removes non-digit formatting characters", () => {
    expect(normalizePhone("+880 1712-345 678")).toBe("01712345678");
    expect(normalizePhone("(017) 123 45678")).toBe("01712345678");
  });

  it("passes through an already-normalised 11-digit number", () => {
    expect(normalizePhone("01712345678")).toBe("01712345678");
  });

  it("returns an empty string when there are no digits", () => {
    expect(normalizePhone("")).toBe("");
    expect(normalizePhone("abc")).toBe("");
  });
});

describe("lib/courier › loadCourierCreds", () => {
  beforeEach(() => {
    findOne.mockReset();
    connectDb.mockClear();
  });

  it("returns the courier subdocument from the siteInfo doc", async () => {
    findOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ courier: { redxApiToken: "t" } }),
      }),
    });

    const creds = await loadCourierCreds();
    expect(creds).toEqual({ redxApiToken: "t" });
    expect(connectDb).toHaveBeenCalled();
  });

  it("falls back to an empty object when no siteInfo document exists", async () => {
    findOne.mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    });

    await expect(loadCourierCreds()).resolves.toEqual({});
  });
});

describe("lib/courier › ensurePathaoToken", () => {
  beforeEach(() => {
    updateOne.mockClear();
    updateOne.mockResolvedValue({ acknowledged: true });
  });

  it("reuses a cached token that is still valid", async () => {
    const creds = {
      pathaoBaseUrl: DEFAULTS.pathao,
      pathaoClientId: "cid",
      pathaoClientSecret: "secret",
      pathaoAccessToken: "cached",
      pathaoTokenExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    } as ICourierCredentials;

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await ensurePathaoToken(creds);

    expect(result).toBe(creds);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("refreshes when the token expires within 60 seconds", async () => {
    const creds = {
      pathaoBaseUrl: DEFAULTS.pathao,
      pathaoClientId: "cid",
      pathaoClientSecret: "secret",
      pathaoRefreshToken: "refresh-me",
      pathaoAccessToken: "almost-expired",
      pathaoTokenExpiresAt: new Date(Date.now() + 30_000).toISOString(),
    } as ICourierCredentials;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "new-access",
          refresh_token: "new-refresh",
          expires_in: 300,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await ensurePathaoToken(creds);
    expect(result.pathaoAccessToken).toBe("new-access");
    expect(result.pathaoRefreshToken).toBe("new-refresh");
    // Expiry is set to expires_in minus a 60s safety margin.
    const expires = new Date(result.pathaoTokenExpiresAt as string).getTime();
    expect(expires).toBeGreaterThan(Date.now() + 200_000);
    expect(expires).toBeLessThan(Date.now() + 260_000);
    expect(updateOne).toHaveBeenCalledTimes(1);
  });

  it("uses the refresh_token grant when a refresh token exists", async () => {
    const creds = {
      pathaoBaseUrl: DEFAULTS.pathao,
      pathaoClientId: "cid",
      pathaoClientSecret: "secret",
      pathaoRefreshToken: "refresh-me",
    } as ICourierCredentials;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: "a", refresh_token: "r", expires_in: 300 }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    await ensurePathaoToken(creds);
    const [, init] = fetchSpy.mock.calls[0];
    expect(JSON.parse(String(init?.body)).grant_type).toBe("refresh_token");
  });

  it("falls back to a password grant when no refresh token exists", async () => {
    const creds = {
      pathaoBaseUrl: DEFAULTS.pathao,
      pathaoClientId: "cid",
      pathaoClientSecret: "secret",
      pathaoClientEmail: "owner@shop.com",
      pathaoClientPassword: "hunter2",
    } as ICourierCredentials;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "pw-access",
          refresh_token: "pw-refresh",
          expires_in: 600,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await ensurePathaoToken(creds);
    expect(result.pathaoAccessToken).toBe("pw-access");

    const [, init] = fetchSpy.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.grant_type).toBe("password");
    expect(body.username).toBe("owner@shop.com");
    expect(body.client_id).toBe("cid");
  });

  it("strips a trailing slash from the base URL when building the token endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: "a", refresh_token: "r", expires_in: 300 }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    await ensurePathaoToken({
      pathaoBaseUrl: "https://api-hermes.pathao.com/",
      pathaoClientId: "cid",
      pathaoClientSecret: "secret",
      pathaoClientEmail: "a@b.com",
      pathaoClientPassword: "pw",
    } as ICourierCredentials);

    expect(fetchSpy.mock.calls[0][0]).toBe(
      "https://api-hermes.pathao.com/aladdin/api/v1/issue-token",
    );
  });

  it("throws when Pathao is not configured with client credentials", async () => {
    await expect(
      ensurePathaoToken({ pathaoBaseUrl: DEFAULTS.pathao } as ICourierCredentials),
    ).rejects.toThrowError(/Pathao is not configured/);
  });

  it("throws when the token endpoint rejects the request", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 401 }));

    await expect(
      ensurePathaoToken({
        pathaoBaseUrl: DEFAULTS.pathao,
        pathaoClientId: "cid",
        pathaoClientSecret: "secret",
        pathaoClientEmail: "a@b.com",
        pathaoClientPassword: "pw",
      } as ICourierCredentials),
    ).rejects.toThrowError(/Failed to issue Pathao access token/);
  });

  it("throws when the token endpoint returns an incomplete payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "only" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      ensurePathaoToken({
        pathaoBaseUrl: DEFAULTS.pathao,
        pathaoClientId: "cid",
        pathaoClientSecret: "secret",
        pathaoClientEmail: "a@b.com",
        pathaoClientPassword: "pw",
      } as ICourierCredentials),
    ).rejects.toThrowError(/Failed to issue Pathao access token/);
  });

  it("throws when the network call itself fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(
      ensurePathaoToken({
        pathaoBaseUrl: DEFAULTS.pathao,
        pathaoClientId: "cid",
        pathaoClientSecret: "secret",
        pathaoClientEmail: "a@b.com",
        pathaoClientPassword: "pw",
      } as ICourierCredentials),
    ).rejects.toThrowError(/Failed to issue Pathao access token/);
  });
});
