import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, findOne, verify } = vi.hoisted(() => ({
    get: vi.fn(),
    findOne: vi.fn(),
    verify: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get })) }));
vi.mock("jsonwebtoken", () => ({ default: { verify } }));
vi.mock("@/models/user.model", () => ({ default: { findOne } }));

import { auth } from "@/lib/auth";
import { USER_ROLE } from "@/interface/auth.constent";

const activeUser = {
    _id: "u1",
    email: "a@b.c",
    isDeleted: false,
    isActive: true,
    status: "active",
};

beforeEach(() => {
    get.mockReset();
    findOne.mockReset().mockResolvedValue(activeUser);
    verify.mockReset().mockReturnValue({ email: "a@b.c", role: USER_ROLE.USER });
    vi.spyOn(console, "log").mockImplementation(() => { });
    process.env.JWT_ACCESS_SECRET = "test-secret";
});

describe("lib/auth › auth", () => {
    it("throws when there is no accessToken cookie", async () => {
        get.mockReturnValue(undefined);
        await expect(auth()).rejects.toThrowError(
            "You are not authorized to access this resource",
        );
    });

    it("throws when the accessToken cookie is empty", async () => {
        get.mockReturnValue({ value: "" });
        await expect(auth()).rejects.toThrowError(
            "You are not authorized to access this resource",
        );
    });

    it("reads the accessToken cookie by name", async () => {
        get.mockReturnValue({ value: "jwt" });
        await auth();
        expect(get).toHaveBeenCalledWith("accessToken");
    });

    it("throws a token-specific message when jwt.verify fails", async () => {
        get.mockReturnValue({ value: "bad" });
        verify.mockImplementation(() => {
            throw new Error("jwt malformed");
        });

        await expect(auth()).rejects.toThrowError(
            "Invalid token. Please provide a valid authorization token",
        );
    });

    it("verifies the token with the JWT_ACCESS_SECRET env var", async () => {
        get.mockReturnValue({ value: "jwt" });
        await auth();
        expect(verify).toHaveBeenCalledWith("jwt", "test-secret");
    });

    it("throws when the payload has neither email nor number", async () => {
        get.mockReturnValue({ value: "jwt" });
        verify.mockReturnValue({ role: USER_ROLE.USER });

        await expect(auth()).rejects.toThrowError("Token must contain email or number");
    });

    it("accepts a payload that identifies the user only by number", async () => {
        get.mockReturnValue({ value: "jwt" });
        verify.mockReturnValue({ number: "01700000000" });
        findOne.mockResolvedValue(activeUser);

        await expect(auth()).resolves.toMatchObject({ user: activeUser });
        expect(findOne).toHaveBeenCalledWith({
            $or: [{ email: undefined }, { number: "01700000000" }],
        });
    });

    it("looks the user up by email or number", async () => {
        get.mockReturnValue({ value: "jwt" });
        await auth();
        expect(findOne).toHaveBeenCalledWith({
            $or: [{ email: "a@b.c" }, { number: undefined }],
        });
    });

    it("throws when the user does not exist", async () => {
        get.mockReturnValue({ value: "jwt" });
        findOne.mockResolvedValue(null);

        await expect(auth()).rejects.toThrowError("User not found");
    });

    it("throws for a soft-deleted account", async () => {
        get.mockReturnValue({ value: "jwt" });
        findOne.mockResolvedValue({ ...activeUser, isDeleted: true });

        await expect(auth()).rejects.toThrowError("This account has been deleted");
    });

    it("throws for an inactive account", async () => {
        get.mockReturnValue({ value: "jwt" });
        findOne.mockResolvedValue({ ...activeUser, isActive: false });

        await expect(auth()).rejects.toThrowError("This account is not active");
    });

    it("throws for an admin-blocked account", async () => {
        get.mockReturnValue({ value: "jwt" });
        findOne.mockResolvedValue({ ...activeUser, status: "blocked" });

        await expect(auth()).rejects.toThrowError(
            "Your account has been blocked by admin",
        );
    });

    it("returns the user and decoded payload on success", async () => {
        get.mockReturnValue({ value: "jwt" });
        const result = await auth();

        expect(result.user).toBe(activeUser);
        expect(result.decoded).toEqual({ email: "a@b.c", role: USER_ROLE.USER });
    });

    it("allows any role when no roles are required", async () => {
        get.mockReturnValue({ value: "jwt" });
        verify.mockReturnValue({ email: "a@b.c", role: USER_ROLE.USER });

        await expect(auth()).resolves.toBeTruthy();
    });

    it("allows a caller whose role is in the required list", async () => {
        get.mockReturnValue({ value: "jwt" });
        verify.mockReturnValue({ email: "a@b.c", role: USER_ROLE.ADMIN });

        await expect(auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN)).resolves.toBeTruthy();
    });

    it("rejects a caller whose role is not in the required list", async () => {
        get.mockReturnValue({ value: "jwt" });
        verify.mockReturnValue({ email: "a@b.c", role: USER_ROLE.USER });

        await expect(auth(USER_ROLE.ADMIN)).rejects.toThrowError(
            "You are not authorized to access this resource",
        );
    });

    it("rejects a payload with no role when roles are required", async () => {
        get.mockReturnValue({ value: "jwt" });
        verify.mockReturnValue({ email: "a@b.c" });

        await expect(auth(USER_ROLE.ADMIN)).rejects.toThrowError(
            "You are not authorized to access this resource",
        );
    });

    it("checks role only after the account status checks", async () => {
        get.mockReturnValue({ value: "jwt" });
        verify.mockReturnValue({ email: "a@b.c", role: USER_ROLE.USER });
        findOne.mockResolvedValue({ ...activeUser, isActive: false });

        // Inactive wins over the role mismatch.
        await expect(auth(USER_ROLE.ADMIN)).rejects.toThrowError(
            "This account is not active",
        );
    });

    it("exposes every role the app can gate on", () => {
        expect(USER_ROLE).toEqual({
            ADMIN: "admin",
            SUPER_ADMIN: "super-admin",
            USER: "user",
            MENAGER: "menager",
        });
    });
});
