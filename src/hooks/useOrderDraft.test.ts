import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOrderDraft } from "@/hooks/useOrderDraft";

const fetchMock = vi.fn();

function okResponse(draftId: string) {
    return {
        ok: true,
        json: async () => ({ ok: true, draftId }),
    };
}

beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(okResponse("draft-1"));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => { });
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

/** Advance past the debounce window and let the awaited fetch settle. */
async function advance(ms = 1500) {
    await act(async () => {
        vi.advanceTimersByTime(ms);
        // Let the microtask queue drain so `await res.json()` resolves.
        await Promise.resolve();
        await Promise.resolve();
    });
}

describe("hooks/useOrderDraft › initial state", () => {
    it("starts with no draft id and not saving", () => {
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));
        expect(result.current.draftId).toBeNull();
        expect(result.current.saving).toBe(false);
    });

    it("exposes saveDraft and flushNow functions", () => {
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));
        expect(result.current.saveDraft).toBeTypeOf("function");
        expect(result.current.flushNow).toBeTypeOf("function");
    });

    it("does not call the API before any saveDraft call", async () => {
        renderHook(() => useOrderDraft({ source: "landing" }));
        await advance();
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe("hooks/useOrderDraft › debounce", () => {
    it("waits for the debounce window before posting", async () => {
        const { result } = renderHook(() =>
            useOrderDraft({ source: "landing", debounceMs: 800 }),
        );

        act(() => result.current.saveDraft({ name: "Bob" }));
        await advance(700);
        expect(fetchMock).not.toHaveBeenCalled();

        await advance(200);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("collapses rapid calls into a single request", async () => {
        const { result } = renderHook(() =>
            useOrderDraft({ source: "landing", debounceMs: 300 }),
        );

        act(() => {
            result.current.saveDraft({ name: "A" });
            result.current.saveDraft({ name: "AB" });
            result.current.saveDraft({ name: "ABC" });
        });

        await advance(350);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.name).toBe("ABC");
    });

    it("defaults the debounce window to 1500ms", async () => {
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));

        act(() => result.current.saveDraft({ name: "Bob" }));
        await advance(1400);
        expect(fetchMock).not.toHaveBeenCalled();

        await advance(200);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});

describe("hooks/useOrderDraft › save guard", () => {
    it("skips the request when name, number and address are all empty", async () => {
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));

        act(() => result.current.saveDraft({}));
        await advance();
        expect(fetchMock).not.toHaveBeenCalled();

        act(() => result.current.saveDraft({ name: "" }));
        await advance();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("posts when only the name is present", async () => {
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));
        act(() => result.current.saveDraft({ name: "Bob" }));
        await advance();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("posts when only the phone number is present", async () => {
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));
        act(() => result.current.saveDraft({ number: "01700000000" }));
        await advance();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("posts when only the address is present", async () => {
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));
        act(() => result.current.saveDraft({ address: "Dhaka" }));
        await advance();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not re-post if a skipped save is followed by an empty one", async () => {
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));
        act(() => result.current.saveDraft({ productId: "p1" }));
        await advance();
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe("hooks/useOrderDraft › request payload", () => {
    it("posts to /api/order-draft", async () => {
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));
        act(() => result.current.saveDraft({ name: "Bob" }));
        await advance();

        expect(fetchMock.mock.calls[0][0]).toBe("/api/order-draft");
    });

    it("sends JSON with the source tag", async () => {
        const { result } = renderHook(() => useOrderDraft({ source: "buy-product" }));
        act(() => result.current.saveDraft({ name: "Bob" }));
        await advance();

        const init = fetchMock.mock.calls[0][1];
        expect(init.method).toBe("POST");
        expect(init.headers["content-type"]).toBe("application/json");
        expect(JSON.parse(init.body).source).toBe("buy-product");
    });

    it("includes the draftId on subsequent saves", async () => {
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));

        act(() => result.current.saveDraft({ name: "Bob" }));
        await advance();
        expect(result.current.draftId).toBe("draft-1");

        fetchMock.mockResolvedValueOnce(okResponse("draft-2"));
        act(() => result.current.saveDraft({ name: "Bobby" }));
        await advance();

        const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body);
        expect(secondBody.draftId).toBe("draft-1");
    });

    it("omits the draftId on the very first save", async () => {
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));
        act(() => result.current.saveDraft({ name: "Bob" }));
        await advance();

        expect(JSON.parse(fetchMock.mock.calls[0][1].body).draftId).toBeNull();
    });

    it("passes every draft field through untouched", async () => {
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));
        act(() =>
            result.current.saveDraft({
                productId: "p1",
                name: "Bob",
                note: "ring me",
                variantSku: "SKU",
                deliveryCharge: 70,
                totalAmount: 1000,
                discount: 50,
            }),
        );
        await advance();

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body).toMatchObject({
            productId: "p1",
            name: "Bob",
            note: "ring me",
            variantSku: "SKU",
            deliveryCharge: 70,
            totalAmount: 1000,
            discount: 50,
        });
    });
});

