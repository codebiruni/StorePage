/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Server-side site configuration.
 *
 * Per-deployment branding lives in two places:
 *   1. `.env` — provides safe *defaults* (NEXT_PUBLIC_BRAND_NAME, etc.).
 *   2. The `siteInfo` MongoDB document — *overrides* the env defaults at
 *      runtime so an admin can change name/logo/social without a redeploy.
 *
 * `getSiteConfig()` reads from (1), then merges the latest document from (2)
 * using the Nullish Coalescing operator (`??`) on every field. This is the
 * "defensive read" required by docs/DATA_RULES.md: an older siteInfo doc
 * missing a field (or no doc at all) still yields a complete object.
 */

import { unstable_cache } from "next/cache";
import connectDb from "@/lib/connectdb";
import SiteInfo from "@/models/siteInfo.model";
import { publicEnv } from "@/lib/env";

/**
 * Cache tag invalidated by /api/v1/web-info PATCH/POST/DELETE.
 * When admin changes brand name, logo, banner, etc., this tag is revalidated
 * and the next request rebuilds the SiteConfig from MongoDB.
 */
export const SITE_CONFIG_TAG = "siteinfo:current";

export interface SiteConfig {
  // Basics
  name: string;
  tagline: string;
  logo: string;
  themeColor: string;

  // Contact
  contact: {
    email: string;
    phone: string;
  };

  // Social (all optional in the model; defaults to "" if absent)
  social: {
    facebook: string;
    youtube: string;
    instagram: string;
    linkedIn: string;
    whatsApp: string;
    twitter: string;
    tiktok?: string;
  };

  // Site copy
  marqueeText: string;
  addresses: { name: string; address: string }[];
  mapLink: string;
  footerLinks: { name: string; url: string }[];

  // Banner (carousel + two side images)
  banner: {
    carousel: { image?: string; link?: string }[];
    firstImage: { image?: string; link?: string };
    secondImage: { image?: string; link?: string };
  };

  // Where this deployment lives (used for OG/Twitter tags in <head>)
  siteUrl: string;

  // Analytics IDs (optional). Empty string = "do not load that tracker";
  // the layout passes them to <MetaPixel /> and <GoogleAnalytics /> which
  // render nothing when the value is blank.
  metaPixelId: string;
  gaMeasurementId: string;

  // Delivery charges (BDT). Two options only: inside Dhaka and outside Dhaka.
  // Defaults match the legacy hard-coded values (70 / 90) so existing
  // deployments continue to behave the same until an admin edits them.
  deliveryCharge: {
    insideDhaka: number;
    outsideDhaka: number;
  };
}

/**
 * Strips everything that can't survive a JSON round-trip and therefore can't
 * cross the server→client React boundary (Mongoose `_id` Buffers, ObjectId
 * instances, dates are acceptable but we don't need them here). Use it on any
 * nested array/object we read from a Mongoose `lean()` document.
 */
function toPlain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/**
 * Returns env-only defaults — the brand a freshly-deployed client gets before
 * anyone has seeded the `siteInfo` document. Useful for type-stable fallbacks.
 */
export function getEnvSiteConfig(): SiteConfig {
  return {
    name: publicEnv.NEXT_PUBLIC_BRAND_NAME,
    tagline: publicEnv.NEXT_PUBLIC_BRAND_TAGLINE,
    logo: publicEnv.NEXT_PUBLIC_DEFAULT_LOGO,
    themeColor: publicEnv.NEXT_PUBLIC_THEME_COLOR,
    contact: {
      email: publicEnv.NEXT_PUBLIC_CONTACT_EMAIL,
      phone: publicEnv.NEXT_PUBLIC_CONTACT_PHONE,
    },
    social: {
      facebook: publicEnv.NEXT_PUBLIC_FACEBOOK_URL,
      youtube: publicEnv.NEXT_PUBLIC_YOUTUBE_URL,
      instagram: publicEnv.NEXT_PUBLIC_INSTAGRAM_URL,
      linkedIn: publicEnv.NEXT_PUBLIC_LINKEDIN_URL,
      whatsApp: publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER,
      twitter: publicEnv.NEXT_PUBLIC_TWITTER_URL,
    },
    marqueeText: "",
    addresses: [],
    mapLink: "",
    footerLinks: [],
    banner: {
      carousel: [],
      firstImage: {},
      secondImage: {},
    },
    siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
    metaPixelId: "",
    gaMeasurementId: "",
    deliveryCharge: {
      insideDhaka: 70,
      outsideDhaka: 90,
    },
  };
}

