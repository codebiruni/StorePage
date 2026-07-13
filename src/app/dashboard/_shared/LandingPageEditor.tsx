"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import YouTubePreview from "@/shired-component/YouTubePreview";

type ThemeKey =
  | "atelier"
  | "midnight"
  | "kinetic"
  | "pillar"
  | "origin"
  | "classic"
  | "bold"
  | "trust"
  | "minimal"
  | "videoHero";

const THEMES: { value: ThemeKey; label: string; hint: string }[] = [
  {
    value: "atelier",
    label: "Atelier",
    hint: "Editorial serif — generous whitespace, persimmon accent. Quiet, considered, gallery-paced.",
  },
  {
    value: "midnight",
    label: "Midnight",
    hint: "Dark luxury — champagne accent on ink. Cinematic pacing, full-bleed photography.",
  },
  {
    value: "kinetic",
    label: "Kinetic",
    hint: "Motion-led sans — mono eyebrows, marquee stats, sharp UI. Bold and fast.",
  },
  {
    value: "pillar",
    label: "Pillar",
    hint: "Trust-led serif — navy + forest accent. Press logos, founder voice, methodical proof.",
  },
  {
    value: "origin",
    label: "Origin",
    hint: "Minimal monochrome — white wall, single accent. Restraint is the moment.",
  },
  // Legacy themes kept as opt-in fallbacks; the renderer auto-migrates
  // saved products to the closest modern theme on next load.
  { value: "classic", label: "↪ Classic (legacy)", hint: "Auto-migrates to Atelier." },
  { value: "bold", label: "↪ Bold (legacy)", hint: "Auto-migrates to Kinetic." },
  { value: "trust", label: "↪ Trust (legacy)", hint: "Auto-migrates to Pillar." },
  { value: "minimal", label: "↪ Minimal (legacy)", hint: "Auto-migrates to Origin." },
  { value: "videoHero", label: "↪ Video Hero (legacy)", hint: "Auto-migrates to Midnight." },
];

export interface LandingFormValue {
  theme: ThemeKey;
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
}

const EMPTY: LandingFormValue = {
  theme: "atelier",
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
};

interface Props {
  productId?: string;
  value?: LandingFormValue;
  onChange?: (value: LandingFormValue) => void;
}

function ListEditor({
  values,
  onChange,
  placeholder,
  rows = 2,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  rows?: number;
}) {
  function update(i: number, val: string) {
    onChange(values.map((v, idx) => (idx === i ? val : v)));
  }
  function add() {
    onChange([...values, ""]);
  }
  function remove(i: number) {
    onChange(values.filter((_, idx) => idx !== i));
  }
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex items-start gap-2">
          <Textarea
            value={v}
            rows={rows}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className="min-h-[60px]"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(i)}
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        className="w-full"
      >
        <Plus className="mr-1 h-4 w-4" /> Add
      </Button>
    </div>
  );
}

