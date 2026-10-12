/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidateTag, revalidatePath } from "next/cache";
import { USER_ROLE } from "@/interface/auth.constent";
import { auth } from "@/lib/auth";
import { SITE_CONFIG_TAG } from "@/lib/siteConfig";
import connectDb from "@/lib/connectdb";
import SiteInfo from "@/models/siteInfo.model";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Create or Replace SiteInfo
export async function POST(request: NextRequest) {
  try {
    const siteInfoData = await request.json();
    await connectDb();
    await auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN);

    // Remove any existing SiteInfo before creating a new one
    await SiteInfo.deleteMany({});
    const createdSiteInfo = await SiteInfo.create(siteInfoData);

    // Bust the cached SiteConfig so the next render picks up the new branding.
    revalidateTag(SITE_CONFIG_TAG, "max");
    revalidatePath("/", "layout");

    return NextResponse.json(
      {
        success: true,
        data: createdSiteInfo,
        message: "SiteInfo created successfully",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST SiteInfo error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Failed to create SiteInfo",
      },
      { status: 400 }
    );
  }
}

// Get the single SiteInfo
export async function GET() {
  try {
    await connectDb();
    const siteInfo = await SiteInfo.findOne();

    if (!siteInfo) {
      return NextResponse.json(
        { success: false, message: "No SiteInfo found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: siteInfo },
      { 
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    console.error("GET SiteInfo error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch SiteInfo" },
      { status: 400 }
    );
  }
}

// Update the single SiteInfo
export async function PATCH(request: NextRequest) {
  try {
    const updateData = await request.json();
    await connectDb();
    await auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN);

    const updated = await SiteInfo.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true }
    );

    // Bust the cached SiteConfig so the next render picks up the new branding.
    try {
      revalidateTag(SITE_CONFIG_TAG, "max");
    } catch {}
    try {
      revalidatePath("/", "layout");
    } catch {}

    return NextResponse.json(
      {
        success: true,
        data: updated,
        message: "SiteInfo updated successfully",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("PATCH SiteInfo error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update SiteInfo" },
      { status: 400 }
    );
  }
}

// Delete SiteInfo permanently
export async function DELETE() {
  try {
    await connectDb();
    await auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN);

    const deleted = await SiteInfo.findOneAndDelete();
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "No SiteInfo found to delete" },
        { status: 404 }
      );
    }

    // Bust the cached SiteConfig so the next render falls back to env defaults.
    revalidateTag(SITE_CONFIG_TAG, "max");
    revalidatePath("/", "layout");

    return NextResponse.json(
      {
        success: true,
        message: "SiteInfo deleted successfully",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE SiteInfo error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to delete SiteInfo" },
      { status: 400 }
    );
  }
}
