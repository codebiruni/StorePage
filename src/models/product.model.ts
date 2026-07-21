import { IProduct, ILandingPage } from "@/interface/product.interface";
import { Schema, models, model } from "mongoose";

/**
 * Sub-schema for the per-product /step landing-page builder output.
 *
 * MUST stay in sync with `ILandingPage` and the editable shape in
 * `LandingPageEditor` (`LandingFormValue`). Every field is optional in the
 * schema so older products saved before each field was added keep loading
 * without validation errors — the editor's `normalize()` fills in the UI
 * defaults client-side.
 *
 * Declared with `strict: true` so that stray keys from a saved payload
 * (typos, leftover experimental flags) are rejected instead of silently
 * ending up on the document. The `landingPage` field on the parent
 * schema is also optional, so saving an empty object clears the section.
 */
const LandingPageSchema = new Schema<ILandingPage>(
  {
    theme: {
      type: String,
      enum: [
        "atelier",
        "midnight",
        "kinetic",
        "pillar",
        "origin",
        "health",
        "classic",
        "bold",
        "trust",
        "minimal",
        "videoHero",
      ],
      default: "atelier",
    },
    heroTitle: { type: String, default: "" },
    heroSubtitle: { type: String, default: "" },
    heroBadge: { type: String, default: "" },
    heroCtaLabel: { type: String, default: "" },

    painPoints: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    howToUse: { type: [String], default: [] },
    trustBadges: { type: [String], default: [] },

    guarantee: { type: String, default: "" },
    vslUrl: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },
    checkoutNote: { type: String, default: "" },
    phoneStripNote: { type: String, default: "" },

    comparison: {
      oursTitle: { type: String, default: "" },
      oursItems: { type: [String], default: [] },
      othersTitle: { type: String, default: "" },
      othersItems: { type: [String], default: [] },
    },
  },
  { _id: false, strict: true },
);

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

    /**
     * /step landing-page builder payload. Persisted as a sub-schema so
     * Mongoose `strict: true` won't silently strip it the way it was
     * before — see `LandingPageSchema` above and `ILandingPage`.
     */
    landingPage: { type: LandingPageSchema, default: null },
  },
    {
      timestamps: true,
    }
  );

const Product = models.Product || model<IProduct>("Product", ProductSchema);

export default Product;
