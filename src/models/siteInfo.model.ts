import { ISiteInfo } from "@/interface/siteInfo.interface";
import mongoose, { Schema, model, models } from "mongoose";

/**
 * siteInfo — multi-tenant branding document.
 *
 * Every non-required field has a `default: "" | [] | {}` so that older docs
 * (or brand-new tenants that haven't seeded anything yet) never expose
 * `undefined` to `getSiteConfig()`. This is the schema-level half of the
 * defensive-read pattern — see docs/DATA_RULES.md.
 *
 * When extending this schema:
 *   1. Mark the new field optional (no `required: true`).
 *   2. Always provide a `default`.
 *   3. Add a corresponding line in `getSiteConfig()` (src/lib/siteConfig.ts)
 *      so the env-default fallback still applies.
 */
const SiteInfoSchema: Schema = new Schema<ISiteInfo>(
  {
    number: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    logo: { type: String, required: true },

    banner: {
      carousel: [
        {
          image: { type: String, default: "" },
          link: { type: String, default: "" },
        },
      ],
      firstImage: {
        image: { type: String, default: "" },
        link: { type: String, default: "" },
      },
      secondImage: {
        image: { type: String, default: "" },
        link: { type: String, default: "" },
      },
    },

    socialContact: {
      facebook: { type: String, required: true },
      youtube: { type: String, default: "" },
      instagrame: { type: String, default: "" },
      linkedIn: { type: String, default: "" },
      whatsApp: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },

    addresses: [
      {
        name: { type: String, required: true },
        address: { type: String, required: true },
      },
    ],

    mapLink: { type: String, required: true },

    footerLinks: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],

    marqueeText: { type: String, required: true },

    // Courier credentials for Pathao / Steadfast / RedX integrations.
    // Stored per-store inside the (single-tenant) siteInfo doc so admins can
    // configure their own keys from /dashboard/account/courier-api.
    courier: {
      // --- Pathao ---
      pathaoBaseUrl: { type: String, default: "https://api-hermes.pathao.com" },
      pathaoStoreId: { type: String, default: "" },
      pathaoClientId: { type: String, default: "" },
      pathaoClientSecret: { type: String, default: "" },
      pathaoClientEmail: { type: String, default: "" },
      pathaoClientPassword: { type: String, default: "" },
      pathaoAccessToken: { type: String, default: "" },
      pathaoRefreshToken: { type: String, default: "" },
      pathaoTokenExpiresAt: { type: String, default: "" },
      pathaoEnabled: { type: Boolean, default: false },

      // --- Steadfast ---
      steadfastBaseUrl: {
        type: String,
        default: "https://portal.packzy.com/api/v1",
      },
      steadfastApiKey: { type: String, default: "" },
      steadfastSecretKey: { type: String, default: "" },
      steadfastEnabled: { type: Boolean, default: false },

      // --- RedX ---
      redxBaseUrl: {
        type: String,
        default: "https://openapi.redx.com.bd/v1.0.0-beta",
      },
      redxStoreId: { type: String, default: "" },
      redxApiToken: { type: String, default: "" },
      redxEnabled: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

type SiteInfoDocument = mongoose.HydratedDocument<ISiteInfo>;

SiteInfoSchema.pre<SiteInfoDocument>(
  "save",
  async function (
    this: SiteInfoDocument,
    next: mongoose.CallbackWithoutResultAndOptionalError
  ) {
    if (
      this.isModified("number") &&
      this.number &&
      !this.number.startsWith("+88")
    ) {
      this.number = this.number.startsWith("88")
        ? `+${this.number}`
        : `+88${this.number}`;
    }

    if (
      this.isModified("socialContact.whatsApp") &&
      this.socialContact?.whatsApp
    ) {
      const whatsapp = this.socialContact.whatsApp;
      if (!whatsapp.startsWith("+88")) {
        this.socialContact.whatsApp = whatsapp.startsWith("88")
          ? `+${whatsapp}`
          : `+88${whatsapp}`;
      }
    }

    const existing = await SiteInfo.findOne({});
    if (
      existing &&
      this._id &&
      existing._id.toString() !== this._id.toString()
    ) {
      await SiteInfo.deleteMany({ _id: { $ne: this._id } });
    }

    next();
  }
);

const SiteInfo =
  models.SiteInfo || model<ISiteInfo>("SiteInfo", SiteInfoSchema);

export default SiteInfo;
