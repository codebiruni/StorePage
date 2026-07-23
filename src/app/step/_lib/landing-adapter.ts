// Client-safe adapter between the legacy flat `ILandingPage` shape (still
// the persistence format) and the new typed `LandingConfig` (used by the
// renderer and editor).
//
// The editor (`SectionEditorPanel`) and the live preview (`LandingPageRenderer`)
// both consume `LandingConfig`. The wizard still passes a flat
// `LandingFormValue` through `onChange` so the schema migration can ship
// independently — these helpers do the projection in both directions
// without touching the database.

import type { ILandingPage } from "./landing-shared";
import {
  configFromLegacy,
  legacyFromConfig,
  type LandingConfig,
} from "./landing-config";

// Augment the flat shape with the new typed-section fields so we can read
// or write either representation from the same JSON blob. Mongoose schema
// is `strict: true` so unknown fields are dropped server-side until the
// schema is migrated — that's fine, this module is purely client-side.
export type FlatLandingPage = ILandingPage & {
  primaryColor?: string;
  accentColor?: string;
  sections?: LandingConfig["sections"];
  updatedAt?: string;
};

/**
 * Build a `LandingConfig` from a flat product `landingPage` payload.
 * Mirrors `buildLandingConfig` in `landing-data.ts` but is safe to import
 * into a Client Component (no Mongoose / `server-only`).
 */
export function flatToConfig(
  productId: string,
  slug: string,
  flat: FlatLandingPage | undefined
): LandingConfig {
  const storedSections = flat?.sections;
  if (flat && Array.isArray(storedSections) && storedSections.length > 0) {
    const presetId =
      flat.theme === "health" ||
      flat.theme === "organic" ||
      flat.theme === "fashion" ||
      flat.theme === "food" ||
      flat.theme === "default"
        ? flat.theme
        : "health";
    return {
      productId,
      slug,
      enabled: true,
      theme: {
        presetId,
        primaryColor: flat.primaryColor,
        accentColor: flat.accentColor,
      },
      sections: storedSections,
      updatedAt: flat.updatedAt,
    };
  }
  return configFromLegacy(productId, slug, flat);
}

/**
 * Project a `LandingConfig` back to the flat shape the schema (and
 * downstream consumers) understand. The previously-stored flat fields are
 * carried through unchanged, and `sections[]`, `primaryColor`, and
 * `accentColor` are layered on top so the persisted JSON has both views
 * available until callers move off the flat shape.
 */
export function configToFlat(
  config: LandingConfig,
  previous: FlatLandingPage | undefined
): FlatLandingPage {
  const base = legacyFromConfig(config, previous) as FlatLandingPage;
  base.sections = config.sections;
  base.updatedAt = new Date().toISOString();
  if (config.theme.primaryColor) base.primaryColor = config.theme.primaryColor;
  if (config.theme.accentColor) base.accentColor = config.theme.accentColor;
  return base;
}
