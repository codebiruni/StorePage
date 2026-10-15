import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST() {
  try {
    const { user, decoded } = await auth();
    return NextResponse.json({
      success: true,
      message: "Session refreshed successfully",
      user: {
        id: user._id,
        role: user.role,
        email: user.email,
        number: user.number,
        ...decoded,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to refresh session" },
      { status: 401 }
    );
  }
}

export async function GET() {
  return POST();
}

