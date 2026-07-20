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

    const updatedproduct = await Product.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

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
