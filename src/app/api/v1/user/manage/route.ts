/* eslint-disable @typescript-eslint/no-explicit-any */
import connectDb from "@/lib/connectdb";
import { env } from "@/lib/env";
import { getSiteConfig } from "@/lib/siteConfig";
import UserModel from "@/models/user.model";
import OtpModel from "@/models/otp.model";
import { NextRequest, NextResponse } from "next/server";
import { EmailTemplates } from "@/lib/send-email";
import { sendSMS } from "@/lib/send-sms";
import jwt from "jsonwebtoken";

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const signUpData = await request.json();
    const { email, number, password, isSocial = false } = signUpData;

    await connectDb();

    // Validate input
    if (!email && !number) {
      return NextResponse.json(
        { success: false, error: "Email or phone number is required" },
        { status: 400 }
      );
    }

    if (!isSocial && !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Password is required for non-social signups",
        },
        { status: 400 }
      );
    }

    const normEmail = email ? email.toLowerCase().trim() : undefined;
    const normNumber = number ? number.trim().replace(/\s+/g, "") : undefined;

    // Check if user exists with email or number
    let existingUser;
    if (normEmail) {
      existingUser = await UserModel.findOne({
        $or: [
          { email: normEmail, isDeleted: false },
          { email: normEmail, isDeleted: { $exists: false } },
        ],
      });
    } else if (normNumber) {
      existingUser = await UserModel.findOne({
        $or: [
          { number: normNumber, isDeleted: false },
          { number: normNumber, isDeleted: { $exists: false } },
        ],
      });
    }

    if (existingUser) {
      if (existingUser.isActive) {
        // User exists and is verified
        return NextResponse.json(
          {
            success: false,
            error: "An active account already exists with this email or phone number.",
            user: {
              _id: existingUser._id,
              email: existingUser.email,
              number: existingUser.number,
              isActive: existingUser.isActive,
            },
          },
          { status: 409 }
        );
      } else {
        // User exists but is unverified - delete old entry and recreate cleanly
        await UserModel.findByIdAndDelete(existingUser._id);
        const oldIdentifier = normEmail || normNumber;
        if (oldIdentifier) {
          await OtpModel.deleteMany({ identifier: oldIdentifier });
        }
      }
    }

    // Clean up any stale OTPs for this identifier before creating new one
    const identifier = normEmail || normNumber;
    if (identifier) {
      await OtpModel.deleteMany({ identifier });
    }

    // Prepare user data
    const userData: any = {
      email: normEmail,
      number: normNumber,
      password: password || undefined,
      isSocial,
      isActive: isSocial, // Social users are active immediately
      status: "in-progress",
    };

    // Create new user
    const newUser = new UserModel(userData);
    const savedUser = await newUser.save();

    if (!isSocial && identifier) {
      // Generate and send OTP for non-social signups
      const otp = generateOTP();

      await OtpModel.create({
        identifier,
        code: otp,
        attempts: 0,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
      });

      if (normEmail) {
        const siteConfig = await getSiteConfig();
        await EmailTemplates.sendOtpEmail(
          normEmail,
          otp,
          siteConfig?.name ?? "Online Shop",
          normEmail.split("@")[0]
        );
      } else if (normNumber) {
        await sendSMS({
          to: normNumber,
          message: `Your verification code is ${otp}. This code will expire in 15 minutes.`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: isSocial
        ? "User created successfully"
        : "User created successfully. Please verify your account.",
      user: {
        _id: savedUser._id,
        email: savedUser.email,
        number: savedUser.number,
        isActive: savedUser.isActive,
      },
    });
  } catch (err: any) {
    console.error("User registration error:", err);

    // Handle duplicate key error (unique constraint violation)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return NextResponse.json(
        {
          success: false,
          error: `User with this ${field} already exists.`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { identifier, code } = await request.json();

    if (!identifier || !code) {
      return NextResponse.json(
        { success: false, message: "Identifier and OTP code are required" },
        { status: 400 }
      );
    }

    await connectDb();

    const trimmed = String(identifier).trim();
    const isEmail = trimmed.includes("@");
    const normIdentifier = isEmail ? trimmed.toLowerCase() : trimmed.replace(/\s+/g, "");

    const otpEntry = await OtpModel.findOne({ identifier: normIdentifier });

    if (!otpEntry) {
      return NextResponse.json(
        { success: false, message: "No active verification code found. Please request a new code." },
        { status: 400 }
      );
    }

    if (otpEntry.expiresAt < new Date()) {
      await OtpModel.deleteOne({ _id: otpEntry._id });
      return NextResponse.json(
        { success: false, message: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Attempt counter & brute force protection
    if ((otpEntry.attempts || 0) >= MAX_OTP_ATTEMPTS) {
      await OtpModel.deleteOne({ _id: otpEntry._id });
      return NextResponse.json(
        {
          success: false,
          message: "Too many incorrect attempts. For security, this code was invalidated. Please request a new one.",
        },
        { status: 429 }
      );
    }

    if (otpEntry.code !== String(code).trim()) {
      const updatedAttempts = (otpEntry.attempts || 0) + 1;
      await OtpModel.updateOne({ _id: otpEntry._id }, { $set: { attempts: updatedAttempts } });
      const remaining = MAX_OTP_ATTEMPTS - updatedAttempts;

      return NextResponse.json(
        {
          success: false,
          message:
            remaining > 0
              ? `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Too many incorrect attempts. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // OTP is valid! Activate user
    const user = await UserModel.findOneAndUpdate(
      { $or: [{ email: normIdentifier }, { number: normIdentifier }] },
      { isActive: true, status: "in-progress" },
      { new: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Delete all used OTPs for this identifier
    await OtpModel.deleteMany({ identifier: normIdentifier });

    // Create JWT tokens
    const accessToken = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        number: user.number,
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        number: user.number,
      },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      } as jwt.SignOptions
    );

    const response = NextResponse.json({
      success: true,
      message: "User verified successfully",
      role: user.role,
      user,
    });

    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90,
    });

    return response;
  } catch (err) {
    console.error("OTP verification error:", err);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDb();

    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { number: { $regex: search, $options: "i" } },
      ];
    }

    if (role && role !== "all") {
      query.role = role;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const [users, total, totalAll, activeCount, blockedCount, staffCount, customerCount] =
      await Promise.all([
        UserModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select("-password"),
        UserModel.countDocuments(query),
        UserModel.countDocuments({ isDeleted: false }),
        UserModel.countDocuments({ isDeleted: false, isActive: true, status: { $ne: "blocked" } }),
        UserModel.countDocuments({ isDeleted: false, status: "blocked" }),
        UserModel.countDocuments({ isDeleted: false, role: { $in: ["admin", "menager", "super-admin"] } }),
        UserModel.countDocuments({ isDeleted: false, role: "user" }),
      ]);

    return NextResponse.json(
      {
        success: true,
        data: users,
        pagination: {
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total: totalAll,
          active: activeCount,
          blocked: blockedCount,
          admins: staffCount,
          staff: staffCount,
          customers: customerCount,
        },
      },
      {
        status: 200,
      }
    );
  } catch (err) {
    console.error("Fetch users error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
