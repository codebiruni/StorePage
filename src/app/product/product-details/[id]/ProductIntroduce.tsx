/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Clock, Check } from "lucide-react";
import ActionsButtonComponent from "./ActionsButtonComponent";

interface PriceVariant {
  _id?: string;
  regularPrice: number;
  salePrice: number;
  quentity: number;
  sku: string;
}

interface ProductIntroduceProps {
  data: {
    quentity: any;
    name: string;
    brand?: string;
    category?: any;
    quickOverview?: string[];
    hasOffer?: boolean;
    offerEndDate?: string | Date;
    offerPercentage?: number;
    generalPrice: {
      currentPrice: number;
      prevPrice: number;
      discountPercentage: number;
    };
    priceVariants: PriceVariant[];
    details: string;
  };
  handleBuyData: (selectedQty: number) => void;
  infoData: any;
  onVariantChange?: (payload: {
    selectedIndex: number | null;
    priceInfo: any;
  }) => void;
}

// Helper to coerce product `quentity` into a usable number
function parseStock(input: any): number {
  if (typeof input === "number") return input;
  if (input && typeof input === "object" && "$numberInt" in input) {
    return Number(input.$numberInt) || 0;
  }
  const n = Number(input);
  return Number.isFinite(n) ? n : 0;
}

