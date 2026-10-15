/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import React from "react";
import { resolveProductImage } from "@/lib/productImage";

export default function ListProductCard({ product }: { product: any }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-3">
        <div className="relative w-16 h-16 flex-shrink-0">
          <Image
            src={resolveProductImage(product)}
            alt={product?.name ?? "Product"}
            fill
            sizes="64px"
            className="object-cover rounded-md"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
          <p className="text-primary font-semibold mt-1">
            ৳{(product.price ?? 0).toLocaleString()}
            {product.quantity && product.quantity > 1 ? (
              <span className="text-xs text-muted-foreground ml-1.5 font-normal">
                × {product.quantity}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}
