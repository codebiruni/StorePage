// Client-safe landing helpers. No "server-only" / Mongoose / Next cache
// imports here — anything in this file can be pulled into a Client Component.

export type LandingTheme =
  | "atelier"
  | "midnight"
  | "kinetic"
  | "pillar"
  | "origin";

export interface ILandingPage {
  theme: string;
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