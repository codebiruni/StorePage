"use client";

import { useState } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import { Plus, Tag, X } from "lucide-react";

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

/**
 * Step 1 — the only fields the server strictly requires:
 *   name, details, category, images (≥ 1), generalPrice.
 * Everything else here is optional and visually de-emphasized.
 */
export default function DetailsStep({ form }: Props) {
  const [tagDraft, setTagDraft] = useState("");
  const watchedCategory = useWatch({ control: form.control, name: "category" });
  const images = useWatch({ control: form.control, name: "images" }) as string[];

  const tagsArray = useFieldArray({ control: form.control, name: "tags" });

  const handleAddTag = () => {
    const trimmed = tagDraft.trim();
    if (!trimmed) return;
    // Avoid duplicates — react-hook-form field arrays don't dedupe by default.
    const current = (form.getValues("tags") as string[]) ?? [];
    if (current.includes(trimmed)) {
      setTagDraft("");
      return;
    }
    tagsArray.append(trimmed);
    setTagDraft("");
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
                    placeholder="Optional — e.g. Nike, Local Maker"
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
                  Plain text. Markdown is not rendered on the storefront.
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
            placeholder={watchedCategory ? "Pick a subcategory" : "Pick a category first"}
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
              placeholder="e.g. summer, new-arrival"
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
