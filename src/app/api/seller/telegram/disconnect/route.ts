import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import UserModel from "@/models/user.model";
import connectDb from "@/lib/connectdb";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { user } = await auth();

    await connectDb();

    const currentUser = await UserModel.findById(user._id);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const previousChatId = currentUser.telegram_chat_id;

    currentUser.telegram_chat_id = "";
    currentUser.telegram_link_token = "";
    currentUser.is_telegram_active = false;
    await currentUser.save();

    // Optionally notify the user on Telegram that alerts have been disconnected
    if (previousChatId) {
      sendTelegramMessage(
        previousChatId,
        "ℹ️ <b>StorePage alerts have been disconnected</b> for your account. You will no longer receive order notifications here."
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Telegram alerts disconnected successfully.",
    });
  } catch (err: any) {
    console.error("[telegram] disconnect error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to disconnect Telegram alerts.",
      },
      { status: err?.message?.includes("authorized") ? 401 : 500 }
    );
  }
}

