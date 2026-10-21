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

    if (!currentUser.is_telegram_active || !currentUser.telegram_chat_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Telegram is not connected for your account. Please connect first.",
        },
        { status: 400 }
      );
    }

    const time = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const testMessage = [
      `🔔 <b>Test Notification from StorePage!</b>`,
      ``,
      `Your Telegram account is successfully connected to receive real-time order alerts.`,
      `🕒 <b>Sent at:</b> ${time}`,
      `👤 <b>User:</b> ${currentUser.username || currentUser.email || currentUser.number || "Admin"}`,
      ``,
      `Whenever a new customer places an order on your store, you will receive full order details here instantly! 🚀`,
    ].join("\n");

    const result = await sendTelegramMessage(
      currentUser.telegram_chat_id,
      testMessage,
      "HTML"
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.description || "Failed to send test message via Telegram API.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test notification sent successfully to your Telegram!",
    });
  } catch (err: any) {
    console.error("[telegram] test-notification error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to send test notification.",
      },
      { status: err?.message?.includes("authorized") ? 401 : 500 }
    );
  }
}

