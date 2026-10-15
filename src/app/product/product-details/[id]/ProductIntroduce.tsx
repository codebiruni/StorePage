/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tag,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Check,
  Clock,
} from "lucide-react";
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
      <div className="space-y-4">
        {/* Brand & Category Meta Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {brand && (
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 border-primary/30 text-primary bg-primary/5">
              {brand}
            </Badge>
          )}
          {categoryName && (
            <Badge variant="secondary" className="text-xs text-muted-foreground">
              {categoryName}
            </Badge>
          )}
          {isOfferActive && (
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 flex items-center gap-1.5 shadow-xs">
              <Clock className="h-3 w-3" />
              লিমিটেড টাইম অফার
            </Badge>
          )}
        </div>

        {/* Product Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-snug">
          {name}
        </h1>

        {/* Price Showcase Block */}
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold text-primary font-mono tracking-tight">
              ৳{displayedPrice.toLocaleString()}
            </span>

            {displayedPrevPrice > displayedPrice && (
              <span className="text-lg sm:text-xl text-muted-foreground line-through font-mono">
                ৳{displayedPrevPrice.toLocaleString()}
              </span>
            )}

            {displayedDiscount > 0 && (
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1">
                {displayedDiscount}% ছাড়
              </Badge>
            )}
          </div>

          {displayedPrevPrice > displayedPrice && (
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              আপনি সাশ্রয় করছেন: ৳{(displayedPrevPrice - displayedPrice).toLocaleString()}
            </p>
          )}

          {isOfferActive && offerEndDate && (
            <div className="pt-1 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                অফারটির মেয়াদ:{" "}
                <span className="font-semibold">
                  {new Date(offerEndDate).toLocaleDateString("bn-BD", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {" "}পর্যন্ত
              </span>
            </div>
          )}
        </div>

        {/* Quick Overview Highlights (if available) */}
        {quickOverview && quickOverview.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              মূল আকর্ষণ ও বৈশিষ্ট্য
            </p>
            <ul className="grid grid-cols-1 gap-1.5 text-sm text-foreground">
              {quickOverview.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-foreground/90 leading-tight">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Variant Selection (if product has variants) */}
        {variants.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" />
                অপশন বা সাইজ বেছে নিন:
              </label>
              {active && (
                <span className="text-xs text-muted-foreground">
                  সিলেক্টেড: <span className="font-semibold text-foreground">{active.sku}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {variants.map((v, idx) => {
                const isSelected = selectedIndex === idx;
                const outStock = (v.quentity || 0) <= 0;
                const vPrice =
                  v.salePrice > 0 && v.salePrice < v.regularPrice
                    ? v.salePrice
                    : v.regularPrice;

                return (
                  <button
                    key={v._id || v.sku || idx}
                    type="button"
                    disabled={outStock}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs"
                        : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
                    } ${
                      outStock
                        ? "opacity-50 cursor-not-allowed bg-muted/20"
                        : "cursor-pointer"
                    }`}
                  >
                    <div className="w-full flex items-center justify-between gap-1">
                      <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                        {v.sku}
                      </span>
                      {isSelected && (
                        <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-mono font-semibold text-primary mt-1">
                      ৳{vPrice.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {outStock ? "স্টক শেষ" : `স্টক: ${v.quentity}`}
                    </span>
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

        <Separator />

        {/* Action Button Controls & Trust Badges */}
        <ActionsButtonComponent
          product={{ ...infoData, priceInfo }}
          handleBuyData={handleBuyData}
        />
      </div>
    </div>
  );
}
