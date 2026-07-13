/**
 * GET /api/site-info
 *
 * Public endpoint that returns the merged site configuration. This is what
 * `SiteConfigProvider` fetches in the browser to hydrate brand values.
 *
 * IMPORTANT: This route never throws on a missing siteInfo. If the DB has no
 * document yet, it returns the env defaults merged with empty strings/arrays
 * so the client always receives a fully-populated object shape.
 */
import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getSiteConfig();
    return NextResponse.json(
      { success: true, data: config },
      {
        status: 200,
        headers: {
          // Allow a brief cache so repeated navigations don't hammer Mongo,
          // but stay fresh enough that admin edits appear quickly.
          "Cache-Control": "public, max-age=30, s-maxage=60",
        },
      },
    );
  } catch (err: any) {
    console.error("GET /api/site-info error:", err?.message || err);
    return NextResponse.json(
      { success: false, message: "Failed to load site configuration" },
      { status: 500 },
    );
  }
}
