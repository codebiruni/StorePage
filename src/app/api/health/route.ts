// src/app/api/health/route.ts
// ──────────────────────────────────────────────────────────────────────
// Liveness/readiness probe used by Docker HEALTHCHECK, Coolify, and
// any uptime monitor (UptimeRobot, BetterStack, etc).
//
// Returns:
//   200  — process is up AND MongoDB connection is healthy
//   503  — process is up BUT MongoDB is unreachable / disconnected
//
// Never cached (`Cache-Control: no-store`) so probes always see the
// real state. Stays cheap: no DB query, just connection inspection.
// ──────────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Force Node.js runtime — the default edge runtime has no mongoose.
export const runtime = "nodejs";
// Always run on demand; never prerender / cache.
export const dynamic = "force-dynamic";

type MongooseState = "disconnected" | "connected" | "connecting" | "disconnecting";

function describeState(state: number): MongooseState {
  // mongoose.ConnectionStates: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  switch (state) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "disconnected";
  }
}

export async function GET() {
  const startedAt = Date.now();
  const dbState = describeState(mongoose.connection.readyState);
  const dbHealthy = dbState === "connected";

  const body = {
    status: dbHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    version: process.env.npm_package_version || "0.0.0",
    db: {
      state: dbState,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    },
    responseTimeMs: Date.now() - startedAt,
  };

  return NextResponse.json(body, {
    status: dbHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Health-Check": "storepage",
    },
  });
}