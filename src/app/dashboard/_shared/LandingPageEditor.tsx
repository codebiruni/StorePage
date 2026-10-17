"use client";

/**
 * Dashboard-side landing page editor.
 *
 * Public API (kept stable so `LandingStep` / `ProductWizard` don't need to
 * change yet): accepts a flat `LandingFormValue` and emits one on every
 * edit. Internally, this component now:
 *   1. Projects the flat value to a typed `LandingConfig`.
 *   2. Renders the new section-list editor (`SectionEditorPanel`) on the
 *      left and the actual landing page renderer (`LandingPageRenderer`)
 *      on the right for a side-by-side live preview.
 *   3. Projects the typed `LandingConfig` back to the flat shape on every
 *      change so persistence stays untouched. The typed section list and
 *      theme colors are forwarded alongside the legacy fields so the
 *      public renderer can use whichever view it prefers.
 */

import { useEffect, useRef, useState } from "react";
import { Copy, ExternalLink, Link2, Link2Off, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import SectionEditorPanel from "@/app/step/_editor/SectionEditorPanel";
import {
  configToFlat,
  flatToConfig,
  type FlatLandingPage,
} from "@/app/step/_lib/landing-adapter";
import type { LandingConfig, Section } from "@/app/step/_lib/landing-config";

/* ─────────────────────────────────────────────────────────────────────────
 * Public types — kept identical to the previous file shape so existing
 * imports (`LandingStep`, `ProductWizard`, `interface/product.interface.ts`)
 * continue to compile.
 * ───────────────────────────────────────────────────────────────────────── */

type ThemeKey = "health" | "organic" | "fashion" | "food" | "default";

export interface LandingFormValue {
  theme: ThemeKey;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroCtaLabel: string;
  painPoints: string[];
  benefits: string[];
  howToUse: string[];
  guarantee: string;
  trustBadges: string[];
  vslUrl: string;
  youtubeUrl: string;
  checkoutNote: string;
  comparisonOursTitle: string;
  comparisonOursItems: string[];
  comparisonOthersTitle: string;
  comparisonOthersItems: string[];
  phoneStripNote: string;
  // ── Typed-section view (forwarded to `persistLanding` when present) ──
  // The `SectionEditorPanel` produces these via the typed `LandingConfig`.
  // They are optional so legacy callers that only set flat fields keep
  // compiling unchanged.
  sections?: Section[];
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  headingColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  customCss?: string;
}

export const EMPTY_LANDING_VALUE: LandingFormValue = {
  theme: "health",
  heroTitle: "",
  heroSubtitle: "",
  heroBadge: "Limited Time Offer",
  heroCtaLabel: "অর্ডার করুন",
  painPoints: [],
  benefits: [],
  howToUse: [],
  guarantee: "",
  trustBadges: [],
  vslUrl: "",
  youtubeUrl: "",
  checkoutNote: "",
  comparisonOursTitle: "আমাদের পণ্য",
  comparisonOursItems: [],
  comparisonOthersTitle: "বাজারের অন্যান্য পণ্য",
  comparisonOthersItems: [],
  phoneStripNote: "ফোনে অর্ডার করুন অথবা প্রয়োজনে কল করুন",
};

function normalize(input: Partial<LandingFormValue> | undefined): LandingFormValue {
  const base = input ?? {};

  const theme: ThemeKey =
    base.theme === "organic" ||
    base.theme === "fashion" ||
    base.theme === "food" ||
    base.theme === "default"
      ? base.theme
      : "health";
  // Forward the typed-section view verbatim when present. `configToFlat`
  // is the source of truth for these fields — we never recompute them
  // here, only round-trip what the adapter already produced.
  const sections = Array.isArray(base.sections) ? base.sections : undefined;
  const primaryColor =
    typeof base.primaryColor === "string" && base.primaryColor.length > 0
      ? base.primaryColor
      : undefined;
  const accentColor =
    typeof base.accentColor === "string" && base.accentColor.length > 0
      ? base.accentColor
      : undefined;
  const backgroundColor =
    typeof base.backgroundColor === "string" && base.backgroundColor.length > 0
      ? base.backgroundColor
      : undefined;
  const surfaceColor =
    typeof base.surfaceColor === "string" && base.surfaceColor.length > 0
      ? base.surfaceColor
      : undefined;
  const textColor =
    typeof base.textColor === "string" && base.textColor.length > 0
      ? base.textColor
      : undefined;
  const headingColor =
    typeof base.headingColor === "string" && base.headingColor.length > 0
      ? base.headingColor
      : undefined;
  const fontFamily =
    typeof base.fontFamily === "string" && base.fontFamily.length > 0
      ? base.fontFamily
      : undefined;
  const borderRadius =
    typeof base.borderRadius === "string" && base.borderRadius.length > 0
      ? base.borderRadius
      : undefined;
  const customCss =
    typeof base.customCss === "string" && base.customCss.length > 0
      ? base.customCss
      : undefined;
  return {
    theme,
    heroTitle: base.heroTitle ?? "",
    heroSubtitle: base.heroSubtitle ?? "",
    heroBadge: base.heroBadge ?? EMPTY_LANDING_VALUE.heroBadge,
    heroCtaLabel: base.heroCtaLabel ?? EMPTY_LANDING_VALUE.heroCtaLabel,
    painPoints: base.painPoints ?? [],
    benefits: base.benefits ?? [],
    howToUse: base.howToUse ?? [],
    guarantee: base.guarantee ?? "",
    trustBadges: base.trustBadges ?? [],
    vslUrl: base.vslUrl ?? "",
    youtubeUrl: base.youtubeUrl ?? "",
    checkoutNote: base.checkoutNote ?? "",
    comparisonOursTitle:
      base.comparisonOursTitle ?? EMPTY_LANDING_VALUE.comparisonOursTitle,
    comparisonOursItems: base.comparisonOursItems ?? [],
    comparisonOthersTitle:
      base.comparisonOthersTitle ?? EMPTY_LANDING_VALUE.comparisonOthersTitle,
    comparisonOthersItems: base.comparisonOthersItems ?? [],
    phoneStripNote: base.phoneStripNote ?? EMPTY_LANDING_VALUE.phoneStripNote,
    ...(sections ? { sections } : null),
    ...(primaryColor ? { primaryColor } : null),
    ...(accentColor ? { accentColor } : null),
    ...(backgroundColor ? { backgroundColor } : null),
    ...(surfaceColor ? { surfaceColor } : null),
    ...(textColor ? { textColor } : null),
    ...(headingColor ? { headingColor } : null),
    ...(fontFamily ? { fontFamily } : null),
    ...(borderRadius ? { borderRadius } : null),
    ...(customCss ? { customCss } : null),
  };
}

/* ─────────────────────────────────────────────────────────────────────────
 * Adapter: flat LandingFormValue <-> typed LandingConfig
 * ───────────────────────────────────────────────────────────────────────── */

function fromFlat(
  productId: string | undefined,
  flat: LandingFormValue
): LandingConfig {
  const id = productId ?? "preview";
  return flatToConfig(id, id, flat as unknown as FlatLandingPage);
}

function toFlat(
  config: LandingConfig,
  previous: LandingFormValue
): LandingFormValue {
  const flat = configToFlat(config, previous as unknown as FlatLandingPage);
  // configToFlat returns a broader FlatLandingPage (it can carry fields
  // outside the editor's shape, e.g. `videoUrl`); `normalize` only reads
  // the named fields the editor cares about.
  return normalize(flat as unknown as LandingFormValue);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Component
 * ───────────────────────────────────────────────────────────────────────── */

interface Props {
  productId?: string;
  value?: LandingFormValue;
  onChange?: (value: LandingFormValue) => void;
}

export default function LandingPageEditor({
  productId,
  value: controlled,
  onChange,
}: Props) {
  const [internal, setInternal] = useState<LandingFormValue>(
    EMPTY_LANDING_VALUE
  );
  const value = controlled ? normalize(controlled) : internal;

  // Config is the source of truth for the renderer / editor. We mirror it
  // back to `flat` on every change so the wizard's onChange keeps
  // receiving the legacy shape.
  const [config, setConfig] = useState<LandingConfig>(() =>
    fromFlat(productId, value)
  );

  // Re-sync when the external value or productId changes. We compare
  // against a ref so we only re-bootstrap once per productId swap, not
  // on every local keystroke round-trip.
  const lastSyncedProductId = useRef<string | undefined>(productId);
  useEffect(() => {
    if (productId !== lastSyncedProductId.current) {
      lastSyncedProductId.current = productId;
      setConfig(fromFlat(productId, value));
    }
  }, [productId, value]);

  // Active section tracked across Builder and Preview for synchronized navigation
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [isSyncScrollEnabled, setIsSyncScrollEnabled] = useState(true);

  const builderScrollRef = useRef<HTMLDivElement | null>(null);
  const ignoreScrollUntilRef = useRef<number>(0);

  // Live preview iframe — mirrors the actual public page at /step/[id].
  // We hold a ref to its contentWindow so we can postMessage the current
  // draft on every edit. The iframe's StepPreviewBridge listens and
  // re-renders using the supplied flat value instead of the saved one.
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  // Latest flat value, read by the message-sender effect below so we
  // don't have to re-bind the postMessage handler on every keystroke.
  const latestFlatRef = useRef<FlatLandingPage>(
    value as unknown as FlatLandingPage,
  );
  useEffect(() => {
    latestFlatRef.current = value as unknown as FlatLandingPage;
  }, [value]);

  // Whenever the iframe signals it's ready (initial load + any reload
  // from a productId swap), flush the current draft so the mirrored
  // page catches up to whatever edits exist on the parent's local state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onMessage(event: MessageEvent<unknown>) {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      const data = event.data as { type?: unknown; sectionId?: unknown } | null;
      if (!data) return;

      if (data.type === "landing-preview-ready") {
        flushDraft();
        return;
      }

      // Synchronize scroll: When the user scrolls in the preview, scroll the builder to match
      // Note: Disabled on mobile view (< 1024px) to prevent back-and-forth viewport jumping
      if (data.type === "preview-section-in-view" && typeof data.sectionId === "string") {
        if (!isSyncScrollEnabled) return;
        if (typeof window !== "undefined" && window.innerWidth < 1024) return;
        if (Date.now() < ignoreScrollUntilRef.current) return;

        const targetSectionId = data.sectionId;
        setActiveSectionId(targetSectionId);

        const container = builderScrollRef.current;
        const el = document.getElementById(
          targetSectionId === "theme"
            ? "builder-section-theme"
            : `builder-section-${targetSectionId}`
        );
        if (el && container) {
          ignoreScrollUntilRef.current = Date.now() + 600;
          const containerRect = container.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const relativeTop = elRect.top - containerRect.top + container.scrollTop;
          container.scrollTo({
            top: Math.max(0, relativeTop - 16),
            behavior: "smooth",
          });
        }
        return;
      }

      // When the user clicks on a section in the preview, scroll and open it in the builder
      // Note: Disabled on mobile view (< 1024px)
      if (data.type === "preview-section-clicked" && typeof data.sectionId === "string") {
        if (typeof window !== "undefined" && window.innerWidth < 1024) return;

        const targetSectionId = data.sectionId;
        setActiveSectionId(targetSectionId);
        setOpenSectionId(targetSectionId);

        const container = builderScrollRef.current;
        const el = document.getElementById(
          targetSectionId === "theme"
            ? "builder-section-theme"
            : `builder-section-${targetSectionId}`
        );
        if (el && container) {
          ignoreScrollUntilRef.current = Date.now() + 600;
          const containerRect = container.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const relativeTop = elRect.top - containerRect.top + container.scrollTop;
          container.scrollTo({
            top: Math.max(0, relativeTop - 16),
            behavior: "smooth",
          });
        }
        return;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [productId, isSyncScrollEnabled]);

  function flushDraft(directFlat?: FlatLandingPage) {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const payload = directFlat ?? latestFlatRef.current;
    try {
      win.postMessage(
        { type: "landing-draft", flat: payload },
        "*",
      );
    } catch {
      /* iframe gone or cross-origin — nothing we can do. */
    }
  }

  // Push every config edit through to the iframe so the mirror updates in real time.
  useEffect(() => {
    if (!productId) return;
    flushDraft();
  }, [config, productId]);

  function handleConfigChange(next: LandingConfig) {
    setConfig(next);
    const flat = toFlat(next, value);
    latestFlatRef.current = flat as unknown as FlatLandingPage;
    if (!controlled) setInternal(flat);
    onChange?.(flat);
    flushDraft(flat as unknown as FlatLandingPage);
  }

  // Scroll preview to a specific section when selected in the builder (desktop only)
  function scrollToPreview(sectionId: string) {
    if (typeof window !== "undefined" && window.innerWidth < 1024) return;
    setActiveSectionId(sectionId);
    if (!iframeRef.current?.contentWindow) return;
    ignoreScrollUntilRef.current = Date.now() + 800;
    try {
      iframeRef.current.contentWindow.postMessage(
        { type: "scroll-to-preview-section", sectionId },
        "*"
      );
    } catch {
      /* ignore */
    }
  }

  // Handle builder container scroll to sync preview position (desktop only)
  function handleBuilderScroll() {
    if (typeof window !== "undefined" && window.innerWidth < 1024) return;
    if (!isSyncScrollEnabled) return;
    if (Date.now() < ignoreScrollUntilRef.current) return;
    const container = builderScrollRef.current;
    if (!container || !iframeRef.current?.contentWindow) return;

    const sections = Array.from(
      container.querySelectorAll<HTMLElement>("[data-builder-section-id]")
    );
    if (sections.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const anchorY = containerRect.top + containerRect.height * 0.3;

    let closestId: string | null = null;
    let minDistance = Infinity;

    for (const el of sections) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= anchorY && rect.bottom >= anchorY) {
        closestId = el.getAttribute("data-builder-section-id");
        break;
      }
      const dist = Math.abs(rect.top - anchorY);
      if (dist < minDistance) {
        minDistance = dist;
        closestId = el.getAttribute("data-builder-section-id");
      }
    }

    if (closestId && closestId !== activeSectionId) {
      setActiveSectionId(closestId);
      ignoreScrollUntilRef.current = Date.now() + 600;
      try {
        iframeRef.current.contentWindow.postMessage(
          { type: "scroll-to-preview-section", sectionId: closestId },
          "*"
        );
      } catch {
        /* ignore */
      }
    }
  }

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const landingUrl = productId ? `${origin}/step/${productId}` : "";
  const iframeSrc = productId ? `/step/${productId}` : "";

  async function copyUrl() {
    if (!landingUrl) return;
    try {
      await navigator.clipboard.writeText(landingUrl);
      toast.success("Landing URL copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  function openPreview() {
    if (!landingUrl) return;
    window.open(landingUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b border-black/5 bg-neutral-50/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg">Landing Page Builder</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Edit sections on the left, preview live on the right. Both sides scroll and sync together. Saved at{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                /step/{productId ?? "{productId}"}
              </code>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyUrl}
              disabled={!productId}
            >
              <Copy className="mr-1 h-4 w-4" /> Copy URL
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openPreview}
              disabled={!productId}
            >
              <ExternalLink className="mr-1 h-4 w-4" /> Preview
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:h-[calc(100vh-14rem)] lg:min-h-[680px] items-stretch">
          {/* Builder / Editor pane: scrollable */}
          <div className="flex flex-col rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden lg:h-full">
            <div className="flex items-center justify-between border-b border-black/5 bg-neutral-50/80 px-3.5 py-2.5 text-xs font-medium text-black/70 flex-none">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-800">Builder Sections</span>
                <span className="text-black/40">|</span>
                <span className="text-black/50 text-[11px]">
                  {config.sections.length} sections
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Scroll or select a section to preview
              </span>
            </div>

            <div
              ref={builderScrollRef}
              onScroll={handleBuilderScroll}
              className="flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth space-y-6"
            >
              <SectionEditorPanel
                value={config}
                onChange={handleConfigChange}
                activeSectionId={activeSectionId}
                onSectionSelect={scrollToPreview}
                openId={openSectionId}
                onOpenIdChange={setOpenSectionId}
              />
            </div>
          </div>

          {/* Live preview pane — iframed mirror of the actual public landing page */}
          <div className="flex flex-col rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden lg:h-full">
            <div className="flex items-center justify-between border-b border-black/5 bg-neutral-50/80 px-3.5 py-2.5 text-xs font-medium text-black/70 flex-none">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-neutral-800">Live Preview</span>
                <span className="hidden sm:inline text-black/40">|</span>
                <span className="hidden sm:inline text-black/50 text-[11px]">
                  /step/{productId ?? "{productId}"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2.5 text-xs gap-1.5 transition-colors font-normal rounded-md hidden lg:inline-flex",
                    isSyncScrollEnabled
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      : "text-muted-foreground hover:text-black border border-transparent"
                  )}
                  onClick={() => setIsSyncScrollEnabled((v) => !v)}
                  title="Toggle synchronized scrolling between Builder and Preview"
                >
                  {isSyncScrollEnabled ? (
                    <Link2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Link2Off className="h-3.5 w-3.5 opacity-50" />
                  )}
                  <span>Sync {isSyncScrollEnabled ? "On" : "Off"}</span>
                </Button>
                {iframeSrc && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-black/60 hover:text-black"
                    onClick={openPreview}
                    title="Open live landing page in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">New tab</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="relative flex-1 h-full min-h-[480px] overflow-hidden bg-white">
              {iframeSrc ? (
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  title={`Landing page preview for ${productId}`}
                  className="h-full w-full flex-1 border-0"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                  <p>
                    Save the product once to generate a URL, then the live
                    landing page will mirror here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}