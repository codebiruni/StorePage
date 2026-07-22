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

type ThemeKey = "health";

const THEMES: { value: ThemeKey; label: string; hint: string }[] = [
  {
    value: "health",
    label: "Health",
    hint: "High-contrast funnel — red CTA, single product, repeated offer. Built for health / wellness / consumables.",
  },
];

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
}

const EMPTY: LandingFormValue = {
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

interface Props {
  productId?: string;
  value?: LandingFormValue;
  onChange?: (value: LandingFormValue) => void;
}

/**
 * Coerce an incoming (possibly partial) value into a fully-populated
 * `LandingFormValue`. Products saved before new fields were added to the
 * editor will be missing those array fields, and calling `.map` on
 * `undefined` blows up the form. Defaulting missing arrays to `[]` keeps
 * the editor safe across all stored products.
 */
function normalize(input: Partial<LandingFormValue> | undefined): LandingFormValue {
  const base = input ?? {};
  return {
    theme: (base.theme as ThemeKey) ?? EMPTY.theme,
    heroTitle: base.heroTitle ?? "",
    heroSubtitle: base.heroSubtitle ?? "",
    heroBadge: base.heroBadge ?? EMPTY.heroBadge,
    heroCtaLabel: base.heroCtaLabel ?? EMPTY.heroCtaLabel,
    painPoints: base.painPoints ?? [],
    benefits: base.benefits ?? [],
    howToUse: base.howToUse ?? [],
    guarantee: base.guarantee ?? "",
    trustBadges: base.trustBadges ?? [],
    vslUrl: base.vslUrl ?? "",
    youtubeUrl: base.youtubeUrl ?? "",
    checkoutNote: base.checkoutNote ?? "",
    comparisonOursTitle: base.comparisonOursTitle ?? "",
    comparisonOursItems: base.comparisonOursItems ?? [],
    comparisonOthersTitle: base.comparisonOthersTitle ?? "",
    comparisonOthersItems: base.comparisonOthersItems ?? [],
    phoneStripNote: base.phoneStripNote ?? "",
  };
}

function ListEditor({
  values,
  onChange,
  placeholder,
  rows = 2,
}: {
  values: string[] | undefined;
  onChange: (next: string[]) => void;
  placeholder: string;
  rows?: number;
}) {
  const list = values ?? [];
  function update(i: number, val: string) {
    onChange(list.map((v, idx) => (idx === i ? val : v)));
  }
  function add() {
    onChange([...list, ""]);
  }
  function remove(i: number) {
    onChange(list.filter((_, idx) => idx !== i));
  }
  return (
    <div className="space-y-2">
      {list.map((v, i) => (
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
  const value = controlled ? normalize(controlled) : internal;
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
          <div className="space-y-1 sm:col-span-3">
            <Label>Hero title</Label>
            <Textarea
              value={value.heroTitle}
              onChange={(e) => patch("heroTitle", e.target.value)}
              placeholder="মাথা ব্যথা থেকে মুক্তি পান ১০ মিনিটে"
              rows={2}
              className="min-h-[60px]"
            />
          </div>
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

        {/* Phone strip — used by the Health theme. */}
        <div className="space-y-2">
          <Label>
            Phone strip headline{" "}
            <span className="text-xs font-normal text-slate-500">
              (used by Health theme)
            </span>
          </Label>
          <Input
            value={value.phoneStripNote}
            onChange={(e) => patch("phoneStripNote", e.target.value)}
            placeholder="ফোনে অর্ডার করুন অথবা প্রয়োজনে কল করুন"
          />
        </div>

        {/* Comparison block — used by the Health theme. */}
        <div className="space-y-4 rounded-lg border border-rose-200 bg-white p-4">
          <div>
            <Label className="text-base">
              Comparison block — "আমরা VS অন্যরা"
            </Label>
            <p className="mt-1 text-xs text-slate-500">
              Two columns shown side by side on the Health theme. Leave a
              column empty to fall back to a sensible generic copy that
              works for any product category.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm">"আমাদের" column title</Label>
              <Input
                value={value.comparisonOursTitle}
                onChange={(e) =>
                  patch("comparisonOursTitle", e.target.value)
                }
                placeholder="আমাদের পণ্য"
              />
              <Label className="text-sm">"আমাদের" claims</Label>
              <ListEditor
                values={value.comparisonOursItems}
                onChange={(v) => patch("comparisonOursItems", v)}
                placeholder="কাচা বিটরুট এর রস থেকে পাউডার করা হয়েছে"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">"অন্যরা" column title</Label>
              <Input
                value={value.comparisonOthersTitle}
                onChange={(e) =>
                  patch("comparisonOthersTitle", e.target.value)
                }
                placeholder="বাজারের অন্যান্য পণ্য"
              />
              <Label className="text-sm">"অন্যরা" claims</Label>
              <ListEditor
                values={value.comparisonOthersItems}
                onChange={(v) => patch("comparisonOthersItems", v)}
                placeholder="কৃত্রিম রঙ বা প্রিজারভেটিভ মেশানো হয়"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Plain React-hook-form-friendly value shape (matches ILandingPage + theme). */
export const EMPTY_LANDING_VALUE = EMPTY;