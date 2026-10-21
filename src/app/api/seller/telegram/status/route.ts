import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import UserModel from "@/models/user.model";
import connectDb from "@/lib/connectdb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await auth();

    await connectDb();

    const freshUser = await UserModel.findById(user._id).select(
      "telegram_chat_id is_telegram_active telegram_link_token"
    );

    if (!freshUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        is_telegram_active: !!freshUser.is_telegram_active,
        telegram_chat_id: freshUser.telegram_chat_id || "",
        has_pending_token: !!freshUser.telegram_link_token,
        botUsername: process.env.TELEGRAM_BOT_USERNAME || "StorePageNotifyBot",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to fetch Telegram status",
      },
      { status: err?.message?.includes("authorized") ? 401 : 500 }
    );
  }
}

