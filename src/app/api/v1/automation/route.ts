import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDb from "@/lib/connectdb";
import SiteInfo from "@/models/siteInfo.model";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await auth();
    await connectDb();

    const siteInfo = await SiteInfo.findOne()
      .select("automation")
      .lean();
    const automation = siteInfo?.automation;

    return NextResponse.json({
      success: true,
      data: {
        n8nWebhookUrl: automation?.n8nWebhookUrl ?? "",
        hasFacebookAccessToken: Boolean(automation?.facebookAccessToken),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await auth();
    await connectDb();

    const body = (await request.json().catch(() => ({}))) as {
      n8nWebhookUrl?: unknown;
      facebookAccessToken?: unknown;
    };
    const n8nWebhookUrl =
      typeof body.n8nWebhookUrl === "string" ? body.n8nWebhookUrl.trim() : "";
    const facebookAccessToken =
      typeof body.facebookAccessToken === "string"
        ? body.facebookAccessToken.trim()
        : "";
    if (!n8nWebhookUrl) {
      return NextResponse.json(
        { success: false, message: "n8n webhook URL is required." },
        { status: 400 },
      );
    }

    const existing = await SiteInfo.findOne().select("automation");
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Site info is not configured yet." },
        { status: 404 },
      );
    }

    const token =
      facebookAccessToken || existing.automation?.facebookAccessToken || "";
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Facebook access token is required." },
        { status: 400 },
      );
    }

    const automation = {
      n8nWebhookUrl,
      facebookAccessToken: token,
    };

    await SiteInfo.updateOne({}, { $set: { automation } });

    return NextResponse.json({
      success: true,
      message: "Automation settings saved.",
      data: {
        n8nWebhookUrl,
        hasFacebookAccessToken: true,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error";
  const status = message.toLowerCase().includes("authorized") ? 401 : 500;
  console.error("automation settings error:", error);
  return NextResponse.json({ success: false, message }, { status });
}