export default function LandingPageEditor({
  productId,
  value: controlled,
  onChange,
}: Props) {
  const [internal, setInternal] = useState<LandingFormValue>(EMPTY);
  const value = controlled ?? internal;
  const setValue = (next: LandingFormValue) => {
    if (!controlled) setInternal(next);
    onChange?.(next);
  };

  function patch<K extends keyof LandingFormValue>(
    key: K,
    v: LandingFormValue[K],
  ) {
    setValue({ ...value, [key]: v });
  }

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const landingUrl = productId ? `${origin}/step/${productId}` : "";

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
              Ultra-fast standalone sales funnel at{" "}
              <code className="rounded bg-rose-100 px-1.5 py-0.5 text-xs">
                /step/{productId}
              </code>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyUrl} disabled={!productId}>
              <Copy className="mr-1 h-4 w-4" /> Copy URL
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={openPreview} disabled={!productId}>
              <ExternalLink className="mr-1 h-4 w-4" /> Preview
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme picker */}
        <div className="grid gap-2">
          <Label>Theme</Label>
          <Select
            value={value.theme}
            onValueChange={(v) => patch("theme", v as ThemeKey)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.label}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {t.hint}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hero copy */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Hero badge</Label>
            <Input
              value={value.heroBadge}
              onChange={(e) => patch("heroBadge", e.target.value)}
              placeholder="Limited Time Offer"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Hero subtitle</Label>
            <Input
              value={value.heroSubtitle}
              onChange={(e) => patch("heroSubtitle", e.target.value)}
              placeholder="প্রাকৃতিক উপাদান, ১০০% অরিজিনাল, ক্যাশ অন ডেলিভারি"
            />
          </div>
          <div className="space-y-1 sm:col-span-1">
            <Label>CTA label</Label>
            <Input
              value={value.heroCtaLabel}
              onChange={(e) => patch("heroCtaLabel", e.target.value)}
              placeholder="অর্ডার করুন"
            />
          </div>
        </div>

        {/* Pain points */}
        <div className="space-y-2">
          <Label>Pain Points (কষ্ট / সমস্যা)</Label>
          <ListEditor
            values={value.painPoints}
            onChange={(v) => patch("painPoints", v)}
            placeholder="প্রতিদিন ক্লান্তি অনুভব করছেন?"
          />
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <Label>Benefits (সুবিধা)</Label>
          <ListEditor
            values={value.benefits}
            onChange={(v) => patch("benefits", v)}
            placeholder="১০০% প্রাকৃতিক উপাদান — কোন ক্ষতিকর রাসায়নিক নেই"
          />
        </div>

        {/* How-to */}
        <div className="space-y-2">
          <Label>How to use (ব্যবহারের নিয়ম)</Label>
          <ListEditor
            values={value.howToUse}
            onChange={(v) => patch("howToUse", v)}
            placeholder="প্রতিদিন সকালে খালি পেটে ১ চামচ পানিসহ গ্রহণ করুন"
          />
        </div>

        {/* Trust badges */}
        <div className="space-y-2">
          <Label>Trust badges (max 6)</Label>
          <ListEditor
            values={value.trustBadges}
            onChange={(v) => patch("trustBadges", v.slice(0, 6))}
            placeholder="সারাদেশে ডেলিভারি"
            rows={1}
          />
        </div>

        {/* Guarantee */}
        <div className="space-y-2">
          <Label>Guarantee copy</Label>
          <Textarea
            value={value.guarantee}
            onChange={(e) => patch("guarantee", e.target.value)}
            placeholder="পণ্য হাতে পেয়ে সন্তুষ্ট না হলে ৩ দিনের মধ্যে ফেরত দিন..."
            rows={3}
          />
        </div>

        {/* VSL */}
        <div className="space-y-2">
          <Label>Video URL (only used by Video Hero theme)</Label>
          <Input
            value={value.vslUrl}
            onChange={(e) => patch("vslUrl", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        {/* YouTube showcase (used by ALL themes) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="youtubeUrl">
              YouTube Showcase Video{" "}
              <span className="text-xs font-normal text-slate-500">
                (optional — shown above the order form on every theme)
              </span>
            </Label>
            {value.youtubeUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => patch("youtubeUrl", "")}
                className="text-rose-600 hover:text-rose-700"
              >
                Clear
              </Button>
            ) : null}
          </div>
          <Input
            id="youtubeUrl"
            value={value.youtubeUrl}
            onChange={(e) => patch("youtubeUrl", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          />
          {/* Live click-to-play preview. Only mounts when the user clicks Play
              so typing the URL never causes YouTube's heavy iframe to load. */}
          {value.youtubeUrl ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Live Preview
              </p>
              <YouTubePreview
                url={value.youtubeUrl}
                interactive
                title="Preview"
                className="mx-auto max-w-md"
              />
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Paste any{" "}
              <code className="rounded bg-slate-100 px-1">
                youtube.com/watch?v=…
              </code>{" "}
              or{" "}
              <code className="rounded bg-slate-100 px-1">
                youtu.be/…
              </code>{" "}
              link. The video will render on the public landing page above
              the order form.
            </p>
          )}
        </div>

        {/* Checkout note */}
        <div className="space-y-2">
          <Label>Checkout note</Label>
          <Textarea
            value={value.checkoutNote}
            onChange={(e) => patch("checkoutNote", e.target.value)}
            placeholder="আজই অর্ডার করুন — ক্যাশ অন ডেলিভারি প্রযোজ্য"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/** Plain React-hook-form-friendly value shape (matches ILandingPage + theme). */
export const EMPTY_LANDING_VALUE = EMPTY;