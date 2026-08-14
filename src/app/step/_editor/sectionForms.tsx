"use client";

/**
 * Per-section admin forms. Each `renderSectionForm` call takes a section
 * from the typed union and a setter that updates one field on its data
 * object; the section editor panel (SectionEditorPanel) wraps this with
 * the accordion / add / remove / reorder chrome.
 *
 * Keeping each section's form next to its data shape (rather than in
 * `LandingPageEditor.tsx`) means new sections are added by:
 *   1. Adding a type to `Section` union in landing-config.ts.
 *   2. Adding a render case here.
 *   3. Adding the section component to the renderer switch.
 * No central "form registry" or "section catalogue" file is required.
 */

import { ImageUploadField } from "./primitives/ImageUploadField";
import { PriceField } from "./primitives/PriceField";
import { RepeatingListField } from "./primitives/RepeatingListField";
import { TextArea } from "./primitives/TextArea";
import { TextField } from "./primitives/TextField";
import type {
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
  Section,
  TestimonialsSection,
  TrustBadgeSection,
} from "../_lib/landing-config";

// ─────────────────────────────────────────────────────────────────────────
// Shared "patch this section" helper
// ─────────────────────────────────────────────────────────────────────────

/**
 * Return a new section with `data` partially updated. Used by every form
 * below to push edits back up to the section editor's state.
 */
export function patchSectionData<S extends Section>(
  section: S,
  patch: Partial<S["data"]>
): S {
  // TS can't narrow `Section["data"]` to `S["data"]` here — they're the
  // same runtime shape but different compile-time types per discriminator.
  return {
    ...section,
    data: { ...(section.data as object), ...(patch as object) },
  } as S;
}

// ─────────────────────────────────────────────────────────────────────────
// Per-section forms
// ─────────────────────────────────────────────────────────────────────────

/**
 * Convert a stored countdown timestamp into the "YYYY-MM-DDTHH:mm" string
 * that <input type="datetime-local"> expects. Accepts either a full ISO
 * string (saved by older versions of this form) or already-local strings
 * (saved by the current version). Returns "" when nothing usable is stored.
 */
function toLocalInputValue(value: string | undefined): string {
  if (!value) return "";
  // Already in the shape we want — don't re-parse it through Date, which
  // would shift it back into UTC and display the wrong moment.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return value.slice(0, 16);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function HeaderForm({
  section,
  onChange,
}: {
  section: HeaderSection;
  onChange: (next: HeaderSection) => void;
}) {
  return (
    <div className="space-y-3">
      <ImageUploadField
        label="Logo"
        hint="Brand mark shown top-left. Transparent PNG looks best."
        aspectRatio={4 / 1}
        value={section.data.logoUrl}
        onChange={(logoUrl) => onChange(patchSectionData(section, { logoUrl }))}
      />
      <TextField
        label="CTA label"
        hint="Button shown top-right."
        value={section.data.ctaLabel ?? ""}
        onChange={(ctaLabel) =>
          onChange(patchSectionData(section, { ctaLabel }))
        }
      />
      <TextField
        label="CTA link"
        hint="Where the button goes. Leave empty to scroll to the order form."
        value={section.data.ctaHref ?? ""}
        onChange={(ctaHref) =>
          onChange(patchSectionData(section, { ctaHref }))
        }
      />
    </div>
  );
}

export function HeroForm({
  section,
  onChange,
}: {
  section: HeroSection;
  onChange: (next: HeroSection) => void;
}) {
  return (
    <div className="space-y-3">
      <TextField
        label="Badge"
        hint="Eyebrow text above the headline (e.g. 'Limited Time Offer')."
        value={section.data.badge ?? ""}
        onChange={(badge) => onChange(patchSectionData(section, { badge }))}
      />
      <TextField
        label="Headline"
        hint="The main pitch."
        value={section.data.headline ?? ""}
        onChange={(headline) =>
          onChange(patchSectionData(section, { headline }))
        }
      />
      <TextArea
        label="Subheadline"
        hint="1–2 sentences of supporting copy."
        value={section.data.subheadline ?? ""}
        onChange={(subheadline) =>
          onChange(patchSectionData(section, { subheadline }))
        }
      />
      <TextField
        label="YouTube URL"
        hint="Paste a watch / youtu.be link. Shown as an embed if set."
        value={section.data.videoUrl ?? ""}
        onChange={(videoUrl) =>
          onChange(patchSectionData(section, { videoUrl }))
        }
      />
      <ImageUploadField
        label="Hero image"
        hint="Background image — landscape, ~1200×675. Used when no video is set."
        aspectRatio={16 / 9}
        value={section.data.heroImage}
        onChange={(heroImage) =>
          onChange(patchSectionData(section, { heroImage }))
        }
      />
      <TextField
        label="CTA label"
        value={section.data.ctaLabel ?? ""}
        onChange={(ctaLabel) =>
          onChange(patchSectionData(section, { ctaLabel }))
        }
      />
    </div>
  );
}

