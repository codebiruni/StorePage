"use client";

import { useEffect } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import { Plus, Trash2, Wand2 } from "lucide-react";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ProductFormData } from "./types";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

/**
 * Step 2 — Pricing & stock.
 *
 * UX:
 *   - Single product price + stock first (the 90% case).
 *   - Auto-derived discount % from prevPrice vs currentPrice.
 *   - Variants, coupons, and offers behind switches to keep the form short.
 */
export default function PricingStep({ form }: Props) {
  const cpWatch = useWatch({
    control: form.control,
    name: "generalPrice.currentPrice",
  });
  const ppWatch = useWatch({
    control: form.control,
    name: "generalPrice.prevPrice",
  });
  const useVariants = useWatch({
    control: form.control,
    name: "_useVariants" as keyof ProductFormData,
    // @ts-expect-error — using _-prefixed internal flag for UI-only state
    defaultValue: false,
  }) as boolean;
  const useOffers = useWatch({
    control: form.control,
    name: "_useOffers" as keyof ProductFormData,
    // @ts-expect-error — internal flag for UI-only state
    defaultValue: false,
  }) as boolean;
  const useCoupons = useWatch({
    control: form.control,
    name: "_useCoupons" as keyof ProductFormData,
    // @ts-expect-error — internal flag for UI-only state
    defaultValue: false,
  }) as boolean;

  const variants = useFieldArray({ control: form.control, name: "priceVariants" });
  const coupons = useFieldArray({ control: form.control, name: "coupon" });

  // Auto-derive discount percentage whenever prices change.
  useEffect(() => {
    const current = Number(cpWatch) || 0;
    const prev = Number(ppWatch) || 0;
    if (prev > 0 && current > 0 && current < prev) {
      const pct = Math.round(((prev - current) / prev) * 100);
      form.setValue("generalPrice.discountPercentage", pct, {
        shouldDirty: false,
      });
    } else if (current >= prev) {
      form.setValue("generalPrice.discountPercentage", 0, {
        shouldDirty: false,
      });
    }
  }, [cpWatch, ppWatch, form]);

  return (
    <div className="space-y-6">
      {/* ── Price & stock (always shown) ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Price & stock</CardTitle>
          <CardDescription>
            Set the product price and how many you have available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="generalPrice.currentPrice"
              rules={{
                required: "Price is required",
                min: { value: 0, message: "Must be 0 or more" },
                valueAsNumber: true,
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Price <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="generalPrice.prevPrice"
              rules={{
                required: "Compare-at price is required",
                min: { value: 0, message: "Must be 0 or more" },
                valueAsNumber: true,
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Compare-at price <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="generalPrice.discountPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount %</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        readOnly
                        value={field.value ?? 0}
                        className="bg-muted/40 pr-10"
                      />
                      <Wand2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Auto-calculated from prices above.
                  </p>
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="stock"
              rules={{
                required: "Stock is required",
                min: { value: 0, message: "Must be 0 or more" },
                valueAsNumber: true,
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Stock <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Featured product</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Highlight on the storefront homepage.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Variants (off by default) ───────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Variants</CardTitle>
              <CardDescription>
                Optional — different sizes, colours or bundles, each with its
                own price and stock.
              </CardDescription>
            </div>
            <FormField
              control={form.control}
              name="_useVariants"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={(v) => {
                        field.onChange(v);
                        if (!v) {
                          // When toggled off, wipe the variant rows so they
                          // don't leak back to the API as garbage.
                          form.setValue("priceVariants", [], {
                            shouldDirty: true,
                          });
                        } else if (variants.fields.length === 0) {
                          form.setValue(
                            "priceVariants",
                            [
                              {
                                sku: "",
                                regularPrice: 0,
                                salePrice: 0,
                                stock: 0,
                              },
                            ],
                            { shouldDirty: true },
                          );
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardHeader>

        {useVariants && (
          <CardContent className="space-y-4">
            {variants.fields.map((f, i) => (
              <div
                key={f.id}
                className="rounded-lg border bg-muted/20 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Variant #{i + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => variants.remove(i)}
                    disabled={variants.fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name={`priceVariants.${i}.sku`}
                    rules={{ required: "SKU is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. RED-L" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`priceVariants.${i}.regularPrice`}
                    rules={{
                      required: "Price is required",
                      min: 0,
                      valueAsNumber: true,
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            {...field}
                            value={field.value ?? 0}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`priceVariants.${i}.salePrice`}
                    rules={{ min: 0, valueAsNumber: true }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            {...field}
                            value={field.value ?? 0}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`priceVariants.${i}.stock`}
                    rules={{
                      required: "Stock is required",
                      min: 0,
                      valueAsNumber: true,
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            step={1}
                            {...field}
                            value={field.value ?? 0}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                variants.append({
                  sku: "",
                  regularPrice: 0,
                  salePrice: 0,
                  stock: 0,
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Add another variant
            </Button>
          </CardContent>
        )}
      </Card>

      {/* ── Coupons (off by default) ────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Coupons</CardTitle>
              <CardDescription>
                Optional — promotional codes customers can apply at checkout.
              </CardDescription>
            </div>
            <FormField
              control={form.control}
              name="_useCoupons"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={(v) => {
                        field.onChange(v);
                        if (!v) {
                          form.setValue("coupon", [], { shouldDirty: true });
                        } else if (coupons.fields.length === 0) {
                          form.setValue(
                            "coupon",
                            [{ name: "", Type: "parcent", totalOffer: 0 }],
                            { shouldDirty: true },
                          );
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardHeader>

        {useCoupons && (
          <CardContent className="space-y-4">
            {coupons.fields.map((f, i) => (
              <div
                key={f.id}
                className="grid gap-3 rounded-lg border bg-muted/20 p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
              >
                <FormField
                  control={form.control}
                  name={`coupon.${i}.name`}
                  rules={{ required: "Coupon name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. SUMMER10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`coupon.${i}.Type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="parcent">% off</SelectItem>
                          <SelectItem value="offer">Flat offer</SelectItem>
                          <SelectItem value="freeDelevery">
                            Free delivery
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`coupon.${i}.totalOffer`}
                  rules={{
                    required: "Value is required",
                    min: 0,
                    valueAsNumber: true,
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => coupons.remove(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                coupons.append({ name: "", Type: "parcent", totalOffer: 0 })
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Add another coupon
            </Button>
          </CardContent>
        )}
      </Card>

      {/* ── Offers (off by default) ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Time-limited offer</CardTitle>
              <CardDescription>
                Optional — show a countdown / sale tag on the storefront.
              </CardDescription>
            </div>
            <FormField
              control={form.control}
              name="_useOffers"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={(v) => {
                        field.onChange(v);
                        form.setValue("hasOffer", v, { shouldDirty: true });
                        if (!v) {
                          form.setValue("offerPercentage", 0, {
                            shouldDirty: true,
                          });
                          form.setValue("offerEndDate", undefined, {
                            shouldDirty: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardHeader>

        {useOffers && (
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="offerPercentage"
              rules={{
                min: { value: 0, message: "Must be positive" },
                max: { value: 100, message: "Max 100%" },
                valueAsNumber: true,
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offer %</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="offerEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ends on</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value
                          ? new Date(field.value).toISOString().slice(0, 10)
                          : ""
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        )}
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Tip: leave Compare-at price equal to Price to show no discount.
      </p>
    </div>
  );
}
