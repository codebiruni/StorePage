/* eslint-disable @typescript-eslint/no-explicit-any */
import { USER_ROLE } from "@/interface/auth.constent";
import { auth } from "@/lib/auth";
import connectDb from "@/lib/connectdb";
import Management from "@/models/menagement.model";
import UserModel from "@/models/user.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// Create Team Member + Staff User
export async function POST(request: NextRequest) {
  await connectDb();
  const session = await mongoose.startSession();

  try {
    const data = await request.json();
    await auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN);

    // Default staff role to "menager" if not explicitly specified as "admin"
    const staffRole =
      data.role === "admin" || data.role === "menager" ? data.role : "menager";

    let createdMember: any = null;

    await session.withTransaction(async () => {
      // 1️⃣ Create the Staff User account
      const newUser = await UserModel.create(
        [
          {
            email: data.email ? data.email.toLowerCase().trim() : undefined,
            number: data.number ? data.number.trim().replace(/\s+/g, "") : undefined,
            username: data?.username?.trim() || "",
            password: data.password,
            role: staffRole,
            isActive: true,
            status: "in-progress",
          },
        ],
        { session }
      );

      // 2️⃣ Create the Team Member profile linked to the user
      createdMember = await Management.create(
        [
          {
            ...data,
            email: data.email ? data.email.toLowerCase().trim() : undefined,
            number: data.number ? data.number.trim() : undefined,
            user: newUser[0]._id,
          },
        ],
        { session }
      );
    });

    session.endSession();

    return NextResponse.json(
      {
        success: true,
        data: createdMember[0],
        message: "Team Member & Staff User created successfully",
      },
      { status: 201 }
    );
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("POST Team Member error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to create Team Member" },
      { status: 400 }
    );
  }
}

// Get Team Members with Search & Pagination
export async function GET(request: NextRequest) {
  try {
    await connectDb();
    await auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN, USER_ROLE.MENAGER);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 50);

    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, members, totalAll, withUserCount, deletedCount, thisWeekCount] =
      await Promise.all([
        Management.countDocuments(query),
        Management.find(query)
          .populate("user", "email number username role")
          .populate("branch", "name code")
          .select("name image createdAt isDeleted user branch")
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ createdAt: -1 }),
        Management.countDocuments({ isDeleted: false }),
        Management.countDocuments({ isDeleted: false, user: { $exists: true, $ne: null } }),
        Management.countDocuments({ isDeleted: true }),
        Management.countDocuments({ isDeleted: false, createdAt: { $gte: oneWeekAgo } }),
      ]);

    return NextResponse.json(
      {
        success: true,
        data: members,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total: totalAll,
          withUser: withUserCount,
          deleted: deletedCount,
          thisWeek: thisWeekCount,
        },
      },
      {
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("GET Team Members error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch team members" },
      { status: 400 }
    );
  }
}

// Update Team Member
export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json();
    if (!id) throw new Error("Team Member ID is required");

    await connectDb();
    await auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN);

    const updatedMember = await Management.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedMember) {
      throw new Error("Team Member not found");
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedMember,
        message: "Team Member updated successfully",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("PATCH Team Member error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update team member" },
      { status: 400 }
    );
  }
}

// Soft Delete / Restore Team Member
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) throw new Error("Team Member ID is required");

    await connectDb();
    await auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN);

    const member = await Management.findById(id);
    if (!member) {
      throw new Error("Team Member not found");
    }

    member.isDeleted = !member.isDeleted;
    await member.save();

    return NextResponse.json(
      {
        success: true,
        data: member,
        message: member.isDeleted
          ? "Team Member deleted successfully"
          : "Team Member restored successfully",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE Team Member error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to delete team member" },
      { status: 400 }
    );
  }
}
