import { ObjectId } from "mongoose";

/**
 * Per-product landing-page builder payload. Mirrors the editable shape
 * exposed by `LandingPageEditor` (`LandingFormValue`) and the data the
 * /step renderer reads, minus any pure-UI defaults (those live in
 * `LandingPageEditor`'s `EMPTY` and `normalize()`).
 *
 * Must stay in sync with:
 *   - src/app/dashboard/_shared/LandingPageEditor.tsx (LandingFormValue)
 *   - src/app/dashboard/products/edit/[id]/EditProductPage.tsx (handleSave payload)
 *   - src/app/step/_components/themes/*.tsx (theme renderers)
 */
export type LandingThemeId =
  | "health"
  | "organic"
  | "fashion"
  | "food"
  | "default";

export interface ILandingSection {
  id: string;
  order: number;
  type: string;
  data: Record<string, unknown>;
}

export interface ILandingPage {
  theme: LandingThemeId;

  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroCtaLabel: string;

  painPoints: string[];
  benefits: string[];
  howToUse: string[];
  trustBadges: string[];

  guarantee: string;
  vslUrl: string;
  youtubeUrl: string;
  checkoutNote: string;
  phoneStripNote: string;

  comparison: {
    oursTitle: string;
    oursItems: string[];
    othersTitle: string;
    othersItems: string[];
  };

  /** New typed-section model. Optional so legacy products keep loading. */
  sections?: ILandingSection[];
  /** Per-product color overrides for the new theme system. */
  primaryColor?: string;
  accentColor?: string;
  /** Last save timestamp; written by the editor. */
  updatedAt?: string;
}

export interface IProduct {
  name: string;
  images: string[];

  priceVariants: {
    regularPrice: number;
    salePrice?: number;
    quantity: number;
    sku?: string;
  }[];
  quentity: number;
  quickOverview: string[];

  specifications: {
    key: string;
    value: string;
  }[];

  details: string;

  questionsAndAnswers: ObjectId[];
  reviews: ObjectId[];

  totalReviewCount: number;
  averageRating?: number;

  category: ObjectId;
  subCategory: ObjectId;
  coupon: {
    name: string;
    Type: "parcent" | "offer" | "freeDelevery";
    totalOffer: number;
  }[];
  tags?: string[];
  brand?: string;
  isFeatured?: boolean;
  isDeleted: boolean;

  hasOffer: boolean;
  offerEndDate?: Date;
  offerPercentage?: number;
  generalPrice: {
    currentPrice: number;
    prevPrice: number;
    discountPercentage: number;
  };

  /**
   * Per-product /step landing-page builder output. Optional for backward
   * compatibility with products created before the landing editor
   * shipped. Saving an empty object clears it.
   */
  landingPage?: ILandingPage;
}
