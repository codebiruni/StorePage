"use client";

import { useState } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import { Plus, Tag, X, List, Sliders, Trash2, Sparkles } from "lucide-react";

import MultipleImageUpload from "@/shired-component/MultipleImageUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import CategoryCombobox from "./CategoryCombobox";
import type { ProductFormData } from "./types";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

const SPEC_PRESETS = [
  "Material",
  "Color",
  "Size",
  "Weight",
  "Warranty",
  "Origin",
];

const OVERVIEW_PRESETS = [
  "১০০% অরিজিনাল ও অথেন্টিক প্রোডাক্ট",
  "প্রিমিয়াম কোয়ালিটি ও টেকসই",
  "ক্যাশ অন ডেলিভারি সুবিধা",
  "পণ্য হাতে পেয়ে মূল্য পরিশোধের সুযোগ",
];

/**
 * Step 1 — Product Details & Identity.
 * Includes: name, brand, details, category, photos, quick overview, specifications, tags.
 */
export default function DetailsStep({ form }: Props) {
  const [tagDraft, setTagDraft] = useState("");
  const [quickDraft, setQuickDraft] = useState("");
  const watchedCategory = useWatch({ control: form.control, name: "category" });
  const images = useWatch({ control: form.control, name: "images" }) as string[];

  const tagsArray = useFieldArray({ control: form.control, name: "tags" });
  const specsArray = useFieldArray({
    control: form.control,
    name: "specifications",
  });

  const quickOverviewList = (useWatch({
    control: form.control,
    name: "quickOverview",
  }) || []) as string[];

  const handleAddTag = () => {
    const trimmed = tagDraft.trim();
    if (!trimmed) return;
    const current = (form.getValues("tags") as string[]) ?? [];
    if (current.includes(trimmed)) {
      setTagDraft("");
      return;
    }
    tagsArray.append(trimmed);
    setTagDraft("");
  };

  const handleAddQuickOverview = (text?: string) => {
    const val = (text ?? quickDraft).trim();
    if (!val) return;
    const current = (form.getValues("quickOverview") as string[]) ?? [];
    form.setValue("quickOverview", [...current, val], { shouldDirty: true });
    setQuickDraft("");
  };

  const handleRemoveQuickOverview = (index: number) => {
    const current = (form.getValues("quickOverview") as string[]) ?? [];
    const next = current.filter((_, i) => i !== index);
    form.setValue("quickOverview", next, { shouldDirty: true });
  };

  const handleAddSpecPreset = (key: string) => {
    const currentSpecs = (form.getValues("specifications") || []) as {
      key: string;
      value: string;
    }[];
    if (currentSpecs.some((s) => s.key?.toLowerCase() === key.toLowerCase())) {
      return;
    }
    specsArray.append({ key, value: "" });
  };

  const imageCount = images?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Identity ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Identity</CardTitle>
          <CardDescription>
            How customers will recognise this product in the storefront.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            rules={{
              required: "Product name is required",
              minLength: { value: 2, message: "At least 2 characters" },
              maxLength: { value: 120, message: "Keep it under 120 characters" },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Product name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Premium Cotton T-Shirt"
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Optional — e.g. Nike, Apex, Local Maker"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="details"
            rules={{
              required: "Description is required",
              minLength: { value: 10, message: "Add at least 10 characters" },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Description <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell customers what this product is, what it does, and why they should buy it."
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Plain text. Detailed overview rendered clearly on the storefront.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* ── Category ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Category</CardTitle>
          <CardDescription>
            Pick a category to filter it correctly in the storefront.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <CategoryCombobox
            form={form}
            name="category"
            label="Category"
            placeholder="Pick a category"
            endpoint="/api/v1/product/category"
          />
          <CategoryCombobox
            form={form}
            name="subCategory"
            label="Subcategory"
            placeholder={
              watchedCategory ? "Pick a subcategory" : "Pick a category first"
            }
            endpoint="/api/v1/sub-category"
            extraParams={{ category: watchedCategory }}
            disabled={!watchedCategory}
          />
        </CardContent>
      </Card>

      {/* ── Photos ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Photos
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {imageCount > 0
                ? `${imageCount} uploaded`
                : "No photos yet"}
            </span>
          </CardTitle>
          <CardDescription>
            Add at least one image. The first image is the storefront cover.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FormField
            control={form.control}
            name="images"
            rules={{
              validate: (v: string[]) =>
                (Array.isArray(v) && v.length > 0) ||
                "Add at least one product image",
            }}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <MultipleImageUpload
                    value={field.value ?? []}
                    initialImages={field.value ?? []}
                    onUpload={(urls) => field.onChange(urls)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* ── Quick Overview (Bullet Highlights) ────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <List className="h-4 w-4 text-primary" />
                Quick Overview / Highlights
              </CardTitle>
              <CardDescription>
                Key bullet points shown directly next to the price on the product page.
              </CardDescription>
            </div>
            {quickOverviewList.length > 0 && (
              <Badge variant="secondary">
                {quickOverviewList.length} bullet{quickOverviewList.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={quickDraft}
              onChange={(e) => setQuickDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddQuickOverview();
                }
              }}
              placeholder="e.g. ১০০% অরিজিনাল ও অথেন্টিক প্রোডাক্ট বা ফ্রি সাইজ"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleAddQuickOverview()}
              disabled={!quickDraft.trim()}
            >
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 mr-1">
              <Sparkles className="h-3 w-3" /> Quick suggestions:
            </span>
            {OVERVIEW_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleAddQuickOverview(preset)}
                className="rounded-full bg-muted hover:bg-muted/80 px-2.5 py-1 text-xs transition-colors"
              >
                + {preset}
              </button>
            ))}
          </div>

          {/* Render active bullets */}
          {quickOverviewList.length > 0 ? (
            <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
              {quickOverviewList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-md bg-background px-3 py-2 text-sm shadow-xs border border-border/40"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {idx + 1}
                    </span>
                    <span className="truncate">{item}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveQuickOverview(idx)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No highlights added yet. Add short bullets to help customers make quick decisions.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Product Specifications ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                Technical Specifications
              </CardTitle>
              <CardDescription>
                Detailed attributes (e.g. Material, Color, Size, Weight, Warranty) rendered in a clean table.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => specsArray.append({ key: "", value: "" })}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Row
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 mr-1">
              <Sparkles className="h-3 w-3" /> Quick presets:
            </span>
            {SPEC_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleAddSpecPreset(preset)}
                className="rounded-full bg-muted hover:bg-muted/80 px-2.5 py-1 text-xs transition-colors"
              >
                + {preset}
              </button>
            ))}
          </div>

          {specsArray.fields.length > 0 ? (
            <div className="space-y-2.5">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                <div className="col-span-5">Attribute / Key</div>
                <div className="col-span-6">Value</div>
                <div className="col-span-1 text-center"></div>
              </div>

              {specsArray.fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      {...form.register(`specifications.${index}.key`)}
                      placeholder="e.g. Material"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-6">
                    <Input
                      {...form.register(`specifications.${index}.value`)}
                      placeholder="e.g. 100% Cotton / Navy Blue"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => specsArray.remove(index)}
                      aria-label="Remove specification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              No specifications added. Click &quot;Add Row&quot; or choose a preset above to add product details.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Optional: tags ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tags</CardTitle>
          <CardDescription>
            Optional — used for search and filtering. Press Enter to add.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="e.g. summer, new-arrival, fashion"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddTag}
              disabled={!tagDraft.trim()}
            >
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
          {tagsArray.fields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tagsArray.fields.map((f, i) => (
                <Badge key={f.id} variant="secondary" className="gap-1 px-2 py-1">
                  <Tag className="h-3 w-3" />
                  {(form.getValues(`tags.${i}`) as string) || ""}
                  <button
                    type="button"
                    onClick={() => tagsArray.remove(i)}
                    className="ml-1 rounded-full p-0.5 hover:bg-background/60"
                    aria-label="Remove tag"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Required fields are marked with <span className="text-destructive">*</span>.
      </p>
    </div>
  );
}
