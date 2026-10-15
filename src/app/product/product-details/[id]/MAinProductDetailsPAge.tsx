/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import Image from "next/image";

import ImageParts from "./ImageParts";
import ProductIntroduce from "./ProductIntroduce";
import BasicInfo from "./BasicInfo";
import useContextData from "@/defaults/custom-component/useContextData";
import { resolveProductImage } from "@/lib/productImage";
import { Button } from "@/components/ui/button";

export default function ProductDetailsClient({ product }: { product: any }) {
  const { handlePurchasedData } = useContextData();
  const router = useRouter();

  const [showStickyBar, setShowStickyBar] = useState(false);

  // Default priceInfo = general price (no variant selected yet).
  const initialPriceInfo: any = {
    currentPrice: product?.generalPrice?.currentPrice ?? 0,
    prevPrice: product?.generalPrice?.prevPrice ?? 0,
    discountPercentage: product?.generalPrice?.discountPercentage ?? 0,
    variantSku: null,
    variantId: null,
    variantStock: product?.quentity || 0,
  };
  const [priceInfo, setPriceInfo] = useState<any>(initialPriceInfo);

  // ProductIntroduce pushes its currently-selected variant up here
  const handleVariantChange = useCallback((payload: { priceInfo: any }) => {
    setPriceInfo(payload.priceInfo);
  }, []);

  const primaryImageSrc = resolveProductImage(product?.images);
  const secondaryImageSrc = resolveProductImage([product?.images?.[1], product?.images?.[0]]);

  const compaireData = {
    id: product?._id,
    name: product?.name,
    image: primaryImageSrc,
    image2: secondaryImageSrc,
    price: priceInfo.currentPrice,
    priceInfo,
  };

  const handleBuyData = (selectedQty: number = 1) => {
    const qty = typeof selectedQty === "number" && selectedQty > 0 ? selectedQty : 1;
    handlePurchasedData({
      ...compaireData,
      quantity: qty,
    });
    router.push("/buy-product");
  };

  // Track scroll position to show sticky mobile CTA bar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const categoryName = product?.category?.name || "ক্যাটাগরি";
  const subCategoryName = product?.subCategory?.name;

  return (
    <div className="top-padding min-h-screen bg-background pb-16">
      {/* ── Main Product Section ───────────────────────────────────── */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Showcase Gallery */}
          <div className="lg:col-span-7 xl:col-span-6">
            <ImageParts
              images={product?.images || []}
              discountPercentage={priceInfo?.discountPercentage || product?.generalPrice?.discountPercentage || 0}
              inStock={(priceInfo?.variantStock ?? product?.quentity ?? 0) > 0}
              isFeatured={!!product?.isFeatured}
            />
          </div>

          {/* Right Column: Buy Box & Product Info */}
          <div className="lg:col-span-5 xl:col-span-6">
            <ProductIntroduce
              handleBuyData={handleBuyData}
              infoData={compaireData}
              onVariantChange={handleVariantChange}
              data={{
                quentity: product?.quentity,
                brand: product?.brand,
                category: product?.category,
                quickOverview: product?.quickOverview,
                hasOffer: product?.hasOffer,
                offerEndDate: product?.offerEndDate,
                offerPercentage: product?.offerPercentage,
                generalPrice: product?.generalPrice || { currentPrice: 0, prevPrice: 0, discountPercentage: 0 },
                name: product?.name,
                priceVariants: product?.priceVariants || [],
                details: product?.details || "",
              }}
            />
          </div>
        </div>

        {/* ── Detailed Information Tabs (Below Fold) ────────────────── */}
        <BasicInfo
          data={{
            quickOverview: product?.quickOverview,
            offerPercentage: product?.offerPercentage,
            tags: product?.tags,
            brand: product?.brand,
            specifications: product?.specifications,
            category: categoryName,
            subCategory: subCategoryName,
            details: product?.details,
          }}
        />
      </main>

      {/* ── Floating Sticky CTA Bar on Mobile ──────────────────────── */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border p-3 shadow-2xl lg:hidden animate-in slide-in-from-bottom-2 duration-200">
          <div className="container mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative h-11 w-11 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                <Image
                  src={primaryImageSrc}
                  alt={product?.name || "Thumbnail"}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {product?.name}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-extrabold text-primary font-mono">
                    ৳{priceInfo.currentPrice.toLocaleString()}
                  </span>
                  {priceInfo.prevPrice > priceInfo.currentPrice && (
                    <span className="text-[11px] text-muted-foreground line-through font-mono">
                      ৳{priceInfo.prevPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => handleBuyData(1)}
              className="h-10 px-4 font-bold text-xs shrink-0 rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              অর্ডার করুন
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}