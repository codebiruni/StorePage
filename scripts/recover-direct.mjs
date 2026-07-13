#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import mongoose from "mongoose";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      const key = t.slice(0, eq).trim();
      let value = t.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (err) {
    console.error("warning: could not read .env:", err.message);
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val =
        argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      out[key] = val;
    }
  }
  return out;
}

(async () => {
  loadEnv();
  const args = parseArgs(process.argv);
  const all = args.all === "true" || args.all === true;
  const identifier = args.identifier;

  if (!all && !identifier) {
    console.error(
      "missing --identifier (email or phone), or pass --all true\n" +
        "  node scripts/recover-direct.mjs --identifier you@example.com\n" +
        "  node scripts/recover-direct.mjs --all true",
    );
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing from .env");
    process.exit(1);
  }

  console.log("connecting to MongoDB...");
  await mongoose.connect(uri, { bufferCommands: false });

  const col = mongoose.connection.collection("users");

  const filter = all
    ? {}
    : {
        $or: [
          { email: String(identifier).toLowerCase().trim() },
          { number: String(identifier).trim() },
        ],
      };

  const before = await col
    .find(filter, {
      projection: { _id: 1, email: 1, number: 1, isDeleted: 1, isActive: 1, status: 1 },
    })
    .limit(20)
    .toArray();

  console.log(`found ${before.length} user(s) before update:`);
  for (const u of before) {
    console.log(
      `  - ${u.email || u.number || u._id}  isDeleted=${u.isDeleted} isActive=${u.isActive} status=${u.status}`,
    );
  }

  const result = await col.updateMany(filter, {
    $set: { isDeleted: false, isActive: true, status: "in-progress" },
  });
  console.log(`matched ${result.matchedCount}, modified ${result.modifiedCount}`);

  const after = await col
    .find(filter, {
      projection: { _id: 1, email: 1, number: 1, isDeleted: 1, isActive: 1 },
    })
    .limit(20)
    .toArray();

  console.log("after update:");
  for (const u of after) {
    console.log(
      `  - ${u.email || u.number || u._id}  isDeleted=${u.isDeleted} isActive=${u.isActive}`,
    );
  }

  await mongoose.disconnect();
  console.log("\ndone. existing accessToken cookie is still valid - retry /complete-account and /profile.");
})().catch((err) => {
  console.error("script crashed:", err);
  process.exit(1);
});