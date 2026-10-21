import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import UserModel from "@/models/user.model";
import connectDb from "@/lib/connectdb";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { user } = await auth();

    await connectDb();

    const botUsername =
      process.env.TELEGRAM_BOT_USERNAME || "StorePageNotifyBot";

    // Generate cryptographically secure token
    const token = `tok_${crypto.randomBytes(16).toString("hex")}`;

    await UserModel.findByIdAndUpdate(user._id, {
      telegram_link_token: token,
    });

    const deepLink = `https://t.me/${botUsername}?start=${token}`;

    return NextResponse.json({
      success: true,
      link: deepLink,
      token,
      botUsername,
    });
  } catch (err: any) {
    console.error("[telegram] connect-link error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to generate connection link.",
      },
      { status: err?.message?.includes("authorized") ? 401 : 500 }
    );
  }
}

