import { IProduct } from "@/interface/product.interface";
import { Schema, models, model } from "mongoose";

/**
 * Product model.
 *
 * Follows docs/DATA_RULES.md: optional fields carry `default: "" | 0 | false`
 * so older documents that pre-date a schema addition never expose `undefined`
 * to API consumers. Required fields are only the genuinely critical ones
 * (name, images, category, generalPrice).
 */
const ProductSchema: Schema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    images: [{ type: String, required: true }],

    priceVariants: [
      {
        regularPrice: { type: Number, default: 0 },
        salePrice: { type: Number, default: 0 },
        quentity: { type: Number, default: 0 },
        sku: { type: String, default: "" },
      },
    ],

    quickOverview: [{ type: String, default: "" }],

    specifications: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],

    details: { type: String, required: true },

    questionsAndAnswers: [
      {
        type: Schema.Types.ObjectId,
        ref: "QuestionAnswer",
      },
    ],

    quentity: { type: Number, default: 0 },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],

    totalReviewCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
      required: false,
      default: null,
    },

    coupon: [
      {
        name: { type: String, required: true },
        Type: {
          type: String,
          enum: ["parcent", "offer", "freeDelevery"],
          required: true,
        },
        totalOffer: { type: Number, required: true },
      },
    ],

    tags: [{ type: String, default: "" }],
    brand: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },

    hasOffer: { type: Boolean, default: false },
    offerEndDate: { type: Date, default: null },
    offerPercentage: { type: Number, default: 0 },

    generalPrice: {
      currentPrice: { type: Number, required: true },
      prevPrice: { type: Number, required: true },
      discountPercentage: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
  }
);

const Product = models.Product || model<IProduct>("Product", ProductSchema);

export default Product;
