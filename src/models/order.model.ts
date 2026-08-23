import mongoose, { Schema, Model } from "mongoose";
import { IOrder } from "@/interface/order.interface";

// Helper function for orderId generation
function generateOrderId(): string {
  const date = new Date();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${date.getFullYear()}${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}-${random}`;
}

// Define schema
const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      unique: true,
      sparse: true, // multiple `null` orderIds allowed (drafts pre-generation)
      default: undefined as unknown as string,
      required: function (this: any) {
        // Only enforced when the order has actually been submitted.
        return this?.isCompleted === true;
      },
    },
    name: {
      type: String,
      default: "",
      trim: true,
      // Only enforce when the order is actually submitted — drafts (where
      // the user is still typing) are allowed to be empty.
      required: function (this: any) {
        return this?.isCompleted === true;
      },
    },
    number: {
      type: String,
      default: "",
      trim: true,
      required: function (this: any) {
        return this?.isCompleted === true;
      },
    },
    address: {
      type: String,
      default: "",
      trim: true,
      required: function (this: any) {
        return this?.isCompleted === true;
      },
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
      required: function (this: any) {
        return this?.isCompleted === true;
      },
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      required: function (this: any) {
        return this?.isCompleted === true;
      },
    },
    discount: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
      required: function (this: any) {
        return this?.isCompleted === true;
      },
    },
    paymentMethod: {
      type: String,
      enum: ["cash-on-delivery", "bkash", "nagad", "rocket", "card"],
      default: "cash-on-delivery",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: [
        "draft",
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "abandoned",
      ],
      default: "pending",
      index: true,
    },
    trackingId: {
      type: String,
      default: "",
    },
    note: {
      type: String,
      default: "",
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Drafts: a user started filling out the form but never submitted.
    isCompleted: {
      type: Boolean,
      default: true, // Existing rows are treated as completed; new drafts explicitly set this to false.
      index: true,
    },
    source: {
      type: String,
      enum: ["landing", "buy-product", "manual"],
      default: "manual",
      index: true,
    },
    landingProductId: {
      type: String,
      default: "",
      index: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    abandonedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically calculate grandTotal and stamp lastActivityAt before saving
orderSchema.pre("save", function (next) {
  this.grandTotal = this.totalAmount + this.deliveryCharge - (this.discount || 0);
  this.lastActivityAt = new Date();
  next();
});

const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);

export default OrderModel;
