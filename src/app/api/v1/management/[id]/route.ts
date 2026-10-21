/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import { auth } from "@/lib/auth";
import { USER_ROLE } from "@/interface/auth.constent";
import UserModel from "@/models/user.model";
import Management from "@/models/menagement.model";

type ParamsType = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: ParamsType) {
  const { id } = await context.params;
  try {
    await connectDb();
    const member = await Management.findById(id).populate(
      "user",
      "-password"
    );

    if (!member || member.isDeleted) {
      return NextResponse.json(
        { success: false, message: "Team member not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: member }, { 
        status: 200
      });
  } catch (err) {
    console.error("GET team member error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch team member" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: ParamsType) {
  const { id } = await context.params;
  try {
    await connectDb();
    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    const { user, orders, isDeleted, ...updateData } = body;

    const updatedMember = await Management.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate("user", "-password");

    if (!updatedMember || updatedMember.isDeleted) {
      return NextResponse.json(
        { success: false, message: "Team member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Team member updated successfully",
      data: updatedMember,
    });
  } catch (err) {
    console.error("PATCH team member error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update team member" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: ParamsType) {
  const { id } = await context.params;
  try {
    await connectDb();
    await auth(USER_ROLE.SUPER_ADMIN);
    const member = await Management.findById(id);
    if (!member) {
      return NextResponse.json(
        { success: false, message: "Team member not found" },
        { status: 404 }
      );
    }

    // Toggle isDeleted value (true becomes false, false becomes true)
    const newIsDeletedValue = !member.isDeleted;

    await UserModel.findByIdAndUpdate(
      member.user,
      { isDeleted: newIsDeletedValue },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    const updatedMember = await Management.findByIdAndUpdate(
      id,
      { isDeleted: newIsDeletedValue },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-password")
      .populate("user", "-password");

    const actionMessage = newIsDeletedValue
      ? "Team member deleted successfully"
      : "Team member restored successfully";

    return NextResponse.json({
      success: true,
      message: actionMessage,
      data: updatedMember,
    });
  } catch (err) {
    console.error("DELETE team member error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update team member status" },
      { status: 500 }
    );
  }
}
