// Server-side helper that turns an editor `LandingFormValue` into the
// Mongo-stored `landingPage` payload. Both `ProductForm.tsx` (create) and
// `EditProductPage.tsx` (update) share this so the persisted shape stays
// in sync.
//
// Kept in `_shared/` rather than `step/_lib/` because it's only called
// from the dashboard save handlers, not from the public renderer.

import type { LandingFormValue } from "./LandingPageEditor";

/**
 * Build the `landingPage` object that gets sent to the product API.
 *
 * When the editor has produced typed sections (via the new
 * `SectionEditorPanel` + `LandingConfig` flow), those sections ride along
 * here so the renderer can pick them up. The flat fields stay populated
 * so `HealthPage` keeps rendering as before for any product still using
 * the legacy single-theme layout.
 */
export function buildLandingPagePayload(landingValue: LandingFormValue) {
  const lv = landingValue as LandingFormValue & {
    sections?: unknown;
    primaryColor?: string;
    accentColor?: string;
  };

  const payload: Record<string, unknown> = {
    theme: landingValue.theme,
    heroTitle: landingValue.heroTitle,
    heroSubtitle: landingValue.heroSubtitle,
    heroBadge: landingValue.heroBadge,
    heroCtaLabel: landingValue.heroCtaLabel,
    painPoints: (landingValue.painPoints ?? []).filter(Boolean),
    benefits: (landingValue.benefits ?? []).filter(Boolean),
    howToUse: (landingValue.howToUse ?? []).filter(Boolean),
    guarantee: landingValue.guarantee,
    trustBadges: (landingValue.trustBadges ?? []).filter(Boolean),
    vslUrl: landingValue.vslUrl,
    youtubeUrl: landingValue.youtubeUrl,
    checkoutNote: landingValue.checkoutNote,
    comparison: {
      oursTitle: landingValue.comparisonOursTitle,
      oursItems: (landingValue.comparisonOursItems ?? []).filter(Boolean),
      othersTitle: landingValue.comparisonOthersTitle,
      othersItems: (landingValue.comparisonOthersItems ?? []).filter(Boolean),
    },
    phoneStripNote: landingValue.phoneStripNote,
  };

  // Typed-section fields exist on the value when the admin has edited
  // sections in the new SectionEditorPanel. We forward them only when
  // present so products that pre-date the migration keep their existing
  // saved shape untouched.
  if (Array.isArray(lv.sections) && lv.sections.length > 0) {
    payload.sections = lv.sections;
  }
  if (lv.primaryColor) payload.primaryColor = lv.primaryColor;
  if (lv.accentColor) payload.accentColor = lv.accentColor;

  return payload;
}
