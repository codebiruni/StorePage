// Server-only data layer for /step/[id]. Reads the product from MongoDB via
// Mongoose, projects it to a plain JSON-safe shape, and caches it with
// unstable_cache + tag-based revalidation (mutation handlers call
// revalidateTag(`product:${id}`) when they update a product).
import "server-only";
import { unstable_cache } from "next/cache";
import connectDB from "@/lib/connectdb";
import Product from "@/models/product.model";
import type { ILandingPage, SerializedLandingProduct } from "./landing-shared";

// Re-export the client-safe pieces so existing imports of `landing-data`
// keep working without dragging the server-only module into a client bundle.
export type {
  ILandingPage,
  LandingTheme,
  SerializedLandingProduct,
} from "./landing-shared";
export { resolveLandingTheme } from "./landing-shared";

function pickId(d: { _id?: { toString(): string } | string }): string {
  const id = d._id;
  if (!id) return "";
  return typeof id === "string" ? id : id.toString();
}

function toSerialized(doc: Record<string, unknown>): SerializedLandingProduct {
  const id = pickId(doc as { _id?: { toString(): string } | string });
  const gp = (doc.generalPrice ?? {}) as {
    currentPrice?: number | string;
    prevPrice?: number | string;
    discountPercentage?: number | string;
  };
  return {
    _id: id,
    slug: id,
    name: String(doc.name ?? ""),
    images: Array.isArray(doc.images)
      ? (doc.images as unknown[]).map((v) => String(v))
      : [],
    details: String(doc.details ?? ""),
    quickOverview: Array.isArray(doc.quickOverview)
      ? (doc.quickOverview as unknown[]).map((v) => String(v))
      : [],
    generalPrice: {
      currentPrice: Number(gp.currentPrice ?? 0),
      prevPrice: Number(gp.prevPrice ?? 0),
      discountPercentage: Number(gp.discountPercentage ?? 0),
    },
    hasOffer: Boolean(doc.hasOffer),
    offerPercentage:
      doc.offerPercentage === undefined || doc.offerPercentage === null
        ? undefined
        : Number(doc.offerPercentage),
    offerEndDate:
      typeof doc.offerEndDate === "string"
        ? doc.offerEndDate
        : doc.offerEndDate instanceof Date
          ? (doc.offerEndDate as Date).toISOString()
          : undefined,
    landingPage: doc.landingPage as ILandingPage | undefined,
  };
}

export function productTag(id: string) {
  return `product:${id}`;
}

export const getLandingProduct = async (
  id: string
): Promise<SerializedLandingProduct | null> => {
  const fn = unstable_cache(
    async (productId: string): Promise<SerializedLandingProduct | null> => {
      await connectDB();
      if (!productId || typeof productId !== "string") return null;
      const doc = await Product.findById(productId).lean();
      if (!doc) return null;
      return toSerialized(doc as Record<string, unknown>);
    },
    ["landing-product-by-id"],
    { tags: [productTag(id)], revalidate: 3600 }
  );
  return fn(id);
};

export async function listAllProductIds(): Promise<string[]> {
  await connectDB();
  const docs = await Product.find({}, { _id: 1 }).lean();
  return docs
    .map((d) => pickId(d as { _id?: { toString(): string } | string }))
    .filter(Boolean);
}

export function buildDefaultLanding(): ILandingPage {
  return {
    theme: "health",
    heroSubtitle: "",
    heroBadge: "",
    heroCtaLabel: "অর্ডার করুন",
    painPoints: [],
    benefits: [],
    howToUse: [],
    guarantee: "",
    trustBadges: [],
    vslUrl: "",
    youtubeUrl: "",
    socialProofStats: [],
    checkoutNote: "",
  };
}
