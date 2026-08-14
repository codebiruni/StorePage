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

import { GripVertical, Plus, Trash2 } from "lucide-react";
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

import { ColorPickerField } from "./primitives/ColorPickerField";
import {
  ALL_SECTION_TYPES,
  renderSectionForm,
  sectionTypeLabel,
} from "./sectionForms";
import {
  THEME_PRESETS,
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
}

/**
 * Display labels for theme presets. The `THEME_PRESETS` map stores tokens
 * only, so we keep a parallel map for human-readable names. Order is
 * stable across renders so the dropdown is predictable.
 */
const PRESET_LABELS: Record<ThemePresetId, string> = {
  health: "Health (red)",
  organic: "Organic (green)",
  fashion: "Fashion (purple)",
  food: "Food (green & amber)",
  default: "Default (slate & blue)",
};

export default function SectionEditorPanel({ value, onChange }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  /**
   * Section currently being dragged. When null, no drag is in progress.
   * We use plain HTML5 DnD (no extra dep) — set during `dragstart`,
   * read on `drop`, and cleared on `dragend`.
   */
  const [dragId, setDragId] = useState<string | null>(null);

  function patchTheme(patch: Partial<LandingTheme>) {
    onChange({ ...value, theme: { ...value.theme, ...patch } });
  }

  function updateSection(next: Section) {
    onChange({
      ...value,
      sections: value.sections.map((s) => (s.id === next.id ? next : s)),
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
    // makeSection already fills in defaults via `defaultSectionData`. Set
    // a fresh id (its internal one was generated already but the call
    // site owns the canonical id so other UI can predict it).
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
      <section className="space-y-3 rounded-lg border border-black/10 bg-white p-4">
        <header>
          <h3 className="text-sm font-semibold">Theme</h3>
          <p className="text-xs text-black/50">
            Pick a preset, then override the primary or accent color if you
            want a custom accent. Clearing a color returns to the preset.
          </p>
        </header>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Preset</label>
          <Select
            value={value.theme.presetId}
            onValueChange={(v) => setPreset(v as ThemePresetId)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a preset" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((id) => (
                <SelectItem key={id} value={id}>
                  {PRESET_LABELS[id]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ColorPickerField
            label="Primary"
            hint="Used for backgrounds and headings."
            value={value.theme.primaryColor ?? ""}
            onChange={(primaryColor) => patchTheme({ primaryColor })}
          />
          <ColorPickerField
            label="Accent"
            hint="Used for buttons and the offer price."
            value={value.theme.accentColor ?? ""}
            onChange={(accentColor) => patchTheme({ accentColor })}
          />
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
                  "rounded-lg border border-black/10 bg-white transition-opacity",
                  dragId === section.id && "opacity-50",
                )}
              >
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-black/[0.02]"
                  onClick={() =>
                    setOpenId((cur) => (cur === section.id ? null : section.id))
                  }
                >
                  <span className="flex flex-1 items-center gap-2">
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
                    {section.type === "footer" ? (
                      <span
                        className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800"
                        title="The Footer always renders after the order form on the public page."
                      >
                        always last
                      </span>
                    ) : null}
                  </span>

                  <span
                    className="flex items-center gap-1"
                    // Stop the row-toggle from firing when the admin uses
                    // the delete button — it's nested inside the row button.
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeSection(section.id)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </span>
                </button>

                {openId === section.id && (
                  <div className="border-t border-black/5 px-3 py-3">
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