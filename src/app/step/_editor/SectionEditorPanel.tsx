"use client";

/**
 * Section-list editor for a single landing page.
 *
 * Layout:
 *   • Theme row at the top — preset select + two color overrides.
 *   • "Add section" dropdown.
 *   • Each section rendered as an accordion card with up/down/remove
 *     controls and a per-type form (renderSectionForm).
 *
 * The panel is fully controlled — parent owns the LandingConfig and
 * re-renders on every keystroke, which is what makes the side-by-side
 * live preview work without debouncing or iframes.
 */

import { ChevronDown, ChevronUp, Code, GripVertical, Paintbrush, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { ColorPickerField } from "./primitives/ColorPickerField";
import {
  ALL_SECTION_TYPES,
  renderSectionForm,
  sectionTypeLabel,
} from "./sectionForms";
import {
  THEME_PRESETS,
  resolveThemeTokens,
  defaultSectionData,
  makeSection,
  newSectionId,
  type LandingConfig,
  type LandingTheme,
  type Section,
  type SectionType,
  type ThemePresetId,
} from "../_lib/landing-config";

interface Props {
  value: LandingConfig;
  onChange: (next: LandingConfig) => void;
  activeSectionId?: string | null;
  onSectionSelect?: (id: string) => void;
  openId?: string | null;
  onOpenIdChange?: (id: string | null) => void;
}

/**
 * Display labels for theme presets. Shown in the dropdown alongside a
 * colour swatch so admins can see the brand colour at a glance.
 */
const PRESET_LABELS: Record<ThemePresetId, string> = {
  health: "Health — Red & Rose",
  organic: "Organic — Green & Gold",
  fashion: "Fashion — Purple & Violet",
  food: "Food — Green & Amber",
  default: "Default — Slate & Blue",
};

export default function SectionEditorPanel({
  value,
  onChange,
  activeSectionId,
  onSectionSelect,
  openId: openIdProp,
  onOpenIdChange,
}: Props) {
  const [internalOpenId, setInternalOpenId] = useState<string | null>(null);
  const isControlledOpen = openIdProp !== undefined;
  const openId = isControlledOpen ? openIdProp : internalOpenId;

  function setOpenId(next: string | null) {
    if (!isControlledOpen) {
      setInternalOpenId(next);
    }
    onOpenIdChange?.(next);
  }

  function handleToggleSection(id: string) {
    const next = openId === id ? null : id;
    setOpenId(next);
    if (next) {
      onSectionSelect?.(next);
    }
  }

  /**
   * Section currently being dragged. When null, no drag is in progress.
   * We use plain HTML5 DnD (no extra dep) — set during `dragstart`,
   * read on `drop`, and cleared on `dragend`.
   */
  const [dragId, setDragId] = useState<string | null>(null);
  const [showCss, setShowCss] = useState(false);

  const tokens = useMemo(() => resolveThemeTokens(value.theme), [value.theme]);
  const preset = THEME_PRESETS[value.theme.presetId] ?? THEME_PRESETS.default;

  function patchTheme(patch: Partial<LandingTheme>) {
    onChange({ ...value, theme: { ...value.theme, ...patch } });
  }

  function updateSection(next: Section) {
    onChange({
      ...value,
      sections: value.sections.map((s) => (s.id === next.id ? next : s)),
    });
  }

  function updateSectionStyle(
    section: Section,
    patch: Partial<NonNullable<Section["style"]>>
  ) {
    updateSection({
      ...section,
      style: {
        ...(section.style ?? {}),
        ...patch,
      },
    });
  }

  function removeSection(id: string) {
    onChange({
      ...value,
      sections: value.sections
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, order: i })),
    });
  }

  function reorderSection(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const sections = [...value.sections];
    const fromIdx = sections.findIndex((s) => s.id === sourceId);
    const toIdx = sections.findIndex((s) => s.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = sections.splice(fromIdx, 1);
    sections.splice(toIdx, 0, moved);
    onChange({
      ...value,
      sections: sections.map((s, i) => ({ ...s, order: i })),
    });
  }

  function addSection(type: SectionType) {
    const id = newSectionId();
    const order = value.sections.length;
    const section = makeSection(type, order);
    section.id = id;
    section.data = defaultSectionData(type) as Section["data"];
    onChange({ ...value, sections: [...value.sections, section] });
    setOpenId(id);
  }

  function setPreset(presetId: ThemePresetId) {
    // Picking a preset clears any per-product color overrides so the
    // landing page reads as the canonical preset; admins can re-override
    // from the color pickers below.
    onChange({
      ...value,
      theme: { presetId },
    });
  }

  const addableTypes = useMemo(() => ALL_SECTION_TYPES, []);

  return (
    <div className="space-y-6">
      {/* ── Theme ───────────────────────────────────────────────────── */}
      <section
        id="builder-section-theme"
        data-builder-section-id="theme"
        className={cn(
          "space-y-4 rounded-lg border bg-white p-4 transition-all duration-200",
          activeSectionId === "theme"
            ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm"
            : "border-black/10"
        )}
      >
        <header>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Paintbrush className="h-4 w-4" />
            Theme Preset &amp; Global Colors
          </h3>
          <p className="text-xs text-black/50">
            Pick a base preset — the whole page repaints instantly. Optionally override individual colors below.
          </p>
        </header>

        {/* Preset picker with colour swatches */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Preset</label>
          <Select
            value={value.theme.presetId}
            onValueChange={(v) => setPreset(v as ThemePresetId)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select preset">
                {/* Show the active preset's swatch + label in the trigger */}
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full border border-black/10 flex-none"
                    style={{ background: THEME_PRESETS[value.theme.presetId]?.primary ?? "#999" }}
                  />
                  <span>{PRESET_LABELS[value.theme.presetId]}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((id) => (
                <SelectItem key={id} value={id}>
                  <span className="flex items-center gap-2.5">
                    {/* Primary swatch */}
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-black/10 flex-none"
                      style={{ background: THEME_PRESETS[id].primary }}
                    />
                    {/* Accent swatch */}
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-black/10 flex-none"
                      style={{ background: THEME_PRESETS[id].accent }}
                    />
                    <span>{PRESET_LABELS[id]}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active preset colour strip */}
        <div className="flex gap-1.5 rounded-lg overflow-hidden border border-black/5 h-6">
          {(["background", "sunken", "surface", "primary", "accent", "ink"] as const).map((key) => {
            const preset = THEME_PRESETS[value.theme.presetId] ?? THEME_PRESETS.default;
            return (
              <span
                key={key}
                title={key}
                className="flex-1 h-full"
                style={{ background: preset[key] }}
              />
            );
          })}
        </div>

        <div className="border-t border-black/5 pt-3">
          <span className="text-xs font-medium text-black/70 mb-2 block">
            Color Palette Overrides
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ColorPickerField
              label="Primary"
              hint="Headings &amp; badges."
              value={value.theme.primaryColor ?? ""}
              defaultColor={preset.primary}
              onChange={(primaryColor) => patchTheme({ primaryColor })}
            />
            <ColorPickerField
              label="Accent / CTA"
              hint="Buttons &amp; prices."
              value={value.theme.accentColor ?? ""}
              defaultColor={preset.accent}
              onChange={(accentColor) => patchTheme({ accentColor })}
            />
            <ColorPickerField
              label="Page Background"
              hint="Overall page bg."
              value={value.theme.backgroundColor ?? ""}
              defaultColor={preset.background}
              onChange={(backgroundColor) => patchTheme({ backgroundColor })}
            />
            <ColorPickerField
              label="Surface / Card Bg"
              hint="Cards &amp; panels."
              value={value.theme.surfaceColor ?? ""}
              defaultColor={preset.surface}
              onChange={(surfaceColor) => patchTheme({ surfaceColor })}
            />
            <ColorPickerField
              label="Body Text"
              hint="Paragraphs &amp; list text."
              value={value.theme.textColor ?? ""}
              defaultColor={preset.text}
              onChange={(textColor) => patchTheme({ textColor })}
            />
            <ColorPickerField
              label="Heading Text"
              hint="Headline color."
              value={value.theme.headingColor ?? ""}
              defaultColor={preset.heading ?? preset.primary}
              onChange={(headingColor) => patchTheme({ headingColor })}
            />
          </div>
        </div>

        {/* Custom CSS accordion */}
        <div className="border-t border-black/5 pt-2">
          <button
            type="button"
            className="flex w-full items-center justify-between text-xs font-medium text-black/60 hover:text-black py-1"
            onClick={() => setShowCss((v) => !v)}
          >
            <span className="flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5" />
              Advanced Custom CSS
            </span>
            {showCss ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          {showCss && (
            <div className="pt-2 space-y-1.5">
              <p className="text-[11px] text-black/50">
                Write CSS rules to override anything on the landing page (e.g.{" "}
                <code>.lp-headline &#123; text-transform: uppercase; &#125;</code>).
              </p>
              <Textarea
                rows={4}
                value={value.theme.customCss ?? ""}
                placeholder=".lp-section { ... }"
                className="font-mono text-xs"
                onChange={(e) => patchTheme({ customCss: e.target.value })}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Sections ────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Sections</h3>
            <p className="text-xs text-black/50">
              Drag the grip to reorder. Click a section to edit its content.
            </p>
          </div>

          <AddSectionDropdown available={addableTypes} onAdd={addSection} />
        </header>

        {value.sections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-black/10 bg-white p-6 text-center text-sm text-black/50">
            No sections yet. Add one from the dropdown above.
          </div>
        ) : (
          <ol className="space-y-2">
            {value.sections.map((section, idx) => (
              <li
                key={section.id}
                id={`builder-section-${section.id}`}
                data-builder-section-id={section.id}
                draggable={openId !== section.id}
                onDragStart={(e) => {
                  // The drag image is the whole row by default — fine.
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", section.id);
                  setDragId(section.id);
                }}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const sourceId = e.dataTransfer.getData("text/plain") || dragId;
                  if (sourceId) reorderSection(sourceId, section.id);
                  setDragId(null);
                }}
                onDragEnd={() => setDragId(null)}
                className={cn(
                  "rounded-lg border bg-white transition-all duration-200",
                  activeSectionId === section.id
                    ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm"
                    : "border-black/10 hover:border-black/20",
                  dragId === section.id && "opacity-50",
                )}
              >
                <div className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-black/[0.02]">
                  <button
                    type="button"
                    className="flex flex-1 cursor-pointer items-center gap-2 text-left bg-transparent border-0 p-0"
                    onClick={() => handleToggleSection(section.id)}
                  >
                    <span
                      // Drag handle — separate from the row click target so
                      // clicking the body still toggles open. Browsers only
                      // start a drag when this element is the source.
                      className="flex h-5 w-5 cursor-grab items-center justify-center rounded text-black/40 hover:bg-black/5 active:cursor-grabbing"
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-hidden="true"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/5 text-[10px] font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium">
                      {sectionTypeLabel(section.type)}
                    </span>
                    {activeSectionId === section.id && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                        in preview
                      </span>
                    )}
                    {section.type === "footer" ? (
                      <span
                        className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800"
                        title="The Footer always renders after the order form on the public page."
                      >
                        always last
                      </span>
                    ) : null}
                  </button>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeSection(section.id)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {openId === section.id && (
                  <div className="border-t border-black/5 px-3 py-3 space-y-4">
                    {/* Per-section background & styling */}
                    <div className="rounded-lg border border-black/10 bg-neutral-50/70 p-3 space-y-3">
                      <span className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                        <Paintbrush className="h-3.5 w-3.5 text-neutral-600" />
                        Section Background & Styling
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <ColorPickerField
                          label="Section Background"
                          hint="Override this section's bg"
                          value={section.style?.backgroundColor ?? ""}
                          defaultColor={
                            section.type === "footer"
                              ? tokens.ink
                              : tokens.background
                          }
                          onChange={(backgroundColor) =>
                            updateSectionStyle(section, { backgroundColor })
                          }
                        />
                        <ColorPickerField
                          label="Section Text Color"
                          hint="Override text in this section"
                          value={section.style?.textColor ?? ""}
                          defaultColor={
                            section.type === "footer"
                              ? tokens.textOnInk
                              : tokens.text
                          }
                          onChange={(textColor) =>
                            updateSectionStyle(section, { textColor })
                          }
                        />
                      </div>
                    </div>

                    {renderSectionForm(section, updateSection)}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Add-section dropdown
// ─────────────────────────────────────────────────────────────────────────

function AddSectionDropdown({
  available,
  onAdd,
}: {
  available: SectionType[];
  onAdd: (type: SectionType) => void;
}) {
  return (
    <Select onValueChange={(v) => onAdd(v as SectionType)}>
      <SelectTrigger className="w-[180px]">
        <span className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <SelectValue placeholder="Add section" />
        </span>
      </SelectTrigger>
      <SelectContent>
        {available.map((t) => (
          <SelectItem key={t} value={t}>
            {sectionTypeLabel(t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}