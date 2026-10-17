/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { toast } from "sonner";
import useContextData from "@/defaults/custom-component/useContextData";

interface CartProduct {
  product: any;
  expiresAt: number;
  quantity: number;
}

export default function AddCart({
  className,
  product,
}: {
  className?: string;
  product: any;
}) {
  const { handleAddCart } = useContextData();

  const handleAddCartData = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!product) return;
    const existing = localStorage.getItem("cartProducts");
    const cartProducts: CartProduct[] = existing ? JSON.parse(existing) : [];
    const now = Date.now();
    const validProducts = cartProducts.filter((item) => item.expiresAt > now);

    const existingProductIndex = validProducts.findIndex(
      (item) => item.product.id === product.id
    );

    if (existingProductIndex !== -1) {
      validProducts[existingProductIndex].quantity += 1;
      toast.success("Product quantity increased in your cart!");
    } else {
      const newProduct: CartProduct = {
        product: product,
        expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        quantity: 1,
      };
      validProducts.push(newProduct);
      toast.success(
        "Product added to cart successfully! This item will expire in 30 days."
      );
    }

    localStorage.setItem("cartProducts", JSON.stringify(validProducts));
    handleAddCart(validProducts);
  };

  return (
    <Button
      type="button"
      onClick={handleAddCartData}
      variant="outline"
      size="icon"
      aria-label="Add to cart"
      className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full cursor-pointer shadow-md bg-white dark:bg-card hover:bg-green-50 dark:hover:bg-green-950/40 hover:text-green-600 transition-colors ${className || ""}`}
    >
      <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </Button>
  );
}