export default function ProductIntroduce({
  handleBuyData,
  data,
  infoData,
  onVariantChange,
}: ProductIntroduceProps) {
  const {
    name,
    brand,
    category,
    quickOverview = [],
    hasOffer,
    offerEndDate,
    generalPrice,
    priceVariants = [],
  } = data;

  const variants = useMemo(
    () =>
      (priceVariants || []).filter(
        (v) => v && (v.sku || v.regularPrice || v.salePrice)
      ),
    [priceVariants]
  );

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const active = selectedIndex !== null ? variants[selectedIndex] : null;

  const displayedPrice = active
    ? active.salePrice > 0 && active.salePrice < active.regularPrice
      ? active.salePrice
      : active.regularPrice
    : generalPrice.currentPrice;

  const displayedPrevPrice = active
    ? active.salePrice > 0 && active.salePrice < active.regularPrice
      ? active.regularPrice
      : 0
    : generalPrice.prevPrice;

  const displayedDiscount = useMemo(() => {
    if (displayedPrevPrice > 0 && displayedPrice > 0 && displayedPrice < displayedPrevPrice) {
      return Math.round(
        ((displayedPrevPrice - displayedPrice) / displayedPrevPrice) * 100
      );
    }
    return 0;
  }, [displayedPrevPrice, displayedPrice]);

  const isOfferActive = useMemo(() => {
    if (!hasOffer) return false;
    if (!offerEndDate) return true;
    return new Date(offerEndDate).getTime() > Date.now();
  }, [hasOffer, offerEndDate]);

  const totalStock = active
    ? active.quentity
    : variants.length > 0
    ? variants.reduce((sum, v) => sum + (v.quentity || 0), 0)
    : parseStock(data.quentity);

  const priceInfo = active
    ? {
        currentPrice: displayedPrice,
        prevPrice: displayedPrevPrice,
        discountPercentage: displayedDiscount,
        variantSku: active.sku,
        variantStock: active.quentity,
        variantId: active._id || null,
      }
    : {
        currentPrice: generalPrice.currentPrice,
        prevPrice: generalPrice.prevPrice,
        discountPercentage: generalPrice.discountPercentage,
        variantSku: null,
        variantStock: parseStock(data.quentity),
        variantId: null,
      };

  useEffect(() => {
    if (selectedIndex !== null && !variants[selectedIndex]) {
      setSelectedIndex(null);
    }
  }, [variants, selectedIndex]);

  useEffect(() => {
    if (onVariantChange) {
      onVariantChange({ selectedIndex, priceInfo });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, displayedPrice, displayedPrevPrice]);

  const categoryName = typeof category === "string" ? category : category?.name;

  return (
    <div className="w-full flex flex-col justify-between space-y-6">
      <div className="space-y-5">
        {/* Category & Brand Micro-Header */}
        <div className="flex flex-wrap items-center gap-2">
          {categoryName && (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {categoryName}
            </span>
          )}
          {categoryName && brand && (
            <span className="text-muted-foreground/40 text-xs">•</span>
          )}
          {brand && (
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
              {brand}
            </span>
          )}
          {isOfferActive && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="h-3 w-3" />
              লিমিটেড অফার
            </span>
          )}
        </div>

        {/* Product Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold tracking-tight text-foreground leading-snug">
          {name}
        </h1>

        {/* Typographic Price Display (No heavy card boxes) */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold text-foreground font-mono tracking-tight">
              ৳{displayedPrice.toLocaleString()}
            </span>

            {displayedPrevPrice > displayedPrice && (
              <span className="text-lg sm:text-xl text-muted-foreground line-through font-mono">
                ৳{displayedPrevPrice.toLocaleString()}
              </span>
            )}

            {displayedDiscount > 0 && (
              <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {displayedDiscount}% ছাড়
              </span>
            )}
          </div>

          {displayedPrevPrice > displayedPrice && (
            <p className="text-xs text-muted-foreground">
              সাশ্রয়: ৳{(displayedPrevPrice - displayedPrice).toLocaleString()}
            </p>
          )}

          {isOfferActive && offerEndDate && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium pt-0.5">
              অফারের মেয়াদ:{" "}
              {new Date(offerEndDate).toLocaleDateString("bn-BD", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })} পর্যন্ত
            </p>
          )}
        </div>

        {/* Quick Highlights / Bullet points */}
        {quickOverview && quickOverview.length > 0 && (
          <div className="py-1">
            <ul className="space-y-1.5">
              {quickOverview.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0 mt-2" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Variant Selection Box Grid */}
        {variants.length > 0 && (
          <div id="variant-selection" className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-foreground">
                অপশন বা ভ্যারিয়েন্ট বেছে নিন:
              </span>
              {active && (
                <span className="text-muted-foreground text-xs">
                  সিলেক্টেড: <span className="font-bold text-foreground">{active.sku}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {variants.map((v, idx) => {
                const isSelected = selectedIndex === idx;
                const outStock = (v.quentity || 0) <= 0;
                const hasDiscount = v.salePrice > 0 && v.salePrice < v.regularPrice;
                const vPrice = hasDiscount ? v.salePrice : v.regularPrice;

                return (
                  <button
                    key={v._id || v.sku || idx}
                    type="button"
                    disabled={outStock}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative flex flex-col justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-xs"
                        : "border-border bg-card hover:border-foreground/30 hover:bg-muted/40"
                    } ${
                      outStock
                        ? "opacity-50 cursor-not-allowed bg-muted/20"
                        : "cursor-pointer"
                    }`}
                  >
                    {/* Header: SKU / Title & Selection Indicator */}
                    <div className="w-full flex items-start justify-between gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-foreground leading-tight line-clamp-2">
                        {v.sku}
                      </span>
                      {isSelected ? (
                        <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-border shrink-0 mt-0.5" />
                      )}
                    </div>

                    {/* Footer: Price & Stock Information */}
                    <div className="mt-2.5 pt-2 border-t border-border/50 w-full flex flex-col gap-0.5">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-sm font-bold font-mono text-primary">
                          ৳{vPrice.toLocaleString()}
                        </span>
                        {hasDiscount && (
                          <span className="text-[11px] text-muted-foreground line-through font-mono">
                            ৳{v.regularPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-medium ${
                          outStock
                            ? "text-rose-600 dark:text-rose-400 font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {outStock ? "স্টক শেষ" : `স্টক: ${v.quentity} টি`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedIndex === null && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                * অনুগ্রহ করে যেকোনো একটি অপশন নির্বাচন করুন
              </p>
            )}
          </div>
        )}

        <Separator className="my-2" />

        {/* Action Button Controls */}
        <ActionsButtonComponent
          product={{ ...infoData, priceInfo }}
          handleBuyData={handleBuyData}
        />
      </div>
    </div>
  );
}
