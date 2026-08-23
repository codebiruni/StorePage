export type OrderSource = "landing" | "buy-product" | "manual";

export interface IOrder {
  orderId: string; // Auto-generated unique order ID (e.g., ORD-20251028-XYZ)
  /** Empty string while the order is a draft; required once `isCompleted`. */
  name: string;
  /** Empty string while the order is a draft; required once `isCompleted`. */
  number: string;
  /** Empty string while the order is a draft; required once `isCompleted`. */
  address: string;
  products: string[]; // Array of product ObjectIds (as strings)
  totalAmount: number; // Total price
  deliveryCharge: number; // Delivery cost
  discount?: number; // Optional discount
  grandTotal: number; // totalAmount + deliveryCharge - discount
  paymentMethod: "cash-on-delivery" | "bkash" | "nagad" | "rocket" | "card";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  orderStatus:
    | "draft"        // User is still filling the form
    | "pending"      // Submitted, awaiting admin confirmation
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "abandoned";   // Draft left unfinished for too long
  trackingId?: string; // Courier tracking number
  note?: string; // Optional order note
  isDelivered: boolean;
  isPaid: boolean;
  isDeleted: boolean;

  /** True when the user has actually submitted the order. Drafts stay false. */
  isCompleted: boolean;
  /** Where the order originated — useful for funnel analytics. */
  source?: OrderSource;
  /** Convenience link for landing-page single-product orders. */
  landingProductId?: string;
  /** Last time the user touched the draft. Used by the abandonment sweep. */
  lastActivityAt?: Date;
  /** Set when a draft is reclassified as `abandoned` by the sweep job. */
  abandonedAt?: Date;
}
