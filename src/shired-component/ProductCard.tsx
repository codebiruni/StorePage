/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import AddCart from "./add-cart";
import AddWishlist from "./add-wishlist";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import QuickOrderModal from "./QuickOrderModal";
import { resolveProductImage } from "@/lib/productImage";

export default function ProductCard({ product }: { product: any }) {
  const router = useRouter();
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);

  const firstImage =
    (Array.isArray(product?.images) && product.images.length > 0
      ? resolveProductImage(product.images)
      : resolveProductImage(product?.images?.[0] || product?.image));

  const secondImage =
    (Array.isArray(product?.images) && product.images.length > 1
      ? resolveProductImage(product.images.slice(1))
      : null) ||
    (product?.image2 ? resolveProductImage(product.image2) : null) ||
    firstImage;

  const currentPrice = product?.generalPrice?.currentPrice ?? 0;
  const prevPrice = product?.generalPrice?.prevPrice;
  const discountPercentage = product?.generalPrice?.discountPercentage ?? 0;

  const compaireData = {
    id: product?._id,
    name: product?.name || "Product",
    image: firstImage,
    image2: secondImage,
    price: currentPrice,
  };

  const navigateToDetails = () => {
    router.push(`/product/product-details/${product?._id}`);
  };

  return (
    <>
      <Card className="relative group flex flex-col justify-between cursor-pointer p-0 overflow-hidden border border-border/80 rounded-2xl shadow-xs hover:shadow-md transition-all bg-card">
        {/* Wishlist & Cart hover overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <AddWishlist product={compaireData} />
          <AddCart product={compaireData} />
        </div>

        {/* Product Image */}
        <div
          onClick={navigateToDetails}
          className="relative w-full aspect-square overflow-hidden bg-muted/20"
        >
          <Image
            width={300}
            height={300}
            src={firstImage}
            alt={product?.name || "Product image"}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
          />
          <Image
            width={300}
            height={300}
            src={secondImage}
            alt={product?.name || "Product image"}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />

          {discountPercentage > 0 && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-foreground/90 text-background backdrop-blur-md shadow-xs tracking-tight">
                -{discountPercentage}%
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <CardContent
          onClick={navigateToDetails}
          className="p-3 space-y-1.5"
        >
          <h3 className="text-xs sm:text-sm font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors min-h-[2.5rem] leading-snug">
            {product?.name || "Unnamed Product"}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-primary font-mono">
              ৳{currentPrice.toLocaleString()}
            </span>
            {prevPrice && prevPrice > currentPrice ? (
              <span className="text-[11px] sm:text-xs line-through text-muted-foreground font-mono">
                ৳{prevPrice.toLocaleString()}
              </span>
            ) : null}
            {discountPercentage > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                -{discountPercentage}%
              </span>
            )}
          </div>
        </CardContent>

        {/* Footer with Un-clipped, Full-Width CTAs */}
        <CardFooter className="p-3 pt-0 flex flex-col gap-1.5">
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsQuickOrderOpen(true);
            }}
            className="w-full cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-bold h-9 px-3 shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.98] transition-all rounded-xl"
          >
            <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>অর্ডার করুন</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigateToDetails();
            }}
            className="w-full cursor-pointer text-xs font-medium h-7.5 px-2 border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
          >
            বিস্তারিত দেখুন
          </Button>
        </CardFooter>
      </Card>

      <QuickOrderModal
        product={product}
        open={isQuickOrderOpen}
        onOpenChange={setIsQuickOrderOpen}
      />
    </>
  );
}
