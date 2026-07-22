/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import ImageParts from "./ImageParts";
import ProductIntroduce from "./ProductIntroduce";
import BasicInfo from "./BasicInfo";
import useContextData from "@/defaults/custom-component/useContextData";

export default function ProductDetailsClient({ product }: { product: any }) {
  const { handlePurchasedData } = useContextData();
  const router = useRouter();

  // Default priceInfo = general price (no variant selected yet).
  const initialPriceInfo: any = {
    currentPrice: product.generalPrice.currentPrice,
    prevPrice: product.generalPrice.prevPrice,
    discountPercentage: product.generalPrice.discountPercentage,
    variantSku: null,
    variantId: null,
    variantStock: product.quentity || 0,
  };
  const [priceInfo, setPriceInfo] = useState<any>(initialPriceInfo);

  // ProductIntroduce pushes its currently-selected variant up here so that
  // "Buy Now" uses the same variant-aware price the cart would see.
  const handleVariantChange = useCallback((payload: { priceInfo: any }) => {
    setPriceInfo(payload.priceInfo);
  }, []);

  // Base shape used by the cart and the buy-now flow. `price` reflects the
  // currently-selected variant (falls back to general price when no variant).
  const compaireData = {
    id: product._id,
    name: product.name,
    image: product.images[0],
    image2: product.images[1] || product.images[0],
    price: priceInfo.currentPrice,
    priceInfo,
  };

  const handleBuyData = () => {
    handlePurchasedData(compaireData);
    router.push("/buy-product");
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-25">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ImageParts images={product.images} />
        <ProductIntroduce
          handleBuyData={handleBuyData}
          infoData={compaireData}
          onVariantChange={handleVariantChange}
          data={{
            quentity: product.quentity,
            offerPercentage: product.offerPercentage,
            generalPrice: product.generalPrice,
            name: product.name,
            priceVariants: product.priceVariants,
            details: product.details,
          }}
        />
      </div>
      <BasicInfo
        data={{
          quickOverview: product.quickOverview,
          offerPercentage: product.offerPercentage,
          tags: product.tags,
          brand: product.brand,
          specifications: product.specifications,
          category: product.category?.name || "Uncategorized",
          subCategory: product.subCategory?.name || "None",
        }}
      />
    </div>
  );
}