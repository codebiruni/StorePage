import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import UserModel from "@/models/user.model";
import { sendTelegramMessage } from "@/lib/telegram";
import { getSiteConfig } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1. Secret token verification (if configured)
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret) {
      const receivedSecret = req.headers.get("x-telegram-bot-api-secret-token");
      if (receivedSecret !== expectedSecret) {
        console.warn("[telegram-webhook] Rejected request with invalid secret token.");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 2. Parse incoming Telegram update
    const update = await req.json();
    const message = update?.message || update?.edited_message;

    if (!message || !message.chat?.id) {
      // Telegram sends other types of updates (e.g. channel_post, callback_query).
      // Return 200 so Telegram doesn't retry.
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text: string = (message.text || "").trim();

    await connectDb();
    const siteConfig = await getSiteConfig().catch(() => null);
    const storeName = siteConfig?.name || process.env.NEXT_PUBLIC_BRAND_NAME || "StorePage";

    // Handle /start command
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const token = parts[1]?.trim();

      if (token) {
        // Find user by temporary connection token
        const user = await UserModel.findOne({
          telegram_link_token: token,
          isDeleted: false,
          status: { $ne: "blocked" },
        });

        if (user) {
          user.telegram_chat_id = String(chatId);
          user.is_telegram_active = true;
          user.telegram_link_token = "";
          await user.save();

          const userName = user.username || user.email || user.number || "Admin";

          await sendTelegramMessage(
            chatId,
            `✅ <b>StorePage alerts connected!</b>\n\nWelcome, <b>${userName}</b>!\nYour Telegram account is now connected to <b>${storeName}</b>.\n\nYou will receive instant notifications whenever a new order is placed! 🛍️`,
            "HTML"
          );

          return NextResponse.json({ ok: true });
        }
      }

      // If no valid token, check if this chat is already connected to an account
      const existingUser = await UserModel.findOne({
        telegram_chat_id: String(chatId),
        is_telegram_active: true,
        isDeleted: false,
      });

      if (existingUser) {
        await sendTelegramMessage(
          chatId,
          `👋 <b>Hello ${existingUser.username || "there"}!</b>\n\nYour Telegram is already actively connected to <b>${storeName}</b> order notifications.\n\nType /help to see available commands.`,
          "HTML"
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Welcome to the ${storeName} Notification Bot!</b>\n\nTo connect your Telegram account:\n1. Log in to your StorePage Dashboard.\n2. Open <b>Settings > Telegram Notifications</b>.\n3. Click <b>'Connect Telegram Alerts'</b> to link this chat.`,
          "HTML"
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Handle /disconnect
    if (text === "/disconnect") {
      const updated = await UserModel.findOneAndUpdate(
        { telegram_chat_id: String(chatId) },
        {
          is_telegram_active: false,
          telegram_chat_id: "",
          telegram_link_token: "",
        }
      );

      if (updated) {
        await sendTelegramMessage(
          chatId,
          `ℹ️ <b>StorePage alerts disconnected.</b>\nYou will no longer receive order alerts here. You can reconnect anytime from your StorePage Dashboard.`,
          "HTML"
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `ℹ️ No active StorePage account was linked to this Telegram chat.`,
          "HTML"
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Handle /status or /help
    if (text === "/status" || text === "/help") {
      const connectedUser = await UserModel.findOne({
        telegram_chat_id: String(chatId),
        is_telegram_active: true,
        isDeleted: false,
      });

      if (connectedUser) {
        await sendTelegramMessage(
          chatId,
          `📊 <b>Connection Status: Active</b>\n\nConnected Store: <b>${storeName}</b>\nUser: <b>${connectedUser.username || connectedUser.email || "Admin"}</b>\nRole: <code>${connectedUser.role}</code>\n\nCommands:\n• /status - Check connection status\n• /disconnect - Stop receiving alerts`,
          "HTML"
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `📊 <b>Connection Status: Not Connected</b>\n\nPlease connect your account from your StorePage Dashboard Settings.`,
          "HTML"
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Default reply for unexpected messages
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram-webhook] Handler error:", err);
    // Always return 200 so Telegram does not continually retry failed updates
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "StorePage Telegram Webhook",
    timestamp: new Date().toISOString(),
  });
}

