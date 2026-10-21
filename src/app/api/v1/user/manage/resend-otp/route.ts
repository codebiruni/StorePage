import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import UserModel from "@/models/user.model";
import OtpModel from "@/models/otp.model";
import { EmailTemplates } from "@/lib/send-email";
import { sendSMS } from "@/lib/send-sms";
import { getSiteConfig } from "@/lib/siteConfig";

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const COOLDOWN_SECONDS = 60;

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json();

    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json(
        { success: false, message: "Identifier (email or phone) is required." },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();
    const isEmail = trimmed.includes("@");
    const normIdentifier = isEmail ? trimmed.toLowerCase() : trimmed;

    await connectDb();

    // Find the user
    const user = await UserModel.findOne({
      $or: [{ email: normIdentifier }, { number: normIdentifier }],
      isDeleted: false,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    if (user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is already verified. Please sign in.",
        },
        { status: 400 }
      );
    }

    // Cooldown check
    const latestOtp = await OtpModel.findOne({ identifier: normIdentifier }).sort({
      createdAt: -1,
    });

    if (latestOtp && latestOtp.createdAt) {
      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000
      );
      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const remaining = COOLDOWN_SECONDS - elapsedSeconds;
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${remaining} seconds before requesting a new code.`,
            retryAfter: remaining,
          },
          { status: 429 }
        );
      }
    }

    // Clean up previous OTPs for this identifier
    await OtpModel.deleteMany({ identifier: normIdentifier });

    // Generate new OTP
    const otp = generateOTP();
    await OtpModel.create({
      identifier: normIdentifier,
      code: otp,
      attempts: 0,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    // Send code
    if (isEmail) {
      const siteConfig = await getSiteConfig();
      await EmailTemplates.sendOtpEmail(
        normIdentifier,
        otp,
        siteConfig?.name ?? "Online Shop",
        user.username || normIdentifier.split("@")[0]
      );
    } else {
      await sendSMS({
        to: normIdentifier,
        message: `Your verification code is ${otp}. This code will expire in 15 minutes.`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `A new verification code has been sent to ${normIdentifier}.`,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to resend verification code. Please try again." },
      { status: 500 }
    );
  }
}