export function BenefitsForm({
  section,
  onChange,
}: {
  section: BenefitsSection;
  onChange: (next: BenefitsSection) => void;
}) {
  return (
    <div className="space-y-3">
      <TextField
        label="Title"
        value={section.data.title ?? ""}
        onChange={(title) => onChange(patchSectionData(section, { title }))}
      />
      <RepeatingListField
        label="Items"
        hint="Each item becomes a checkmark bullet."
        items={section.data.items ?? []}
        itemKey={(_, i) => String(i)}
        newItem={() => ({ text: "" })}
        onChange={(items) => onChange(patchSectionData(section, { items }))}
        renderItem={(row, _idx, updateRow) => (
          <TextField
            label=""
            value={row.text}
            onChange={(text) => updateRow({ ...row, text })}
          />
        )}
      />
    </div>
  );
}

export function TrustBadgeForm({
  section,
  onChange,
}: {
  section: TrustBadgeSection;
  onChange: (next: TrustBadgeSection) => void;
}) {
  return (
    <div className="space-y-3">
      <ImageUploadField
        label="Badge image"
        hint="Certification / lab report — portrait, ~4:5."
        aspectRatio={4 / 5}
        value={section.data.image}
        onChange={(image) => onChange(patchSectionData(section, { image }))}
      />
      <TextField
        label="Caption"
        value={section.data.caption ?? ""}
        onChange={(caption) =>
          onChange(patchSectionData(section, { caption }))
        }
      />
    </div>
  );
}

export function ProductShowcaseForm({
  section,
  onChange,
}: {
  section: ProductShowcaseSection;
  onChange: (next: ProductShowcaseSection) => void;
}) {
  const images = section.data.images ?? [];
  return (
    <div className="space-y-3">
      <TextField
        label="Caption"
        value={section.data.caption ?? ""}
        onChange={(caption) =>
          onChange(patchSectionData(section, { caption }))
        }
      />
      <RepeatingListField<string>
        label="Images"
        hint="Square product shots, 1:1. Add one row per image."
        items={images}
        itemKey={(v, i) => `${i}:${v.slice(-12)}`}
        newItem={() => ""}
        onChange={(next) =>
          onChange(patchSectionData(section, { images: next }))
        }
        renderItem={(url, _idx, updateRow) => (
          <ImageUploadField
            label="Image"
            aspectRatio={1}
            value={url}
            onChange={(u) => updateRow(u)}
          />
        )}
      />
    </div>
  );
}

export function PricingForm({
  section,
  onChange,
}: {
  section: PricingSection;
  onChange: (next: PricingSection) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <PriceField
          label="Regular price"
          value={section.data.regularPrice ?? 0}
          onChange={(regularPrice) =>
            onChange(patchSectionData(section, { regularPrice }))
          }
        />
        <PriceField
          label="Offer price"
          value={section.data.offerPrice ?? 0}
          onChange={(offerPrice) =>
            onChange(patchSectionData(section, { offerPrice }))
          }
        />
      </div>
      <TextField
        label="Bundle note"
        hint="Shown below the price, e.g. 'Buy 2, save ৳133'."
        value={section.data.bundleNote ?? ""}
        onChange={(bundleNote) =>
          onChange(patchSectionData(section, { bundleNote }))
        }
      />
      <TextField
        label="CTA label"
        value={section.data.ctaLabel ?? ""}
        onChange={(ctaLabel) =>
          onChange(patchSectionData(section, { ctaLabel }))
        }
      />
    </div>
  );
}

