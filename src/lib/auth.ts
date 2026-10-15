/* eslint-disable @typescript-eslint/no-explicit-any */
import { TUserRole } from "@/interface/auth.constent";
import { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import UserModel from "@/models/user.model";

export const auth = async (...requiredRoles: TUserRole[]) => {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("accessToken");
  const refreshTokenCookie = cookieStore.get("refreshToken");

  let decoded: JwtPayload | null = null;
  let accessVerifyError: any = null;

  if (tokenCookie && tokenCookie.value) {
    try {
      decoded = jwt.verify(
        tokenCookie.value,
        process.env.JWT_ACCESS_SECRET as string
      ) as JwtPayload;
    } catch (err: any) {
      accessVerifyError = err;
    }
  }

  // If accessToken is missing or expired, attempt seamless silent refresh via refreshToken
  if (!decoded && refreshTokenCookie && refreshTokenCookie.value) {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET as string;
      const refreshDecoded = jwt.verify(
        refreshTokenCookie.value,
        refreshSecret
      ) as JwtPayload;

      if (refreshDecoded && (refreshDecoded.email || refreshDecoded.number)) {
        const refreshUser = await UserModel.findOne({
          $or: [
            refreshDecoded.email ? { email: refreshDecoded.email } : null,
            refreshDecoded.number ? { number: refreshDecoded.number } : null,
          ].filter(Boolean) as any[],
        });

        if (
          refreshUser &&
          !refreshUser.isDeleted &&
          refreshUser.isActive &&
          refreshUser.status !== "blocked"
        ) {
          const payload = {
            id: refreshUser._id.toString(),
            role: refreshUser.role,
            email: refreshUser.email,
            number: refreshUser.number,
          };

          const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "7d";
          const newAccessToken =
            typeof jwt.sign === "function"
              ? jwt.sign(
                  payload,
                  process.env.JWT_ACCESS_SECRET as string,
                  { expiresIn: accessExpiresIn } as jwt.SignOptions
                )
              : "refreshed-token";

          if (typeof cookieStore.set === "function") {
            try {
              cookieStore.set("accessToken", newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7, // 7 days
              });
            } catch {
              // Ignored in contexts where response cookies are immutable (e.g. read-only server components)
            }
          }

          decoded = payload as unknown as JwtPayload;
          accessVerifyError = null;
        }
      }
    } catch {
      // Refresh token verification failed as well
    }
  }

  // If still no valid decoded token:
  if (!decoded) {
    if (accessVerifyError) {
      throw new Error(
        "Invalid token. Please provide a valid authorization token"
      );
    }
    throw new Error("You are not authorized to access this resource");
  }

  // Check if token contains required user identification
  if (!decoded.email && !decoded.number) {
    throw new Error("Token must contain email or number");
  }

  // Find user by email or number
  const user = await UserModel.findOne({
    $or: [{ email: decoded.email }, { number: decoded.number }],
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check account status
  if (user.isDeleted) {
    throw new Error("This account has been deleted");
  }

  if (!user.isActive) {
    throw new Error("This account is not active");
  }

  if (user.status === "blocked") {
    throw new Error("Your account has been blocked by admin");
  }

  if (
    requiredRoles.length > 0 &&
    !requiredRoles.includes(decoded.role as TUserRole)
  ) {
    throw new Error("You are not authorized to access this resource");
  }

  return {
    user,
    decoded,
  };
};
