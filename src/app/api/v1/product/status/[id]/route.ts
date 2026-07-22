/* eslint-disable @typescript-eslint/no-explicit-any */
import { USER_ROLE } from "@/interface/auth.constent";
import { auth } from "@/lib/auth";
import connectDb from "@/lib/connectdb";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

type ParamsType = {
  params: Promise<{
    id: string;
  }>;
};

// GET: Get product by ID
export async function GET(req: NextRequest, context: ParamsType) {
  const { id } = await context.params;
  try {
    await connectDb();

    const product = await Product.findById(id)
      .populate("category")
      .populate("subCategory");

    if (!product || product.isDeleted) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product }, { 
        status: 200
      });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PATCH: Update product by ID
export async function PATCH(req: NextRequest, context: ParamsType) {
  const { id } = await context.params;
  try {
    await connectDb();
    await auth(USER_ROLE.SUPER_ADMIN);

    const body = await req.json();
    console.log('[DEBUG PATCH] received body keys:', Object.keys(body || {}));
    console.log('[DEBUG PATCH] body.landingPage:', JSON.stringify(body?.landingPage));

    // Whitelist editable scalar fields so we never accidentally write a
    // server-only property (e.g. `_id`, `__v`) back to the document. The
    // landing-page payload is forwarded explicitly because Mongoose's
    // default `strict: true` would otherwise drop it whenever it isn't
    // declared on the schema — this is exactly how landing edits used to
    // look "saved" while never actually persisting.
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
    } = body ?? {};

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
    // Defensive: the edit form used to send `category: ""` when the picker
    // had no selection, which made Mongoose throw "Cast to ObjectId failed
    // for value \"\"" on save. Treat empty strings as "no change" so we
    // never wipe an existing category.
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
    if (offerPercentage !== undefined) $set.offerPercentage = offerPercentage;
    if (generalPrice !== undefined) $set.generalPrice = generalPrice;
    // `landingPage` may be an object (save), `null` (clear), or omitted
    // (no change). We treat absence as "no change" so other field updates
    // don't wipe an existing landing.
    console.log('[DEBUG PATCH] landingPage !== undefined?', landingPage !== undefined);
    if (landingPage !== undefined) $set.landingPage = landingPage;
    console.log('[DEBUG PATCH] $set keys:', Object.keys($set), 'landingPage in $set:', 'landingPage' in $set);

    const updatedproduct = await Product.findByIdAndUpdate(
      id,
      { $set },
      { new: true, runValidators: true },
    );
    console.log('[DEBUG PATCH] updated product _id:', updatedproduct?._id, 'theme:', updatedproduct?.landingPage?.theme);

    if (!updatedproduct) {
      return NextResponse.json(
        { success: false, message: "product not found" },
        { status: 404 }
      );
    }

    // Bust both the public product-details page AND the /step landing page.
    // The /step page is wrapped in `unstable_cache` keyed by tag
    // `product:${id}` (see step/_lib/landing-data.ts), and also has its own
    // `revalidate = 3600` page cache, so without both calls the landing page
    // keeps serving the previous theme up to an hour after a save.
    revalidatePath(`/product/product-details/${id}`);
    revalidatePath(`/step/${id}`);
    revalidateTag(`product:${id}`, "max");

    return NextResponse.json({
      success: true,
      message: "product updated successfully",
      data: updatedproduct,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete product by ID
export async function DELETE(req: NextRequest, context: ParamsType) {
  const { id } = await context.params;
  try {
    await connectDb();
    await auth(USER_ROLE.SUPER_ADMIN);

    // Find product first
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "product not found" },
        { status: 404 }
      );
    }

    // Toggle isDeleted value
    product.isDeleted = !product.isDeleted;
    await product.save();

    return NextResponse.json({
      success: true,
      message: product.isDeleted
        ? "product soft deleted successfully"
        : "product restored successfully",
      data: product,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to toggle delete status",
      },
      { status: 500 }
    );
  }
}
