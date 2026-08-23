import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import { auth } from "@/lib/auth";
import SiteInfo from "@/models/siteInfo.model";
import type { ICourierCredentials } from "@/interface/siteInfo.interface";

// Admin-only endpoint that powers the Courier API settings page. We use the
// custom auth() helper (JWT in `accessToken` cookie) to gate writes; reads
// are also gated to avoid leaking credentials through accidental exposure.

type Provider = "pathao" | "steadfast" | "redx";

const VALID_PROVIDERS: Provider[] = ["pathao", "steadfast", "redx"];

// Whitelisted fields per provider so the client cannot write unrelated keys.
const FIELDS_BY_PROVIDER: Record<Provider, (keyof ICourierCredentials)[]> = {
  pathao: [
    "pathaoBaseUrl",
    "pathaoStoreId",
    "pathaoClientId",
    "pathaoClientSecret",
    "pathaoClientEmail",
    "pathaoClientPassword",
    "pathaoEnabled",
  ],
  steadfast: [
    "steadfastBaseUrl",
    "steadfastApiKey",
    "steadfastSecretKey",
    "steadfastEnabled",
  ],
  redx: ["redxBaseUrl", "redxStoreId", "redxApiToken", "redxEnabled"],
};

export async function GET() {
  try {
    await requireAuth();
    await connectDb();

    // Single-tenant siteInfo: read the first (and only) doc. Older docs that
    // pre-date the courier subdocument will simply return an empty object,
    // which the client falls back to defaults for.
    const doc = await SiteInfo.findOne().select("courier").lean();
    const courier = (doc as { courier?: ICourierCredentials } | null)?.courier ?? {};

    // Always include the read-only access/refresh token fields even when empty
    // so the client form can render a deterministic shape.
    const payload: ICourierCredentials = {
      pathaoBaseUrl: courier.pathaoBaseUrl ?? "https://api-hermes.pathao.com",
      pathaoStoreId: courier.pathaoStoreId ?? "",
      pathaoClientId: courier.pathaoClientId ?? "",
      pathaoClientSecret: courier.pathaoClientSecret ?? "",
      pathaoClientEmail: courier.pathaoClientEmail ?? "",
      pathaoClientPassword: courier.pathaoClientPassword ?? "",
      pathaoAccessToken: courier.pathaoAccessToken ?? "",
      pathaoRefreshToken: courier.pathaoRefreshToken ?? "",
      pathaoTokenExpiresAt: courier.pathaoTokenExpiresAt ?? "",
      pathaoEnabled: courier.pathaoEnabled ?? false,

      steadfastBaseUrl:
        courier.steadfastBaseUrl ?? "https://portal.packzy.com/api/v1",
      steadfastApiKey: courier.steadfastApiKey ?? "",
      steadfastSecretKey: courier.steadfastSecretKey ?? "",
      steadfastEnabled: courier.steadfastEnabled ?? false,

      redxBaseUrl:
        courier.redxBaseUrl ?? "https://openapi.redx.com.bd/v1.0.0-beta",
      redxStoreId: courier.redxStoreId ?? "",
      redxApiToken: courier.redxApiToken ?? "",
      redxEnabled: courier.redxEnabled ?? false,
    };

    return NextResponse.json({ success: true, data: { courier: payload } });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    await connectDb();

    const body = (await request.json().catch(() => ({}))) as {
      provider?: Provider;
      credentials?: Record<string, unknown>;
    };
    const provider = body.provider;
    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { success: false, message: "Invalid provider. Use pathao, steadfast, or redx." },
        { status: 400 }
      );
    }

    const incoming = body.credentials ?? {};
    const allowed = FIELDS_BY_PROVIDER[provider];

    // Build the update slice, ignoring any unexpected keys the client sent.
    const update: Record<string, unknown> = {};
    for (const field of allowed) {
      if (field in incoming) {
        const v = incoming[field as string];
        update[field as string] = sanitize(field, v);
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields supplied." },
        { status: 400 }
      );
    }

    // pathaoBaseUrl/steadfastBaseUrl/redxBaseUrl live at courier.<field>.
    // Mongoose lets us target the nested subdoc with dot notation.
    const dotUpdate: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(update)) {
      dotUpdate[`courier.${k}`] = v;
    }

    const doc = await SiteInfo.findOneAndUpdate(
      {},
      { $set: dotUpdate },
      { new: true, upsert: false, setDefaultsOnInsert: false }
    ).select("courier");

    if (!doc) {
      // No siteInfo doc yet — most tenants seed it from the dashboard before
      // touching integrations, so this is a hard error rather than upsert.
      return NextResponse.json(
        {
          success: false,
          message:
            "Site info not configured yet. Set up your store profile first.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${provider} credentials saved.`,
      data: { courier: doc.courier ?? {} },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

// Reject anything that isn't a primitive; prevents prototype pollution and
// bizarre shapes sneaking into mongoose $set.
function sanitize(
  field: keyof ICourierCredentials,
  v: unknown
): string | boolean | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof field === "string" && field.endsWith("Enabled")) {
    return Boolean(v);
  }
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v;
  return undefined;
}

async function requireAuth() {
  // The auth helper throws on missing/invalid tokens. We re-throw with a
  // normalized shape so the catch block can format a clean 401.
  await auth();
}

function errorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : "Internal server error";
  const status = msg.toLowerCase().includes("not authorized") ? 401 : 500;
  console.error("courier-credentials error:", err);
  return NextResponse.json({ success: false, message: msg }, { status });
}