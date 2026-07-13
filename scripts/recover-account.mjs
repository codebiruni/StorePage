#!/usr/bin/env node
/**
 * One-shot recovery helper.
 *
 * Resets `isDeleted: false, isActive: true, status: "in-progress"` on a single
 * user document by calling the protected /api/v1/user/recover endpoint.
 *
 * Usage:
 *   node scripts/recover-account.mjs --identifier you@example.com
 *
 * Requires:
 *   - Dev server running on http://localhost:3000 (override with --base)
 *   - ADMIN_RECOVERY_SECRET set in .env (must match what you pass via --secret
 *     or what is loaded into the server's process.env)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    /* .env optional */
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--")
        ? argv[++i]
        : "true";
      out[key] = val;
    }
  }
  return out;
}

(async () => {
  loadEnv();
  const args = parseArgs(process.argv);
  const identifier = args.identifier;
  const secret = args.secret || process.env.ADMIN_RECOVERY_SECRET;
  const base = args.base || "http://localhost:3000";

  if (!identifier) {
    console.error(
      "❌ Missing --identifier (email or phone). Example:\n" +
        "   node scripts/recover-account.mjs --identifier you@example.com",
    );
    process.exit(1);
  }
  if (!secret) {
    console.error(
      "❌ Missing recovery secret. Pass --secret <value> or set ADMIN_RECOVERY_SECRET in .env.",
    );
    process.exit(1);
  }

  const url = `${base.replace(/\/$/, "")}/api/v1/user/recover`;
  console.log(`→ POST ${url}`);
  console.log(`  identifier: ${identifier}`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, secret }),
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  console.log(`← ${res.status}`);
  console.log(JSON.stringify(body, null, 2));

  if (!res.ok || !body?.success) {
    process.exit(2);
  }
  console.log("\n✅ Account recovered. You can now submit /complete-account.");
})().catch((err) => {
  console.error("Script crashed:", err);
  process.exit(1);
});