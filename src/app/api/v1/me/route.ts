import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const { decoded, user } = await auth();
    return NextResponse.json(
      {
        user: {
          id: user._id,
          role: user.role,
          email: user.email,
          number: user.number,
          ...decoded,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ user: null });
  }
}
