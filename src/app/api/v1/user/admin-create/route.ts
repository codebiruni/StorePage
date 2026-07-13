import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDb from "@/lib/connectdb";
import UserModel from "@/models/user.model";

type IuserRole = "user" | "admin" | "super-admin" | "menager";
type IuserStatus = "in-progress" | "blocked";

const ALLOWED_ROLES: IuserRole[] = ["user", "admin", "menager", "super-admin"];
const ALLOWED_STATUSES: IuserStatus[] = ["in-progress", "blocked"];

export async function POST(request: NextRequest) {
  try {
    // Restrict to dashboard-side roles. `auth()` will throw if the JWT
    // cookie is missing/invalid; passing the allowed roles means a plain
    // "user" account cannot hit this endpoint.
    await auth("admin", "super-admin", "menager");

    const body = await request.json();
    const {
      email,
      number,
      username,
      password,
      role,
      status,
      isActive,
      isSocial,
      isDeleted,
    } = body as {
      email?: string;
      number?: string;
      username?: string;
      password?: string;
      role?: IuserRole;
      status?: IuserStatus;
      isActive?: boolean;
      isSocial?: boolean;
      isDeleted?: boolean;
    };

    // ---- Validation ----
    const normalizedEmail = email?.toLowerCase().trim() || undefined;
    const normalizedNumber = number?.trim() || undefined;

    if (!normalizedEmail && !normalizedNumber) {
      return NextResponse.json(
        { success: false, message: "Either email or phone number is required." },
        { status: 400 }
      );
    }

    const finalIsSocial = Boolean(isSocial);

    if (!finalIsSocial && !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password is required for non-social accounts.",
        },
        { status: 400 }
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long.",
        },
        { status: 400 }
      );
    }

    const finalRole: IuserRole = ALLOWED_ROLES.includes(role as IuserRole)
      ? (role as IuserRole)
      : "user";

    const finalStatus: IuserStatus = ALLOWED_STATUSES.includes(
      status as IuserStatus
    )
      ? (status as IuserStatus)
      : "in-progress";

    await connectDb();

    // Pre-check for existing active user to give a friendly error.
    const existingUser = await UserModel.findOne({
      $or: [
        normalizedEmail ? { email: normalizedEmail } : { _id: null },
        normalizedNumber ? { number: normalizedNumber } : { _id: null },
      ].filter((q) => !("_id" in q && q._id === null)),
    });

    if (existingUser && !existingUser.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this email or phone number already exists.",
        },
        { status: 409 }
      );
    }

    const newUser = new UserModel({
      email: normalizedEmail,
      number: normalizedNumber,
      username: username?.trim() || undefined,
      password: password || undefined,
      role: finalRole,
      status: finalStatus,
      isSocial: finalIsSocial,
      // Non-social admin-created accounts can be activated immediately; the
      // admin is taking responsibility for the credentials.
      isActive:
        typeof isActive === "boolean"
          ? isActive
          : !finalIsSocial, // default true for non-social, false for social (matches existing register flow)
      isDeleted: Boolean(isDeleted),
    });

    const savedUser = await newUser.save();

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully.",
        data: {
          _id: savedUser._id,
          email: savedUser.email,
          number: savedUser.number,
          username: savedUser.username,
          role: savedUser.role,
          status: savedUser.status,
          isActive: savedUser.isActive,
          isSocial: savedUser.isSocial,
          isDeleted: savedUser.isDeleted,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Admin create user error:", err);
    const message =
      (err as Error)?.message || "Failed to create user.";

    // Anything thrown by `auth()` is a 401/403-style problem; surface it.
    if (
      message.toLowerCase().includes("not authorized") ||
      message.toLowerCase().includes("invalid token") ||
      message.toLowerCase().includes("blocked")
    ) {
      return NextResponse.json(
        { success: false, message },
        { status: 403 }
      );
    }

    // Duplicate key from the unique index on email/number — give a clean message.
    if ((err as { code?: number })?.code === 11000) {
      const field = Object.keys(
        ((err as { keyValue?: Record<string, unknown> }).keyValue || {})
      )[0];
      return NextResponse.json(
        {
          success: false,
          message: `A user with this ${field || "email/number"} already exists.`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}