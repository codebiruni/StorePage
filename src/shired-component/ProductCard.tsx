/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import AddCart from "./add-cart";
import AddWishlist from "./add-wishlist";
import Image from "next/image";
import { Button } from "@/components/ui/button";


import { resolveProductImage } from "@/lib/productImage";

export default function ProductCard({ product }: { product: any }) {
  const router = useRouter();

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

  return (
    <Card className="relative group flex flex-col justify-between cursor-pointer p-0 overflow-hidden border rounded-xl shadow-md hover:shadow-lg transition-all">
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <AddWishlist product={compaireData} />
        <AddCart product={compaireData} />
      </div>

      {/* Product Image */}
      <div
        onClick={() => router.push(`/product/product-details/${product?._id}`)}
        className="relative w-full aspect-square overflow-hidden"
      >
        <Image
          width={300}
          height={300}
          src={firstImage}
          alt={product?.name || "Product image"}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover rounded-t-xl transition-opacity duration-500 group-hover:opacity-0"
        />
        <Image
          width={300}
          height={300}
          src={secondImage}
          alt={product?.name || "Product image"}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover rounded-t-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
      </div>

      {/* Product Info */}
      <CardContent
        onClick={() => router.push(`/product/product-details/${product?._id}`)}
        className="px-3 -mt-4"
      >
        <h3 className="text-sm font-medium line-clamp-2">{product?.name || "Unnamed Product"}</h3>
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-primary">
            ৳{currentPrice.toLocaleString()}
          </span>
          {prevPrice ? (
            <span className="text-xs line-through text-gray-400">
              ৳{prevPrice.toLocaleString()}
            </span>
          ) : null}
        </div>
        {discountPercentage > 0 && (
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
            -{discountPercentage}% off
          </span>
        )}
      </CardContent>

      {/* Footer with Button */}
      <CardFooter className="p-3 -mt-4 pt-0">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/product/product-details/${product?._id}`);
          }}
          className="w-full cursor-pointer"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
