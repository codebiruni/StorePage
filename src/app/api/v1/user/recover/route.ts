/* eslint-disable @typescript-eslint/no-explicit-any */
import connectDb from "@/lib/connectdb";
import UserModel from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

/**
 * One-time recovery endpoint to unblock an account whose `isDeleted` flag was
 * accidentally toggled (typically during admin-panel testing).
 *
 * Body: { identifier: "email-or-phone", secret: "<ADMIN_RECOVERY_SECRET>" }
 *
 * Set ADMIN_RECOVERY_SECRET in .env (any random string). If the secret is not
 * set, this endpoint is disabled and returns 404 — keeping production safe.
 *
 * For long-term cleanup, remove this route once your buyer accounts are stable.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_RECOVERY_SECRET;
  if (!expected) {
    return NextResponse.json(
      { success: false, message: "Not found" },
      { status: 404 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { identifier, secret } = body || {};

    if (!identifier || !secret || secret !== expected) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 400 },
      );
    }

    await connectDb();

    const user = await UserModel.findOneAndUpdate(
      {
        $or: [
          { email: String(identifier).toLowerCase().trim() },
          { number: String(identifier).trim() },
        ],
      },
      { $set: { isDeleted: false, isActive: true, status: "in-progress" } },
      { new: true },
    )
      .select("_id email number isActive isDeleted status")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account recovered. You can now submit your profile.",
      user,
    });
  } catch (err: any) {
    console.error("Recover error:", err?.message);
    return NextResponse.json(
      { success: false, message: "Recovery failed" },
      { status: 500 },
    );
  }
}