/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { revalidatePath, revalidateTag } from "next/cache";

import { USER_ROLE } from "@/interface/auth.constent";
import { auth } from "@/lib/auth";
import connectDb from "@/lib/connectdb";
import Product from "@/models/product.model";
import { productTag } from "@/app/step/_lib/landing-data";

function bustLandingCache(id: string) {
  try {
    revalidateTag(productTag(id), "default");
    revalidatePath(`/step/${id}`);
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

    const updated = await Product.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

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