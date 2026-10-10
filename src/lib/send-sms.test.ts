import { beforeEach, describe, expect, it, vi } from "vitest";

const { post, log, error } = vi.hoisted(() => ({
    post: vi.fn(),
    log: vi.fn(),
    error: vi.fn(),
}));

vi.mock("axios", () => ({ default: { post } }));

const { envMock } = vi.hoisted(() => ({
    envMock: {
        BULK_API_URL: "https://sms.example.test/send",
        BULK_API_KEY: "key-123",
        BULK_SENDER_ID: "STORE",
    } as Record<string, string | undefined>,
}));

vi.mock("@/lib/env", () => ({ env: envMock, publicEnv: {} }));

import { sendSMS } from "@/lib/send-sms";

beforeEach(() => {
    post.mockReset().mockResolvedValue({ data: { response_code: "SUCCESS" } });
    envMock.BULK_API_URL = "https://sms.example.test/send";
    envMock.BULK_API_KEY = "key-123";
    envMock.BULK_SENDER_ID = "STORE";
    vi.spyOn(console, "log").mockImplementation(log);
    vi.spyOn(console, "error").mockImplementation(error);
});

describe("lib/send-sms › sendSMS", () => {
    it("posts to the configured bulk SMS endpoint", async () => {
        await sendSMS({ to: "01700000000", message: "hi" });
        expect(post.mock.calls[0][0]).toBe("https://sms.example.test/send");
    });

    it("passes credentials and payload as query params", async () => {
        await sendSMS({ to: "01700000000", message: "hello" });

        expect(post.mock.calls[0][2].params).toEqual({
            api_key: "key-123",
            senderid: "STORE",
            number: "01700000000",
            message: "hello",
        });
    });

    it("joins an array of recipients with commas", async () => {
        await sendSMS({ to: ["111", "222", "333"], message: "hi" });

        expect(post.mock.calls[0][2].params.number).toBe("111,222,333");
    });

    it("returns the provider response body", async () => {
        post.mockResolvedValue({ data: { response_code: "SUCCESS", id: "42" } });

        await expect(sendSMS({ to: "1", message: "m" })).resolves.toEqual({
            response_code: "SUCCESS",
            id: "42",
        });
    });

    it("logs success for a SUCCESS response code", async () => {
        await sendSMS({ to: "01700000000", message: "hi" });
        expect(log).toHaveBeenCalled();
    });

    it("logs an error for a non-SUCCESS response code", async () => {
        post.mockResolvedValue({ data: { response_code: "FAILED" } });

        const result = await sendSMS({ to: "1", message: "m" });

        expect(error).toHaveBeenCalled();
        expect(result).toEqual({ response_code: "FAILED" });
    });

    it("throws when the SMS URL is not configured", async () => {
        envMock.BULK_API_URL = undefined;

        await expect(sendSMS({ to: "1", message: "m" })).rejects.toThrowError(
            /SMS credentials are not configured/,
        );
        expect(post).not.toHaveBeenCalled();
    });

    it("throws when the API key is missing", async () => {
        envMock.BULK_API_KEY = undefined;

        await expect(sendSMS({ to: "1", message: "m" })).rejects.toThrowError(
            /BULK_API_KEY/,
        );
    });

    it("throws when the sender id is missing", async () => {
        envMock.BULK_SENDER_ID = undefined;

        await expect(sendSMS({ to: "1", message: "m" })).rejects.toThrowError(
            /BULK_SENDER_ID/,
        );
    });

    it("rethrows a transport failure after logging it", async () => {
        post.mockRejectedValue(new Error("network down"));

        await expect(sendSMS({ to: "1", message: "m" })).rejects.toThrowError(
            "network down",
        );
        expect(error).toHaveBeenCalled();
    });
});
