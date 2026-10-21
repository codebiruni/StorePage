import connectDb from "@/lib/connectdb";
import OrderModel from "@/models/order.model";
import UserModel from "@/models/user.model";
import "@/models/product.model"; // Ensure Product model is registered for populate

function escapeHtml(text: unknown): string {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface TelegramSendMessageResponse {
  ok: boolean;
  description?: string;
  result?: unknown;
}

/**
 * Low-level helper to send a raw Telegram message via Bot API.
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  parseMode: "HTML" | "Markdown" | "MarkdownV2" = "HTML"
): Promise<TelegramSendMessageResponse> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN is not configured.");
    return { ok: false, description: "TELEGRAM_BOT_TOKEN not configured" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    const data = (await res.json()) as TelegramSendMessageResponse;
    if (!res.ok || !data.ok) {
      console.error("[telegram] sendMessage failed:", data);
    }
    return data;
  } catch (err) {
    console.error("[telegram] Network error sending message:", err);
    return { ok: false, description: (err as Error).message };
  }
}

/**
 * Triggers Telegram order alert to all active moderators/admins.
 * Non-blocking: catches all errors so checkout is never interrupted.
 */
export async function sendTelegramOrderAlert(orderIdOrDoc: any): Promise<void> {
  try {
    await connectDb();

    let order: any = orderIdOrDoc;
    if (typeof orderIdOrDoc === "string" || !orderIdOrDoc?.products) {
      order = await OrderModel.findById(orderIdOrDoc)
        .populate("products", "name generalPrice priceVariants images")
        .lean();
    } else if (order._id && (!order.populated || typeof order.products?.[0] === "string")) {
      order = await OrderModel.findById(order._id)
        .populate("products", "name generalPrice priceVariants images")
        .lean();
    }

    if (!order) {
      console.warn("[telegram] Order not found for alert:", orderIdOrDoc);
      return;
    }

    // Find all users (moderators, admins, managers) who have activated Telegram notifications
    const activeSubscribers = await UserModel.find({
      is_telegram_active: true,
      telegram_chat_id: { $exists: true, $ne: "" },
      isDeleted: false,
      status: { $ne: "blocked" },
    })
      .select("telegram_chat_id username email")
      .lean();

    if (!activeSubscribers || activeSubscribers.length === 0) {
      return;
    }

    // Build product item rows
    let productLines = "";
    if (Array.isArray(order.products) && order.products.length > 0) {
      productLines = order.products
        .map((p: any, idx: number) => {
          if (!p) return null;
          const title = typeof p === "object" ? p.name || "Product" : "Product";
          return `  ${idx + 1}. <b>${escapeHtml(title)}</b>`;
        })
        .filter(Boolean)
        .join("\n");
    }

    const orderTime = new Date(order.createdAt || Date.now()).toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const siteUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://storepage.codebiruni.com";
    const dashboardOrderUrl = `${siteUrl.replace(/\/$/, "")}/dashboard/orders/details?id=${order._id}`;

    const formattedMessage = [
      `🛍️ <b>New Order Received!</b>`,
      ``,
      `🆔 <b>Order ID:</b> <code>${escapeHtml(order.orderId || order._id)}</code>`,
      `🕒 <b>Time:</b> ${orderTime}`,
      `👤 <b>Customer:</b> ${escapeHtml(order.name || "N/A")}`,
      `📞 <b>Phone:</b> <code>${escapeHtml(order.number || "N/A")}</code>`,
      `📍 <b>Address:</b> ${escapeHtml(order.address || "N/A")}`,
      ``,
      `📦 <b>Ordered Items:</b>`,
      productLines || "  • <i>(Item details in dashboard)</i>",
      ``,
      `💵 <b>Subtotal:</b> ৳${order.totalAmount ?? 0}`,
      `🚚 <b>Delivery Charge:</b> ৳${order.deliveryCharge ?? 0}`,
      order.discount ? `🏷️ <b>Discount:</b> ৳${order.discount}` : null,
      `💰 <b>Grand Total:</b> <b>৳${order.grandTotal ?? 0}</b>`,
      `💳 <b>Payment:</b> ${escapeHtml(order.paymentMethod || "Cash on Delivery")} (${escapeHtml(order.paymentStatus || "pending")})`,
      order.note ? `📝 <b>Note:</b> ${escapeHtml(order.note)}` : null,
      order.source ? `🌐 <b>Source:</b> ${escapeHtml(order.source)}` : null,
      ``,
      `🔗 <a href="${dashboardOrderUrl}">Open Order in Dashboard</a>`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    // Broadcast in parallel to all active managers/admins
    await Promise.allSettled(
      activeSubscribers.map((sub: any) =>
        sendTelegramMessage(sub.telegram_chat_id, formattedMessage, "HTML")
      )
    );
  } catch (err) {
    console.error("[telegram] Error in sendTelegramOrderAlert:", err);
  }
}

