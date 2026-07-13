import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { auth } from "@/lib/auth";
import UserModel from "@/models/user.model";
import connectDb from "@/lib/connectdb";

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword, confirmPassword } =
      await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Current, new, and confirm password are required.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 6 characters long.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password and confirm password do not match.",
        },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be different from the current password.",
        },
        { status: 400 }
      );
    }

    // Re-uses the cookie-based auth helper that matches the rest of the API.
    const { user } = await auth();

    await connectDb();

    // Re-fetch to make sure we operate on a fresh document (not a stale one
    // from the token payload).
    const freshUser = await UserModel.findById(user._id);

    if (!freshUser) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    // Social-login accounts may not have a password set.
    if (!freshUser.password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This account uses social login and has no password to change.",
        },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, freshUser.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect." },
        { status: 401 }
      );
    }

    // Assigning the plain new password triggers the `pre('save')` hook
    // in user.model.ts which re-hashes it.
    freshUser.password = newPassword;
    await freshUser.save();

    return NextResponse.json(
      { success: true, message: "Password updated successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json(
      {
        success: false,
        message: (err as Error)?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}