/**
 * Loads the live siteInfo doc from MongoDB and merges it on top of the env
 * defaults. Always returns a fully-populated `SiteConfig` — missing fields in
 * the DB document fall through to env, which in turn fall through to "" / [].
 *
 * The function never throws at request time: if the DB is unreachable it logs
 * a warning and returns the env defaults so the site can still render a
 * branded (if minimal) page.
 *
 * Wrapped with `unstable_cache` and tagged with `SITE_CONFIG_TAG` so the
 * result is cached for 1 hour across all server invocations. Mutation routes
 * in /api/v1/web-info call `revalidateTag(SITE_CONFIG_TAG)` to invalidate
 * the cache the moment an admin updates the brand.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const fetcher = unstable_cache(
    async (): Promise<SiteConfig> => {
      const base = getEnvSiteConfig();

      let doc: any = null;
      try {
        await connectDb();
        doc = await SiteInfo.findOne().lean();
      } catch (err: any) {
        console.warn(
          "⚠️ getSiteConfig: could not load siteInfo — using env defaults.",
          err?.message || err,
        );
        return base;
      }

      if (!doc) return base;

      return buildSiteConfig(doc, base);
    },
    ["site-config-v1"],
    { revalidate: 3600, tags: [SITE_CONFIG_TAG] }
  );
  return fetcher();
}

/**
 * Pure merge of a MongoDB siteInfo document on top of env defaults. Exported
 * separately so it can be unit-tested without hitting the database, and so
 * the cached fetcher can be replaced by a one-shot read in tests.
 */
function buildSiteConfig(doc: any, base: SiteConfig): SiteConfig {

  if (!doc) return base;

  return {
    name: doc.name ?? base.name,
    tagline: doc.tagline ?? base.tagline,
    logo: doc.logo ?? base.logo,
    themeColor: base.themeColor, // siteInfo has no `themeColor` yet; env wins
    contact: {
      email: doc.email ?? base.contact.email,
      phone: doc.number ?? base.contact.phone,
    },
    social: {
      facebook: doc.socialContact?.facebook ?? base.social.facebook,
      youtube: doc.socialContact?.youtube ?? base.social.youtube,
      instagram: doc.socialContact?.instagrame ?? base.social.instagram,
      linkedIn: doc.socialContact?.linkedIn ?? base.social.linkedIn,
      whatsApp: doc.socialContact?.whatsApp ?? base.social.whatsApp,
      twitter: doc.socialContact?.twitter ?? base.social.twitter,
      tiktok: doc.socialContact?.tiktok ?? "",
    },
    marqueeText: doc.marqueeText ?? base.marqueeText,
    addresses: Array.isArray(doc.addresses)
      ? toPlain(
          (doc.addresses as any[]).map((a) => ({
            name: a?.name ?? "",
            address: a?.address ?? "",
          })),
        )
      : base.addresses,
    mapLink: doc.mapLink ?? base.mapLink,
    footerLinks: Array.isArray(doc.footerLinks)
      ? toPlain(
          (doc.footerLinks as any[]).map((f) => ({
            name: f?.name ?? "",
            url: f?.url ?? "",
          })),
        )
      : base.footerLinks,
    banner: {
      carousel: Array.isArray(doc.banner?.carousel)
        ? toPlain(
            (doc.banner.carousel as any[]).map((c) => ({
              image: c?.image ?? "",
              link: c?.link ?? "",
            })),
          )
        : base.banner.carousel,
      firstImage: {
        image: doc.banner?.firstImage?.image ?? base.banner.firstImage.image,
        link: doc.banner?.firstImage?.link ?? base.banner.firstImage.link,
      },
      secondImage: {
        image: doc.banner?.secondImage?.image ?? base.banner.secondImage.image,
        link: doc.banner?.secondImage?.link ?? base.banner.secondImage.link,
      },
    },
    siteUrl: base.siteUrl,
    metaPixelId: doc.metaPixelId ?? base.metaPixelId,
    gaMeasurementId: doc.gaMeasurementId ?? base.gaMeasurementId,
    deliveryCharge: {
      insideDhaka: doc.deliveryCharge?.insideDhaka ?? base.deliveryCharge.insideDhaka,
      outsideDhaka:
        doc.deliveryCharge?.outsideDhaka ?? base.deliveryCharge.outsideDhaka,
    },
  };
}
