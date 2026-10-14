/* eslint-disable @typescript-eslint/no-explicit-any */
import connectDb from "@/lib/connectdb";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import SubCategory from "@/models/sub-category.model";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

type ParamsType = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: ParamsType) {
  const { id } = await context.params;

  try {
    await connectDb();

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "24"));
    const skip = (page - 1) * limit;

    const categoryIds: (string | mongoose.Types.ObjectId)[] = [];
    let categoryName = "";

    if (mongoose.Types.ObjectId.isValid(id)) {
      categoryIds.push(id);
      categoryIds.push(new mongoose.Types.ObjectId(id));
      const cat: any = await Category.findOne({
        _id: id,
        isDeleted: { $ne: true },
      })
        .select("name")
        .lean();
      if (cat?.name) {
        categoryName = cat.name;
      } else {
        const sub: any = await SubCategory.findOne({
          _id: id,
          isDeleted: { $ne: true },
        })
          .select("name")
          .lean();
        if (sub?.name) {
          categoryName = sub.name;
        }
      }
    } else {
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const cat: any = await Category.findOne({
        name: { $regex: `^${escaped}$`, $options: "i" },
        isDeleted: { $ne: true },
      })
        .select("name _id")
        .lean();
      if (cat) {
        categoryName = cat.name || "";
        categoryIds.push(cat._id.toString());
        categoryIds.push(cat._id);
      } else {
        categoryIds.push(id);
      }
    }

    // Also include subcategories of this category so products tagged
    // under a subcategory also appear on the parent category page
    const subCategories: any[] = await SubCategory.find({
      category: { $in: categoryIds },
      isDeleted: { $ne: true },
    })
      .select("_id")
      .lean();

    const subCategoryIds: (string | mongoose.Types.ObjectId)[] = [];
    for (const sub of subCategories) {
      if (sub?._id) {
        subCategoryIds.push(sub._id);
        subCategoryIds.push(sub._id.toString());
      }
    }

    const searchQuery: any = {
      isDeleted: { $ne: true },
      $or: [
        { category: { $in: categoryIds } },
        { subCategory: { $in: categoryIds } },
        ...(subCategoryIds.length > 0
          ? [{ subCategory: { $in: subCategoryIds } }]
          : []),
      ],
    };

    const totalCount = await Product.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const rawProducts = await Product.find(searchQuery)
      .select(
        "name images generalPrice brand tags specifications averageRating totalReviewCount createdAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const products = rawProducts.map((p: any) => ({
      ...p,
      images: Array.isArray(p.images)
        ? p.images.slice(0, 2)
        : p.images
        ? [p.images]
        : [],
    }));

    return NextResponse.json(
      {
        status: "success",
        categoryName,
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GET category products error:", err);
    return NextResponse.json(
      {
        status: "error",
        message: err.message || "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}