export function ComparisonForm({
  section,
  onChange,
}: {
  section: ComparisonSection;
  onChange: (next: ComparisonSection) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Our column title"
          value={section.data.oursTitle ?? ""}
          onChange={(oursTitle) =>
            onChange(patchSectionData(section, { oursTitle }))
          }
        />
        <TextField
          label="Their column title"
          value={section.data.theirsTitle ?? ""}
          onChange={(theirsTitle) =>
            onChange(patchSectionData(section, { theirsTitle }))
          }
        />
      </div>
      <RepeatingListField<string>
        label="Our claims"
        hint="Each becomes a green check."
        items={section.data.ours ?? []}
        itemKey={(v, i) => `${i}:${v.slice(-12)}`}
        newItem={() => ""}
        onChange={(next) => onChange(patchSectionData(section, { ours: next }))}
        renderItem={(v, _i, update) => (
          <TextField
            label=""
            value={v}
            onChange={(next) => update(next)}
          />
        )}
      />
      <RepeatingListField<string>
        label="Their claims"
        hint="Each becomes a red cross."
        items={section.data.theirs ?? []}
        itemKey={(v, i) => `${i}:${v.slice(-12)}`}
        newItem={() => ""}
        onChange={(next) => onChange(patchSectionData(section, { theirs: next }))}
        renderItem={(v, _i, update) => (
          <TextField
            label=""
            value={v}
            onChange={(next) => update(next)}
          />
        )}
      />
    </div>
  );
}

export function TestimonialsForm({
  section,
  onChange,
}: {
  section: TestimonialsSection;
  onChange: (next: TestimonialsSection) => void;
}) {
  return (
    <div className="space-y-3">
      <TextField
        label="Title"
        value={section.data.title ?? ""}
        onChange={(title) => onChange(patchSectionData(section, { title }))}
      />
      <RepeatingListField
        label="Items"
        hint="Customer quote, name, and optional screenshot."
        items={section.data.items ?? []}
        itemKey={(_, i) => String(i)}
        newItem={() => ({ name: "", text: "" })}
        onChange={(items) => onChange(patchSectionData(section, { items }))}
        renderItem={(row, _i, update) => (
          <div className="space-y-2">
            <ImageUploadField
              label="Screenshot"
              aspectRatio={3 / 4}
              value={row.image}
              onChange={(image) => update({ ...row, image })}
            />
            <TextField
              label="Name"
              value={row.name ?? ""}
              onChange={(name) => update({ ...row, name })}
            />
            <TextArea
              label="Quote"
              value={row.text ?? ""}
              onChange={(text) => update({ ...row, text })}
            />
          </div>
        )}
      />
    </div>
  );
}

export function FaqForm({
  section,
  onChange,
}: {
  section: FaqSection;
  onChange: (next: FaqSection) => void;
}) {
  return (
    <RepeatingListField
      label="Questions"
      hint="Each Q/A pair becomes a disclosure row."
      items={section.data.items ?? []}
      itemKey={(_, i) => String(i)}
      newItem={() => ({ q: "", a: "" })}
      onChange={(items) => onChange(patchSectionData(section, { items }))}
      renderItem={(row, _i, update) => (
        <div className="space-y-2">
          <TextField
            label="Question"
            value={row.q}
            onChange={(q) => update({ ...row, q })}
          />
          <TextArea
            label="Answer"
            value={row.a}
            onChange={(a) => update({ ...row, a })}
          />
        </div>
      )}
    />
  );
}

export function CountdownForm({
  section,
  onChange,
}: {
  section: CountdownSection;
  onChange: (next: CountdownSection) => void;
}) {
  return (
    <div className="space-y-3">
      <TextField
        label="Label"
        value={section.data.label ?? ""}
        onChange={(label) => onChange(patchSectionData(section, { label }))}
      />
      <TextField
        label="Ends at"
        hint="Local date-time. Timer counts down to this moment."
        value={toLocalInputValue(section.data.endsAt)}
        inputProps={{ type: "datetime-local" }}
        onChange={(endsAt) => {
          // <input type="datetime-local"> returns "YYYY-MM-DDTHH:mm" with
          // no timezone. Store that string verbatim so the field round-trips
          // and the countdown uses the exact moment the user picked.
          onChange(patchSectionData(section, { endsAt }));
        }}
      />
    </div>
  );
}

