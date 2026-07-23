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
import { Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
      const data = event.data as { type?: unknown } | null;
      if (data?.type === "landing-preview-ready") {
        flushDraft();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [productId]);

  function flushDraft() {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(
        { type: "landing-draft", flat: latestFlatRef.current },
        "*",
      );
    } catch {
      /* iframe gone or cross-origin — nothing we can do. */
    }
  }

  // Push every config edit (i.e. every keystroke that mutates the typed
  // `config`) through to the iframe so the mirror updates in real time.
  useEffect(() => {
    if (!productId) return;
    flushDraft();
  }, [config, productId]);

  function handleConfigChange(next: LandingConfig) {
    setConfig(next);
    const flat = toFlat(next, value);
    if (!controlled) setInternal(flat);
    onChange?.(flat);
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
    <Card className="border-rose-200 bg-rose-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>🧪 Landing Page Builder</CardTitle>
            <CardDescription>
              Edit sections on the left, the public page previews live on
              the right. Saved at{" "}
              <code className="rounded bg-rose-100 px-1.5 py-0.5 text-xs">
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

      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Editor pane */}
          <div className="rounded-lg bg-white p-3">
            <SectionEditorPanel value={config} onChange={handleConfigChange} />
          </div>

          {/* Live preview pane — iframed mirror of the actual public
              landing page. Updates on every edit via postMessage. Until
              the product has been saved at least once there's no URL to
              load, so we show a hint instead. */}
          <div className="rounded-lg border border-black/10 bg-white">
            <div className="flex items-center justify-between border-b border-black/5 px-3 py-2 text-xs font-medium text-black/60">
              <span>Live preview — mirrors /step/{productId ?? "{productId}"}</span>
              {iframeSrc && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={openPreview}
                >
                  Open in new tab
                </Button>
              )}
            </div>
            <div className="relative h-[640px] overflow-hidden bg-white">
              {iframeSrc ? (
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  title={`Landing page preview for ${productId}`}
                  className="h-full w-full border-0"
                  // Allow the iframe to be scripted into the same-origin
                  // /step/[id] route we control. `sandbox` would help
                  // harden against injected foreign HTML, but the URL is
                  // hardcoded to our own /step route so it's a no-op
                  // defence-in-depth knob here — left off intentionally.
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-rose-400" />
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