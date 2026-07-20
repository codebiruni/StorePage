/**
 * One Product form used by both /dashboard/create-product
 * and /dashboard/products/edit/[id].
 *
 * Notes on the schema (intentional UX choices):
 *   - `name`, `details`, `category`, `generalPrice.currentPrice`,
 *     `generalPrice.prevPrice` are the ONLY server-required fields.
 *   - `subCategory`, `brand`, `tags`, `specifications`, `quickOverview`,
 *     `coupon`, `hasOffer`/offer fields are kept as optional arrays or
 *     hidden behind toggles in the UI so most products are a 3-field form.
 *   - `priceVariants` is an array of {regularPrice, salePrice, stock, sku}.
 *     The UI exposes a single product (price+stock) by default and reveals
 *     variants behind a "This product has variants" switch.
 *   - `_id` is only present on existing rows (Edit flow) so the server can
 *     reconcile sub-documents; create mode simply omits it.
 */

export interface PriceVariant {
  _id?: string;
  regularPrice: number;
  salePrice?: number;
  stock: number; // mirrors the API field "quentity" but renamed in the UI
  sku: string;
}

/** Alias kept so the rest of the codebase that reads `quentity` keeps working. */
export type ProductStock = number;

export interface Specification {
  _id?: string;
  key: string;
  value: string;
}

export interface Coupon {
  _id?: string;
  name: string;
  Type: "parcent" | "offer" | "freeDelevery";
  totalOffer: number;
}

export interface GeneralPrice {
  currentPrice: number;
  prevPrice: number;
  discountPercentage: number;
}

export interface ProductFormData {
  name: string;
  details: string;
  images: string[];

  /** Single-product price (always present). Used when there are no variants. */
  generalPrice: GeneralPrice;

  /** Top-level stock for the single product (used when no variants). */
  stock: number;

  /** Optional variant rows; hidden behind a toggle in the UI. */
  priceVariants: PriceVariant[];

  quickOverview: string[];
  specifications: Specification[];
  category: string;
  subCategory: string;
  coupon: Coupon[];
  tags: string[];
  brand?: string;

  isFeatured: boolean;
  isDeleted: boolean;
  hasOffer: boolean;
  offerEndDate?: Date;
  offerPercentage?: number;

  /**
   * Landing-page config (theme, hero copy, pain points, etc.). Optional —
   * products without a landing page skip the /step funnel entirely.
   */
  landingPage?: import("@/app/dashboard/_shared/LandingPageEditor").LandingFormValue;
}

/** Step IDs used by the stepper. */
export const PRODUCT_FORM_STEPS = [
  "details",
  "pricing",
  "landing",
] as const;
export type ProductFormStep = (typeof PRODUCT_FORM_STEPS)[number];

export const STEP_LABELS: Record<ProductFormStep, string> = {
  details: "Product details",
  pricing: "Pricing & stock",
  landing: "Landing page",
};

export const STEP_DESCRIPTIONS: Record<ProductFormStep, string> = {
  details: "Name, category, description, photos.",
  pricing: "Price, stock and optional variants or coupons.",
  landing: "Optional sales page. Skip to publish the bare product.",
};

export const defaultProductValues = (): ProductFormData => ({
  name: "",
  details: "",
  images: [],
  generalPrice: { currentPrice: 0, prevPrice: 0, discountPercentage: 0 },
  stock: 0,
  priceVariants: [],
  quickOverview: [],
  specifications: [],
  category: "",
  subCategory: "",
  coupon: [],
  tags: [],
  brand: "",
  isFeatured: false,
  isDeleted: false,
  hasOffer: false,
  offerEndDate: undefined,
  offerPercentage: 0,
});
