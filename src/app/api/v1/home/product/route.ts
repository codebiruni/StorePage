/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { unstable_cache } from "next/cache";
import connectDb from "@/lib/connectdb";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";

// Tag used to invalidate the home-page product list from mutation routes
// (create/update/delete in /api/v1/product/* and /api/v1/product/[id]).
export const HOME_PRODUCTS_TAG = "home-products";

// Wrapped aggregator: 12 random non-deleted products. Cached for 10 minutes
// so the home page hits MongoDB at most once per cache window per region,
// and invalidated instantly on any product mutation.
const fetchHomeProducts = unstable_cache(
  async () => {
    await connectDb();
    return Product.aggregate([
      { $match: { isDeleted: false } },
      { $sample: { size: 12 } },
      {
        $project: {
          name: 1,
          images: {
            $cond: [
              { $gte: [{ $size: "$images" }, 2] },
              { $slice: ["$images", 2] },
              "$images",
            ],
          },
          generalPrice: 1,
        },
      },
    ]);
  },
  ["home-products-v1"],
  { revalidate: 600, tags: [HOME_PRODUCTS_TAG] },
);

export async function GET(request: NextRequest) {
  try {
    const products = await fetchHomeProducts();

    return NextResponse.json(
      {
        status: "success",
        products,
      },
      {
        status: 200,
        headers: {
          // CDN-friendly: edge (Cloudflare/Vercel) and browser can cache for 60s,
          // then serve stale for up to 5 min while revalidating in background.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err: any) {
    console.error("GET products error:", err);
    return NextResponse.json(
      {
        status: "error",
        message: err.message || "Failed to fetch products",
      },
      { status: 400 }
    );
  }
}
