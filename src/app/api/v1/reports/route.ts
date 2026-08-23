/**
 * /api/v1/reports — generates the dashboard's PDF reports.
 *
 * GET  — health + capability handshake.
 * POST — body: { type: "monthly" | "corporate", month?: "YYYY-MM-DD" }
 *        returns application/pdf stream.
 */

import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import {
  buildCorporateReport,
  buildMonthlyReport,
  ReportType,
} from "@/lib/report/reportData";
import { ReportDocument } from "@/lib/report/ReportPdf";

// react-pdf / Next.js: ensure the route runs on the Node runtime so the
// @react-pdf/renderer (which uses Node-only font + buffer APIs) works.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PostBody {
  type?: ReportType;
  month?: string;
  preparedFor?: string;
  brand?: string;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      endpoint: "/api/v1/reports",
      methods: ["POST"],
      types: ["monthly", "corporate"],
      description:
        "Generate the dashboard PDF reports. POST { type: 'monthly' | 'corporate' }.",
    },
  });
}

export async function POST(req: NextRequest) {
  let body: PostBody = {};
  try {
    body = (await req.json()) as PostBody;
  } catch {
    // Empty body is fine — fall through to defaults.
  }

  const type: ReportType = body.type === "corporate" ? "corporate" : "monthly";
  const month = body.month ? new Date(body.month) : undefined;
  if (month && Number.isNaN(month.getTime())) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid 'month' value. Expected ISO date string.",
      },
      { status: 400 },
    );
  }

  try {
    const report =
      type === "corporate"
        ? await buildCorporateReport()
        : await buildMonthlyReport(month);

    // renderToBuffer returns a fully-materialised Node Buffer (it pipes the
    // underlying ReadableStream through itself) so we can safely set a
    // Content-Length header and let NextResponse stream the body.
    // React.createElement keeps this route file as plain .ts — no JSX
    // transform needed for the Next.js CJS bundler.
    //
    // The cast silences a TS mismatch between React's `FunctionComponentElement`
    // and the `DocumentProps` react-pdf expects. The runtime shape is correct.
    const buffer = await renderToBuffer(
      React.createElement(ReportDocument, {
        report,
        brand: body.brand ?? "StorePage",
        preparedFor: body.preparedFor ?? "Executive Leadership",
      }) as React.ReactElement<any>,
    );

    const filename =
      type === "corporate"
        ? `corporate-overview-${new Date().toISOString().slice(0, 10)}.pdf`
        : `monthly-sales-${
            report.kind === "monthly"
              ? report.monthStart.slice(0, 10)
              : new Date().toISOString().slice(0, 10)
          }.pdf`;

    // Node `Buffer` is a `Uint8Array` subclass — NextResponse accepts it
    // directly on the Node runtime, no manual slice needed.
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[reports] PDF generation failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate report.",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
