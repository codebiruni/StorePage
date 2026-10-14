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

    const subCategoryIds: (string | mongoose.Types.ObjectId)[] = [];
    let subCategoryName = "";

    // 1. Try finding by ID in SubCategory
    let sub: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      subCategoryIds.push(id);
      subCategoryIds.push(new mongoose.Types.ObjectId(id));
      sub = await SubCategory.findOne({
        _id: id,
        isDeleted: { $ne: true },
      })
        .select("name category")
        .lean();
    }

    // 2. If not found by ID, try finding by name in SubCategory
    if (!sub) {
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      sub = await SubCategory.findOne({
        name: { $regex: `^${escaped}$`, $options: "i" },
        isDeleted: { $ne: true },
      })
        .select("name category _id")
        .lean();
      if (sub?._id) {
        subCategoryIds.push(sub._id.toString());
        subCategoryIds.push(sub._id);
      }
    }

    // 3. If found in SubCategory, find all related subcategories with the same name
    // (since duplicate subcategories like "Asus", "Lenovo", "Dell" exist across categories in DB)
    let brandOrTagRegex: RegExp | null = null;
    if (sub?.name) {
      subCategoryName = sub.name;
      const escapedName = sub.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      brandOrTagRegex = new RegExp(`^${escapedName}$`, "i");

      const sameNameSubs: any[] = await SubCategory.find({
        name: { $regex: `^${escapedName}$`, $options: "i" },
        isDeleted: { $ne: true },
      })
        .select("_id")
        .lean();

      for (const s of sameNameSubs) {
        if (s?._id) {
          subCategoryIds.push(s._id);
          subCategoryIds.push(s._id.toString());
        }
      }
    } else {
      // 4. Fallback: maybe id is actually a Category ID
      let cat: any = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        cat = await Category.findOne({ _id: id, isDeleted: { $ne: true } })
          .select("name")
          .lean();
      }
      if (cat?.name) {
        subCategoryName = cat.name;
        subCategoryIds.push(id);
        if (mongoose.Types.ObjectId.isValid(id)) {
          subCategoryIds.push(new mongoose.Types.ObjectId(id));
        }
        // Also fetch all subcategories under this category
        const childSubs: any[] = await SubCategory.find({
          category: { $in: [id, new mongoose.Types.ObjectId(id)] },
          isDeleted: { $ne: true },
        })
          .select("_id")
          .lean();
        for (const cs of childSubs) {
          if (cs?._id) {
            subCategoryIds.push(cs._id);
            subCategoryIds.push(cs._id.toString());
          }
        }
      } else {
        subCategoryIds.push(id);
        if (mongoose.Types.ObjectId.isValid(id)) {
          subCategoryIds.push(new mongoose.Types.ObjectId(id));
        }
      }
    }

    const orConditions: any[] = [
      { subCategory: { $in: subCategoryIds } },
      { category: { $in: subCategoryIds } },
    ];

    if (brandOrTagRegex) {
      orConditions.push({ brand: brandOrTagRegex });
      orConditions.push({ tags: brandOrTagRegex });
    }

    const searchQuery: any = {
      isDeleted: { $ne: true },
      $or: orConditions,
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
        subCategoryName,
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
    console.error("GET subcategory products error:", err);
    return NextResponse.json(
      {
        status: "error",
        message: err.message || "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}