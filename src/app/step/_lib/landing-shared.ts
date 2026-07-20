// Client-safe landing helpers. No "server-only" / Mongoose / Next cache
// imports here — anything in this file can be pulled into a Client Component.

export type LandingTheme =
  | "atelier"
  | "midnight"
  | "kinetic"
  | "pillar"
  | "origin"
  | "health";

/**
 * A single column of the optional comparison section ("We vs Others"). Each
 * row is a short claim (e.g. "কাচা বিটরুট এর রস থেকে পাউডার"). Items are
 * deliberately plain strings so admins can edit them from the dashboard
 * without juggling a structured editor.
 */
export interface ILandingComparison {
  oursTitle?: string;
  oursItems?: string[];
  othersTitle?: string;
  othersItems?: string[];
}

export interface ILandingPage {
  theme: string;
  /** Headline shown over the hero. Falls back to product.name. */
  heroTitle?: string;
  heroSubtitle?: string;
  heroBadge?: string;
  heroCtaLabel?: string;
  painPoints?: string[];
  benefits?: string[];
  howToUse?: string[];
  guarantee?: string;
  trustBadges?: string[];
  vslUrl?: string;
  youtubeUrl?: string;
  socialProofStats?: string[];
  checkoutNote?: string;
  /**
   * Optional comparison block used by the Health theme (and any other
   * theme that wants it). When absent, themes fall back to derived copy.
   */
  comparison?: ILandingComparison;
  /**
   * Optional headline for the full-bleed phone-CTA strip rendered between
   * the social proof and the checkout form (e.g. "ফোনে অর্ডার করুন").
   */
  phoneStripNote?: string;
  [key: string]: unknown;
}

/**
 * JSON-safe view of a product for the public landing page.
 * Mirrors the schema fields actually used by the themes (name, images,
 * generalPrice, etc.) so renderers can read product.X directly.
 */
export type SerializedLandingProduct = {
  _id: string;
  /** Public slug used for in-page anchors (defaults to the product id). */
  slug: string;
  name: string;
  images: string[];
  details: string;
  quickOverview: string[];
  generalPrice: {
    currentPrice: number;
    prevPrice: number;
    discountPercentage: number;
  };
  hasOffer: boolean;
  offerPercentage?: number;
  offerEndDate?: string;
  landingPage?: ILandingPage;
};

/**
 * Maps a stored theme string to one of the five themes the renderer actually
 * ships. Falls back to "atelier" for unknown / legacy values so a stale DB
 * entry still renders something intentional.
 */
export function resolveLandingTheme(raw: unknown): LandingTheme {
  switch (raw) {
    case "atelier":
    case "midnight":
    case "kinetic":
    case "pillar":
    case "origin":
    case "health":
      return raw;
    // Legacy themes → closest modern equivalent.
    case "classic":
    case "minimal":
      return "origin";
    case "bold":
    case "videoHero":
      return "kinetic";
    case "trust":
      return "pillar";
    default:
      return "atelier";
  }
}