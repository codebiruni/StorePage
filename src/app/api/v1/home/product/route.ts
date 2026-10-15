/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { unstable_cache } from "next/cache";
import connectDb from "@/lib/connectdb";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";

// Tag used to invalidate the home-page product list from mutation routes
// (create/update/delete in /api/v1/product/* and /api/v1/product/[id]).
export const HOME_PRODUCTS_TAG = "home-products";

// Wrapped aggregator: random non-deleted products up to requested limit.
// Cached so home page hits MongoDB minimally, invalidated instantly on mutation.
const fetchHomeProducts = unstable_cache(
  async (limit: number = 36) => {
    await connectDb();
    return Product.aggregate([
      { $match: { isDeleted: false } },
      { $sample: { size: limit } },
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
  ["home-products-v2"],
  { revalidate: 300, tags: [HOME_PRODUCTS_TAG] },
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, 100)
      : 36;

    const products = await fetchHomeProducts(limit);

    return NextResponse.json(
      {
        status: "success",
        products,
        total: products.length,
      },
      {
        status: 200,
        headers: {
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
