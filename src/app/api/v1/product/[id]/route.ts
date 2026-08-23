/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { revalidatePath, revalidateTag } from "next/cache";

import { USER_ROLE } from "@/interface/auth.constent";
import { auth } from "@/lib/auth";
import connectDb from "@/lib/connectdb";
import Product from "@/models/product.model";
import { productTag } from "@/app/step/_lib/landing-data";
import { HOME_PRODUCTS_TAG } from "@/app/api/v1/home/product/route";

function bustLandingCache(id: string) {
  try {
    revalidateTag(productTag(id), "default");
    revalidatePath(`/step/${id}`);
    revalidateTag(HOME_PRODUCTS_TAG, "max");
  } catch (e) {
    console.warn("revalidate failed (non-fatal):", e);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product id" },
        { status: 400 },
      );
    }

    const payload = await request.json();
    await connectDb();
    await auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN);

      // Whitelist editable fields (mirrors PATCH /api/v1/product/status/[id]).
      // Without this, Mongoose `strict: true` silently drops `landingPage`
      // (and any other schema-less payload field) on `findByIdAndUpdate`.
      const {
        name,
        images,
        priceVariants,
        quickOverview,
        specifications,
        details,
        questionsAndAnswers,
        quentity,
        reviews,
        totalReviewCount,
        averageRating,
        category,
        subCategory,
        coupon,
        tags,
        brand,
        isFeatured,
        isDeleted,
        hasOffer,
        offerEndDate,
        offerPercentage,
        generalPrice,
        landingPage,
      } = payload ?? {};

      const $set: Record<string, unknown> = {};
      if (name !== undefined) $set.name = name;
      if (images !== undefined) $set.images = images;
      if (priceVariants !== undefined) $set.priceVariants = priceVariants;
      if (quickOverview !== undefined) $set.quickOverview = quickOverview;
      if (specifications !== undefined) $set.specifications = specifications;
      if (details !== undefined) $set.details = details;
      if (questionsAndAnswers !== undefined)
        $set.questionsAndAnswers = questionsAndAnswers;
      if (quentity !== undefined) $set.quentity = quentity;
      if (reviews !== undefined) $set.reviews = reviews;
      if (totalReviewCount !== undefined)
        $set.totalReviewCount = totalReviewCount;
      if (averageRating !== undefined) $set.averageRating = averageRating;
      if (category !== undefined) $set.category = category;
      // Defensive: empty-string `category` from older clients would crash
      // Mongoose with "Cast to ObjectId failed for value \"\"". Treat
      // empty/whitespace as "no change" so existing category survives.
      if (typeof $set.category === "string" && ($set.category as string).trim() === "") {
        delete $set.category;
      }
      if (subCategory !== undefined) $set.subCategory = subCategory;
      if (typeof $set.subCategory === "string" && ($set.subCategory as string).trim() === "") {
        delete $set.subCategory;
      }
      if (coupon !== undefined) $set.coupon = coupon;
      if (tags !== undefined) $set.tags = tags;
      if (brand !== undefined) $set.brand = brand;
      if (isFeatured !== undefined) $set.isFeatured = isFeatured;
      if (isDeleted !== undefined) $set.isDeleted = isDeleted;
      if (hasOffer !== undefined) $set.hasOffer = hasOffer;
      if (offerEndDate !== undefined) $set.offerEndDate = offerEndDate;
      if (offerPercentage !== undefined)
        $set.offerPercentage = offerPercentage;
      if (generalPrice !== undefined) $set.generalPrice = generalPrice;
      if (landingPage !== undefined) $set.landingPage = landingPage;

      const updated = await Product.findByIdAndUpdate(
        id,
        { $set },
        { new: true, runValidators: true },
      );

      if (!updated) {
        return NextResponse.json(
          { success: false, message: "Product not found" },
          { status: 404 },
        );
      }

      bustLandingCache(id);

    return NextResponse.json(
      {
        success: true,
        data: updated,
        message: "Product updated successfully",
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("PUT Product error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update product" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product id" },
        { status: 400 },
      );
    }
    await connectDb();
    await auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN);

    const deleted = await Product.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    bustLandingCache(id);

    return NextResponse.json(
      { success: true, message: "Product soft-deleted" },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("DELETE Product error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to delete product" },
      { status: 400 },
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product id" },
        { status: 400 },
      );
    }
    await connectDb();
    await auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN, USER_ROLE.MENAGER);

    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: product }, { status: 200 });
  } catch (err: any) {
    console.error("GET Product error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch product" },
      { status: 400 },
    );
  }
}