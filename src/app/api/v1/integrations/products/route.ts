import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import Product from "@/models/product.model";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

interface IntegrationVariant {
  _id?: { toString(): string };
  sku?: string;
  regularPrice?: number;
  salePrice?: number;
  stock?: number;
  quentity?: number;
}

interface IntegrationProduct {
  _id: { toString(): string };
  name: string;
  stock?: number;
  quentity?: number;
  specifications?: { key: string; value: string }[];
  generalPrice?: {
    prevPrice?: number;
    currentPrice?: number;
  };
  priceVariants?: IntegrationVariant[];
}

export async function GET(request: NextRequest) {
  const configuredKey = process.env.N8N_PRODUCTS_API_KEY;
  const suppliedKey = request.headers.get("x-integration-key");

  if (!configuredKey) {
    console.error("Product integration API is not configured: N8N_PRODUCTS_API_KEY is missing.");
    return NextResponse.json(
      { success: false, message: "Product integration API is not configured." },
      { status: 500 },
    );
  }

  if (!suppliedKey || !securelyMatches(suppliedKey, configuredKey)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const productId = searchParams.get("id")?.trim();
    const page = positiveInteger(searchParams.get("page"), 1);
    const limit = Math.min(
      positiveInteger(searchParams.get("limit"), DEFAULT_LIMIT),
      MAX_LIMIT,
    );
    const includeOutOfStock = searchParams.get("includeOutOfStock") === "true";

    const query: Record<string, unknown> = { isDeleted: false };
    if (productId) query._id = productId;
    if (search) query.name = { $regex: escapeRegExp(search), $options: "i" };
    if (!includeOutOfStock) {
      query.$or = [
        { stock: { $gt: 0 } },
        { quentity: { $gt: 0 } },
        { "priceVariants.stock": { $gt: 0 } },
        { "priceVariants.quentity": { $gt: 0 } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .select(
          "name specifications stock quentity generalPrice priceVariants",
        )
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean<IntegrationProduct[]>(),
      Product.countDocuments(query),
    ]);

    const data = products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      stock: product.stock ?? product.quentity ?? 0,
      regularPrice: product.generalPrice?.prevPrice ?? 0,
      offerPrice: product.generalPrice?.currentPrice ?? 0,
      specifications: product.specifications ?? [],
      variants: (product.priceVariants ?? []).map((variant) => ({
        id: variant._id?.toString(),
        sku: variant.sku ?? "",
        regularPrice: variant.regularPrice ?? 0,
        offerPrice: variant.salePrice && variant.salePrice > 0
          ? variant.salePrice
          : variant.regularPrice ?? 0,
        stock: variant.stock ?? variant.quentity ?? 0,
      })),
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET integration products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products." },
      { status: 500 },
    );
  }
}

function securelyMatches(supplied: string, configured: string) {
  const suppliedBuffer = Buffer.from(supplied);
  const configuredBuffer = Buffer.from(configured);
  return (
    suppliedBuffer.length === configuredBuffer.length &&
    crypto.timingSafeEqual(suppliedBuffer, configuredBuffer)
  );
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
