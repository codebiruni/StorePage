// New section-based landing page data model.
//
// A landing page is now an ordered array of typed section instances plus a
// theme token object. This module is the source of truth for the shape on
// both client (editor) and server (renderer) — there are no "server-only"
// imports here so it can be pulled into a Client Component safely.

import type { ILandingPage } from "./landing-shared";

// ─────────────────────────────────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────────────────────────────────

export type ThemePresetId =
  | "health"
  | "organic"
  | "fashion"
  | "food"
  | "default";

export interface ThemeTokens {
  /** Primary brand color (backgrounds, headings). */
  primary: string;
  /** Accent color — usually the CTA button. */
  accent: string;
  /** CSS font-family stack name. */
  font: string;
}

export const THEME_PRESETS: Record<ThemePresetId, ThemeTokens> = {
  health: { primary: "#7a1030", accent: "#e11d2e", font: "inter" },
  organic: { primary: "#1a5e2a", accent: "#f4c430", font: "inter" },
  fashion: { primary: "#5b1a6b", accent: "#9333ea", font: "poppins" },
  food: { primary: "#2e7d32", accent: "#f9a825", font: "inter" },
  default: { primary: "#1f2937", accent: "#2563eb", font: "inter" },
};

export interface LandingTheme {
  presetId: ThemePresetId;
  /** Optional per-product overrides — empty means "use preset as-is". */
  primaryColor?: string;
  accentColor?: string;
}

