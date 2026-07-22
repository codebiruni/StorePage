/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tag, CheckCircle, AlertCircle } from "lucide-react";
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
    offerPercentage?: number;
    generalPrice: {
      currentPrice: number;
      prevPrice: number;
      discountPercentage: number;
    };
    priceVariants: PriceVariant[];
    details: string;
  };
}

export default function ProductIntroduce({
  handleBuyData,
  data,
  infoData,
  onVariantChange,
}: {
  handleBuyData: any;
  data: ProductIntroduceProps["data"];
  infoData: any;
  onVariantChange?: (payload: {
    selectedIndex: number | null;
    priceInfo: any;
  }) => void;
}) {
  const { name, offerPercentage, generalPrice, priceVariants, details } = data;

  // Active variant index. `null` means "no variant selected, use general price".
  const variants = useMemo(
    () =>
      (priceVariants || []).filter(
        (v) => v && (v.sku || v.regularPrice || v.salePrice)
      ),
    [priceVariants]
  );

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Helper: figure out the price we should be displaying right now.
  const active = selectedIndex !== null ? variants[selectedIndex] : null;

  const displayedPrice = active
    ? // If sale price is set (>0) and below regular, show sale; else regular.
      (active.salePrice > 0 && active.salePrice < active.regularPrice
        ? active.salePrice
        : active.regularPrice)
    : generalPrice.currentPrice;

  const displayedPrevPrice = active
    ? active.salePrice > 0 && active.salePrice < active.regularPrice
      ? active.regularPrice
      : 0
    : generalPrice.prevPrice;

  const displayedDiscount = useMemo(() => {
    if (displayedPrevPrice > 0 && displayedPrice > 0) {
      return Math.round(
        ((displayedPrevPrice - displayedPrice) / displayedPrevPrice) * 100
      );
    }
    return 0;
  }, [displayedPrevPrice, displayedPrice]);

  const totalStock = active
    ? active.quentity
    : (variants || []).reduce((sum, v) => sum + (v.quentity || 0), 0) ||
      generalPrice.currentPrice /* fallback */ ||
      0;

  // Build the priceInfo object that downstream actions (cart/buy) consume.
  // We pass the resolved variant pricing down through `infoData.priceInfo`.
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
        variantStock: quentityFromData(data.quentity),
        variantId: null,
      };

  // Find lowest priced variant for the "From BDT …" line.
  const lowestPriceVariant =
    variants.length > 0
      ? variants.reduce((lowest, variant) => {
          const v = variant.salePrice > 0 ? variant.salePrice : variant.regularPrice;
          const l =
            lowest.salePrice > 0 ? lowest.salePrice : lowest.regularPrice;
          return v < l ? variant : lowest;
        }, variants[0])
      : null;

  // Reset selection if the data array mutates and the index becomes invalid.
  useEffect(() => {
    if (selectedIndex !== null && !variants[selectedIndex]) {
      setSelectedIndex(null);
    }
  }, [variants, selectedIndex]);

  // Bubble the selected variant up so the parent's "Buy Now" handler can
  // use the variant-aware price/SKU instead of the general price.
  useEffect(() => {
    if (onVariantChange) {
      onVariantChange({ selectedIndex, priceInfo });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, displayedPrice, displayedPrevPrice]);

  return (
    <Card className="w-full shadow-none border-0 overflow-hidden">
      <CardContent className="p-6">
        {/* Product Name and Badges */}
        <div className="flex flex-col gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>

          <div className="flex flex-wrap gap-2">
            {offerPercentage && offerPercentage > 0 && (
              <Badge variant="destructive" className="px-2 py-1">
                <Tag className="h-3 w-3 mr-1" />
                {offerPercentage}% OFF
              </Badge>
            )}

            {displayedDiscount > 0 && (
              <Badge variant="outline" className="px-2 py-1 bg-primary/10">
                Save {displayedDiscount}%
              </Badge>
            )}

            {totalStock > 0 ? (
              <Badge variant="secondary" className="px-2 py-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                In Stock
              </Badge>
            ) : (
              <Badge variant="destructive" className="px-2 py-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                Out of Stock
              </Badge>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Pricing Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl font-bold text-primary">
              BDT {displayedPrice.toFixed(2)}
            </span>

            {displayedPrevPrice > displayedPrice && (
              <span className="text-lg text-muted-foreground line-through">
                BDT {displayedPrevPrice.toFixed(2)}
              </span>
            )}

            {displayedDiscount > 0 && (
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Save {displayedDiscount}%
              </span>
            )}
          </div>

          {active && (
            <p className="text-sm text-muted-foreground">
              Selected: <span className="font-medium">{active.sku}</span>{" "}
              {active.quentity <= 0 && (
                <span className="text-red-500 ml-1">(out of stock)</span>
              )}
            </p>
          )}

          {!active && variants.length > 1 && lowestPriceVariant && (
            <p className="text-sm text-muted-foreground">
              From BDT{" "}
              {(lowestPriceVariant.salePrice > 0
                ? lowestPriceVariant.salePrice
                : lowestPriceVariant.regularPrice
              ).toFixed(2)}{" "}
              {lowestPriceVariant.regularPrice >
                (lowestPriceVariant.salePrice > 0
                  ? lowestPriceVariant.salePrice
                  : lowestPriceVariant.regularPrice) && (
                <span className="line-through ml-1">
                  BDT {lowestPriceVariant.regularPrice.toFixed(2)}
                </span>
              )}
            </p>
          )}
        </div>

        <Separator className="my-6" />

        {/* Product Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Product Details</h3>
          <p className="text-muted-foreground leading-relaxed">{details}</p>
        </div>

        {variants.length > 0 && (
          <>
            <Separator className="my-6" />

            {/* Variants Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Available Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {variants.map((variant, index) => {
                  const isSelected = selectedIndex === index;
                  const isOutOfStock = (variant.quentity || 0) <= 0;
                  const showPrice =
                    variant.salePrice > 0 && variant.salePrice < variant.regularPrice
                      ? variant.salePrice
                      : variant.regularPrice;
                  return (
                    <Card
                      key={`${variant._id || variant.sku || index}`}
                      onClick={() =>
                        !isOutOfStock && setSelectedIndex(index)
                      }
                      className={`transition-all border ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/40"
                          : "hover:border-primary"
                      } ${
                        isOutOfStock
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{variant.sku}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {variant.quentity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              BDT{showPrice.toFixed(2)}
                            </p>
                            {variant.regularPrice > showPrice && (
                              <p className="text-sm text-muted-foreground line-through">
                                BDT{variant.regularPrice.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {selectedIndex === null && variants.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: pick a variant above to see the correct price and stock.
                </p>
              )}
            </div>
          </>
        )}

        <ActionsButtonComponent
          product={{ ...infoData, priceInfo }}
          handleBuyData={handleBuyData}
        />
      </CardContent>
    </Card>
  );
}

// Helper to coerce the top-level product `quentity` into a usable number.
function quentityFromData(input: any): number {
  if (typeof input === "number") return input;
  if (input && typeof input === "object" && "$numberInt" in input) {
    return Number(input.$numberInt) || 0;
  }
  const n = Number(input);
  return Number.isFinite(n) ? n : 0;
}