describe("hooks/useOrderDraft › response handling", () => {
    it("stores the returned draftId", async () => {
        fetchMock.mockResolvedValue(okResponse("abc-123"));
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));

        act(() => result.current.saveDraft({ name: "Bob" }));
        await advance();

        expect(result.current.draftId).toBe("abc-123");
    });

    it("ignores a draftId when the response is not ok", async () => {
        fetchMock.mockResolvedValue({ ok: false, json: async () => ({ draftId: "nope" }) });
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));

        act(() => result.current.saveDraft({ name: "Bob" }));
        await advance();

        expect(result.current.draftId).toBeNull();
    });

    it("ignores a response that omits the draftId", async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));

        act(() => result.current.saveDraft({ name: "Bob" }));
        await advance();

        expect(result.current.draftId).toBeNull();
    });

    it("survives an unparseable response body", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => {
                throw new Error("not json");
            },
        });
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));

        act(() => result.current.saveDraft({ name: "Bob" }));
        await advance();

        expect(result.current.draftId).toBeNull();
    });

    it("swallows a network failure and warns", async () => {
        fetchMock.mockRejectedValue(new Error("offline"));
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));

        act(() => result.current.saveDraft({ name: "Bob" }));
        await advance();

        expect(console.warn).toHaveBeenCalled();
        expect(result.current.draftId).toBeNull();
        // The hook must not stay stuck in the saving state after a failure.
        expect(result.current.saving).toBe(false);
    });
});

describe("hooks/useOrderDraft › flushNow", () => {
    it("fires the pending save immediately without waiting", async () => {
        const { result } = renderHook(() =>
            useOrderDraft({ source: "landing", debounceMs: 5000 }),
        );

        act(() => result.current.saveDraft({ name: "Bob" }));
        expect(fetchMock).not.toHaveBeenCalled();

        await act(async () => {
            await result.current.flushNow();
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not fire a second request after the timer was cleared", async () => {
        const { result } = renderHook(() =>
            useOrderDraft({ source: "landing", debounceMs: 1000 }),
        );

        act(() => result.current.saveDraft({ name: "Bob" }));
        await act(async () => {
            await result.current.flushNow();
        });
        await advance(2000);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("resolves without a request when nothing is pending", async () => {
        const { result } = renderHook(() => useOrderDraft({ source: "landing" }));

        await act(async () => {
            await result.current.flushNow();
        });

        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe("hooks/useOrderDraft › unmount", () => {
    it("clears a pending timer so no request fires after unmount", async () => {
        const { result, unmount } = renderHook(() =>
            useOrderDraft({ source: "landing", debounceMs: 1000 }),
        );

        act(() => result.current.saveDraft({ name: "Bob" }));
        unmount();
        await advance(2000);

        expect(fetchMock).not.toHaveBeenCalled();
    });
});