export function resolveThemeTokens(theme: LandingTheme): ThemeTokens {
  const preset = THEME_PRESETS[theme.presetId] ?? THEME_PRESETS.default;
  return {
    primary: theme.primaryColor || preset.primary,
    accent: theme.accentColor || preset.accent,
    font: preset.font,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Section types
// ─────────────────────────────────────────────────────────────────────────

/** A typed section in the landing page builder. */
export type SectionType =
  | "header"
  | "hero"
  | "benefits"
  | "trustBadge"
  | "productShowcase"
  | "pricing"
  | "comparison"
  | "testimonials"
  | "faq"
  | "countdown"
  | "footer"
  | "formTitle";

export interface BaseSection<T extends SectionType, D> {
  id: string;
  order: number;
  type: T;
  data: D;
}

export interface HeaderSectionData {
  logoUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
}
export type HeaderSection = BaseSection<"header", HeaderSectionData>;

export interface HeroSectionData {
  badge?: string;
  headline: string;
  subheadline?: string;
  videoUrl?: string;
  heroImage?: string;
  ctaLabel: string;
}
export type HeroSection = BaseSection<"hero", HeroSectionData>;

export interface BenefitsSectionData {
  title?: string;
  items: { icon?: string; text: string }[];
}
export type BenefitsSection = BaseSection<"benefits", BenefitsSectionData>;

export interface TrustBadgeSectionData {
  image: string;
  caption?: string;
}
export type TrustBadgeSection = BaseSection<
  "trustBadge",
  TrustBadgeSectionData
>;

export interface ProductShowcaseSectionData {
  images: string[];
  caption?: string;
}
export type ProductShowcaseSection = BaseSection<
  "productShowcase",
  ProductShowcaseSectionData
>;

export interface PricingSectionData {
  regularPrice: number;
  offerPrice: number;
  bundleNote?: string;
  ctaLabel: string;
}
export type PricingSection = BaseSection<"pricing", PricingSectionData>;

export interface ComparisonSectionData {
  oursTitle: string;
  ours: string[];
  theirsTitle: string;
  theirs: string[];
}
export type ComparisonSection = BaseSection<
  "comparison",
  ComparisonSectionData
>;

export interface TestimonialsSectionData {
  title?: string;
  items: { image?: string; name?: string; text?: string }[];
}
export type TestimonialsSection = BaseSection<
  "testimonials",
  TestimonialsSectionData
>;

export interface FaqSectionData {
  items: { q: string; a: string }[];
}
export type FaqSection = BaseSection<"faq", FaqSectionData>;

export interface CountdownSectionData {
  endsAt: string;
  label?: string;
}
export type CountdownSection = BaseSection<"countdown", CountdownSectionData>;

export interface FooterSectionData {
  copyrightText: string;
  creditText?: string;
}
export type FooterSection = BaseSection<"footer", FooterSectionData>;

/**
 * Editable copy above the system-rendered order form. Lives as its own
 * typed section so admins can reorder / remove it like any other block,
 * but the renderer still always places it directly above the form (and
 * below every other editable section) regardless of its position in the
 * list — same system-positioning rule as the Footer.
 */
export interface FormTitleSectionData {
  heading: string;
  subheading?: string;
}
export type FormTitleSection = BaseSection<"formTitle", FormTitleSectionData>;

/**
 * Legacy Health layout section type — fully removed. The renderer now
 * consumes only typed sections; legacy flat products are migrated to
 * typed sections by the rewritten `configFromLegacy` below.
 */

export type Section =
  | HeaderSection
  | HeroSection
  | BenefitsSection
  | TrustBadgeSection
  | ProductShowcaseSection
  | PricingSection
  | ComparisonSection
  | TestimonialsSection
  | FaqSection
  | CountdownSection
  | FooterSection
  | FormTitleSection;

// ─────────────────────────────────────────────────────────────────────────
// Top-level config
// ─────────────────────────────────────────────────────────────────────────

export interface LandingConfig {
  productId: string;
  slug: string;
  /** Master toggle — when false, /step/[id] returns notFound(). */
  enabled: boolean;
  theme: LandingTheme;
  sections: Section[];
  updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Default factories
// ─────────────────────────────────────────────────────────────────────────

export function newSectionId(): string {
  // Short, sortable, monotonic-ish IDs good enough for client state. Crypto
  // randomness not required — these never escape the editor/renderer.
  return `s_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function defaultTheme(): LandingTheme {
  return { presetId: "health" };
}

export function defaultSectionData(type: SectionType): Section["data"] {
  switch (type) {
    case "header":
      return { logoUrl: "", ctaLabel: "Contact us", ctaHref: "" };
    case "hero":
      return {
        badge: "Limited Time Offer",
        headline: "",
        subheadline: "",
        videoUrl: "",
        heroImage: "",
        ctaLabel: "অর্ডার করুন",
      };
    case "benefits":
      return { title: "", items: [] };
    case "trustBadge":
      return { image: "", caption: "" };
    case "productShowcase":
      return { images: [], caption: "" };
    case "pricing":
      return { regularPrice: 0, offerPrice: 0, bundleNote: "", ctaLabel: "অর্ডার করুন" };
    case "comparison":
      return { oursTitle: "আমাদের পণ্য", ours: [], theirsTitle: "অন্যরা", theirs: [] };
    case "testimonials":
      return { title: "", items: [] };
    case "faq":
      return { items: [] };
    case "countdown":
      return {
        endsAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
        label: "অফার শেষ হওয়ার আগে অর্ডার করুন",
      };
    case "footer":
      return { copyrightText: "", creditText: "" };
    case "formTitle":
      return {
        heading: "অর্ডার করতে নিচের ফর্মটি পূরণ করুন",
        subheading: "",
      };
  }
}

export function makeSection(
  type: SectionType,
  order: number
): Section {
  // The cast through `unknown` is necessary because `Section.data` is the
  // union of all section data types — `defaultSectionData` returns the
  // matching one but TS can't narrow that on a generic union key.
  return {
    id: newSectionId(),
    order,
    type,
    data: defaultSectionData(type) as never,
  } as unknown as Section;
}

// ─────────────────────────────────────────────────────────────────────────
// Migration from the legacy flat ILandingPage
// ─────────────────────────────────────────────────────────────────────────

/**
 * Build a `LandingConfig` from the legacy flat `ILandingPage`. Used when
 * reading products that were saved before the section model existed (and
 * for products that still have flat landingPage fields persisted but no
 * typed `sections[]`).
 *
 * Strategy: project every meaningful flat field onto its matching typed
 * section so the page renders correctly on first load. Admins can then
 * reorder / edit / add / remove sections in the editor and save the
 * typed config back, which replaces the flat fields going forward.
 */
export function configFromLegacy(
  productId: string,
  slug: string,
  legacy: ILandingPage | undefined
): LandingConfig {
  const themePresetId: ThemePresetId =
    legacy?.theme === "health" ||
    legacy?.theme === "organic" ||
    legacy?.theme === "fashion" ||
    legacy?.theme === "food" ||
    legacy?.theme === "default"
      ? (legacy.theme as ThemePresetId)
      : "health";

  const sections: Section[] = [];
  let order = 0;
  const push = <T extends Section>(s: T) => {
    sections.push({ ...s, order: order++ });
  };

  // Hero — always first if we have any hero content, otherwise still emit
  // a hero so the page has a header. Falls back to the product name when
  // headline is empty.
  push({
    id: newSectionId(),
    order,
    type: "hero",
    data: {
      badge: legacy?.heroBadge ?? "Limited Time Offer",
      headline: legacy?.heroTitle ?? "",
      subheadline: legacy?.heroSubtitle ?? "",
      videoUrl: legacy?.youtubeUrl ?? legacy?.vslUrl ?? "",
      heroImage: "",
      ctaLabel: legacy?.heroCtaLabel ?? "অর্ডার করুন",
    },
  });

  if (legacy?.benefits && legacy.benefits.length > 0) {
    push({
      id: newSectionId(),
      order,
      type: "benefits",
      data: { title: "", items: legacy.benefits.map((text) => ({ text })) },
    });
  }

  if (legacy?.comparison?.oursItems?.length || legacy?.comparison?.othersItems?.length) {
    push({
      id: newSectionId(),
      order,
      type: "comparison",
      data: {
        oursTitle: legacy.comparison.oursTitle ?? "আমাদের পণ্য",
        ours: legacy.comparison.oursItems ?? [],
        theirsTitle: legacy.comparison.othersTitle ?? "অন্যরা",
        theirs: legacy.comparison.othersItems ?? [],
      },
    });
  }

  if (legacy?.guarantee) {
    push({
      id: newSectionId(),
      order,
      type: "footer", // closest typed equivalent; admins can swap to a real
      // guarantee section once WS4 adds it. Keeping footer here as a safe
      // placeholder so the copy is never lost.
      data: { copyrightText: legacy.guarantee, creditText: "" },
    });
  }

  return {
    productId,
    slug,
    enabled: true,
    theme: { presetId: themePresetId },
    sections,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Project a `LandingConfig` back to the legacy flat `ILandingPage` shape
 * so the existing schema (and downstream consumers like the order-summary
 * API) keep working without their own migration.
 *
 * The legacy fields are preserved from `fallback` (the previously-stored
 * flat shape) and only `theme` is updated from the typed config. Once a
 * product has been re-saved through the typed editor, the caller stops
 * sending the flat fields and the fallback collapses to just `theme`.
 */
export function legacyFromConfig(
  config: LandingConfig,
  fallback: ILandingPage | undefined
): ILandingPage {
  return {
    ...(fallback ?? {}),
    theme: config.theme.presetId,
  };
}