/* eslint-disable @typescript-eslint/no-explicit-any */
import OrderModel from "@/models/order.model";
import type { IOrder } from "@/interface/order.interface";
import type { Model, HydratedDocument } from "mongoose";

/**
 * Read a batch of non-deleted orders with their products populated. Returns
 * hydrated mongoose documents so callers can read `order._id` and use the
 * regular schema methods.
 */
type OrderModelLike = Model<IOrder>;
type OrderDocument = HydratedDocument<IOrder>;

export async function fetchActiveOrders(
  orderIds: string[]
): Promise<OrderDocument[]> {
  if (!orderIds?.length) {
    throw new Error("Order IDs are required.");
  }
  const orders = await (OrderModel as unknown as OrderModelLike)
    .find({ _id: { $in: orderIds }, isDeleted: false })
    .populate("products");
  return orders as unknown as OrderDocument[];
}

/**
 * Shape returned by both the single and bulk APIs. Provider-specific parsers
 * build this from each courier's raw response.
 */
export interface CourierPushResult {
  orderId: string;            // order._id
  orderNumber: string;        // order.orderId (public-facing invoice)
  status: "success" | "error";
  courierName: string;
  consignmentId?: string | number;
  trackingCode?: string;
  message: string;
  raw?: unknown;
  httpStatus?: number;
}

export function buildCourierResponse(
  results: CourierPushResult[]
): { results: CourierPushResult[]; successful: number; failed: number } {
  const successful = results.filter((r) => r.status === "success").length;
  const failed = results.length - successful;
  return { results, successful, failed };
}

export function codAmount(order: IOrder): number {
  return order.paymentMethod === "cash-on-delivery" ? order.grandTotal : 0;
}

export function itemDescription(order: IOrder): string {
  const parts: string[] = [];
  if (Array.isArray((order as any).products)) {
    for (const p of (order as any).products) {
      const name = typeof p === "string" ? p : p?.name ?? p?.title ?? "";
      if (name) parts.push(name);
    }
  }
  return parts.join(", ") || `Order ${order.orderId}`;
}

export function itemCount(order: IOrder): number {
  if (Array.isArray((order as any).products)) return (order as any).products.length;
  return 1;
}
