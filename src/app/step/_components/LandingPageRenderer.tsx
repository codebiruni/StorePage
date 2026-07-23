"use client";

/**
 * LandingPageRenderer — public-page entry point.
 *
 * Renders a LandingConfig as an ordered stack of typed sections wrapped
 * in a ThemeProvider. The same component is reused by the editor's live
 * preview (driven by local React state) so what you see is exactly what
 * gets saved.
 *
 * The fixed Order Form is appended at the bottom — it is system-driven,
 * not admin-editable.
 */

import ThemeProvider from "./ThemeProvider";
import {
  BenefitsSection,
  ComparisonSection,
  CountdownSection,
  FaqSection,
  FooterSection,
  FormTitleSection,
  HeaderSection,
  HeroSection,
  PricingSection,
  ProductShowcaseSection,
  TestimonialsSection,
  TrustBadgeSection,
} from "./sections/typed";
import OrderFormSection from "./sections/CheckoutForm";
import type { LandingConfig, Section } from "../_lib/landing-config";
import type { SerializedLandingProduct } from "../_lib/landing-data";

interface Props {
  /** Typed config produced by the section-based editor (or migrated from legacy). */
  config: LandingConfig;
  /**
   * Original product record, passed through to typed sections that need
   * product-level data (images, price, slug) and to the trailing order form.
   */
  product: SerializedLandingProduct;
}

export default function LandingPageRenderer({ config, product }: Props) {
  // The Footer section is system-positioned — it always renders after the
  // Order Form, regardless of where the admin drops it in the section list.
  // We split it out here so admin reorder controls in the editor don't end
  // up moving the footer above the form. The first copy we encounter wins;
  // duplicates are dropped to avoid a second footer sneaking in.
  //
  // The Form Title section is also system-positioned — it always renders
  // immediately above the Order Form, regardless of where the admin drops
  // it in the editable list. Its `heading`/`subheading` are forwarded to
  // the form so the headline above the inputs stays in sync with the
  // admin's edits.
  const ordered = [...config.sections].sort((a, b) => a.order - b.order);
  const footerIdx = ordered.findIndex((s) => s.type === "footer");
  const footerSection = footerIdx >= 0 ? ordered[footerIdx] : null;
  const formTitleIdx = ordered.findIndex((s) => s.type === "formTitle");
  const formTitleSection = formTitleIdx >= 0 ? ordered[formTitleIdx] : null;

  // Build the list of editable sections excluding both system-positioned
  // ones (formTitle + footer). One pass over the index avoids scanning
  // twice.
  const systemIdx = new Set<number>();
  if (footerIdx >= 0) systemIdx.add(footerIdx);
  if (formTitleIdx >= 0) systemIdx.add(formTitleIdx);
  const editableSections = ordered.filter((_, i) => !systemIdx.has(i));

  // Pass the typed formTitle copy down to the form. Empty strings fall
  // back to sensible defaults inside CheckoutForm.
  const formHeading = formTitleSection && formTitleSection.type === "formTitle"
    ? formTitleSection.data.heading
    : "";
  const formSubheading = formTitleSection && formTitleSection.type === "formTitle"
    ? formTitleSection.data.subheading ?? ""
    : "";

  return (
    <ThemeProvider theme={config.theme}>
      <div className="step-landing-body">
        {editableSections.map((s) => (
          <SectionSwitch
            key={s.id}
            section={s}
          />
        ))}
        {/* Order form lives below every editable section. Wrapped in an
            anchor target so the typed Hero / Header CTAs can scroll to it. */}
        <span id="order" />
        <OrderFormSection
          product={product}
          headingText={formHeading}
          note={formSubheading || product.landingPage?.checkoutNote}
        />
        {footerSection ? <SectionSwitch section={footerSection} /> : null}
      </div>
    </ThemeProvider>
  );
}

/** Per-section dispatcher. The default branch returns null so unknown
 *  section types silently disappear instead of crashing the page. */
function SectionSwitch({
  section,
}: {
  section: Section;
}) {
  switch (section.type) {
    case "header":
      return <HeaderSection data={section.data} />;
    case "hero":
      return <HeroSection data={section.data} />;
    case "benefits":
      return <BenefitsSection data={section.data} />;
    case "trustBadge":
      return <TrustBadgeSection data={section.data} />;
    case "productShowcase":
      return <ProductShowcaseSection data={section.data} />;
    case "pricing":
      return <PricingSection data={section.data} />;
    case "comparison":
      return <ComparisonSection data={section.data} />;
    case "testimonials":
      return <TestimonialsSection data={section.data} />;
    case "faq":
      return <FaqSection data={section.data} />;
    case "countdown":
      return <CountdownSection data={section.data} />;
    case "footer":
      return <FooterSection data={section.data} />;
    case "formTitle":
      return <FormTitleSection data={section.data} />;
    default:
      return null;
  }
}