export function FooterForm({
  section,
  onChange,
}: {
  section: FooterSection;
  onChange: (next: FooterSection) => void;
}) {
  return (
    <div className="space-y-3">
      <TextField
        label="Copyright"
        hint="e.g. 'Copyright © 2026 Your Brand'."
        value={section.data.copyrightText ?? ""}
        onChange={(copyrightText) =>
          onChange(patchSectionData(section, { copyrightText }))
        }
      />
      <TextField
        label="Credit"
        hint="Optional credit line, e.g. 'Designed by Studio'."
        value={section.data.creditText ?? ""}
        onChange={(creditText) =>
          onChange(patchSectionData(section, { creditText }))
        }
      />
    </div>
  );
}

export function FormTitleForm({
  section,
  onChange,
}: {
  section: FormTitleSection;
  onChange: (next: FormTitleSection) => void;
}) {
  return (
    <div className="space-y-3">
      <TextField
        label="Heading"
        hint="Shown directly above the order form on the public page."
        value={section.data.heading ?? ""}
        onChange={(heading) =>
          onChange(patchSectionData(section, { heading }))
        }
      />
      <TextArea
        label="Subtitle"
        hint="Optional. A short line below the heading."
        value={section.data.subheading ?? ""}
        onChange={(subheading) =>
          onChange(patchSectionData(section, { subheading }))
        }
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Dispatcher
// ─────────────────────────────────────────────────────────────────────────

/**
 * Render the form for any section. Returns null for unknown types.
 */
export function renderSectionForm(
  section: Section,
  onChange: (next: Section) => void
) {
  switch (section.type) {
    case "header":
      return <HeaderForm section={section} onChange={onChange as (n: HeaderSection) => void} />;
    case "hero":
      return <HeroForm section={section} onChange={onChange as (n: HeroSection) => void} />;
    case "benefits":
      return <BenefitsForm section={section} onChange={onChange as (n: BenefitsSection) => void} />;
    case "trustBadge":
      return <TrustBadgeForm section={section} onChange={onChange as (n: TrustBadgeSection) => void} />;
    case "productShowcase":
      return <ProductShowcaseForm section={section} onChange={onChange as (n: ProductShowcaseSection) => void} />;
    case "pricing":
      return <PricingForm section={section} onChange={onChange as (n: PricingSection) => void} />;
    case "comparison":
      return <ComparisonForm section={section} onChange={onChange as (n: ComparisonSection) => void} />;
    case "testimonials":
      return <TestimonialsForm section={section} onChange={onChange as (n: TestimonialsSection) => void} />;
    case "faq":
      return <FaqForm section={section} onChange={onChange as (n: FaqSection) => void} />;
    case "countdown":
      return <CountdownForm section={section} onChange={onChange as (n: CountdownSection) => void} />;
    case "footer":
      return <FooterForm section={section} onChange={onChange as (n: FooterSection) => void} />;
    case "formTitle":
      return <FormTitleForm section={section} onChange={onChange as (n: FormTitleSection) => void} />;
    default:
      return null;
  }
}

/** Pretty-print a section type for the editor UI. */
export function sectionTypeLabel(type: Section["type"]): string {
  switch (type) {
    case "header":
      return "Header";
    case "hero":
      return "Hero";
    case "benefits":
      return "Benefits";
    case "trustBadge":
      return "Trust Badge";
    case "productShowcase":
      return "Product Showcase";
    case "pricing":
      return "Pricing";
    case "comparison":
      return "Comparison";
    case "testimonials":
      return "Testimonials";
    case "faq":
      return "FAQ";
    case "countdown":
      return "Countdown";
    case "footer":
      return "Footer";
    case "formTitle":
      return "Form Title";
  }
}

/** All section types available in the "Add section" dropdown. */
export const ALL_SECTION_TYPES: Section["type"][] = [
  "header",
  "hero",
  "benefits",
  "trustBadge",
  "productShowcase",
  "pricing",
  "comparison",
  "testimonials",
  "faq",
  "countdown",
  "footer",
  "formTitle",
];