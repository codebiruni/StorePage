"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Heart,
  Zap,
  Check,
  Plus,
  Minus,
} from "lucide-react";
import useContextData from "@/defaults/custom-component/useContextData";

interface ActionsButtonComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
  handleBuyData: (selectedQty: number) => void;
}

export default function ActionsButtonComponent({
  product,
  handleBuyData,
}: ActionsButtonComponentProps) {
  const { handleAddCart, handleAddWishlist } = useContextData();
  const [quantity, setQuantity] = useState(1);
  const [isInCart, setIsInCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Resolve the actual stock/price taking the selected variant into account.
  const priceInfo = product?.priceInfo;
  const stock: number = priceInfo
    ? (typeof priceInfo.variantStock === "number" ? priceInfo.variantStock : product?.quentity ?? 0)
    : product?.quentity ?? 0;

  const effectivePrice: number = priceInfo
    ? priceInfo.currentPrice
    : product?.price ?? 0;

  const requiresVariant =
    Array.isArray(product?.priceVariants) && product.priceVariants.length > 0;
  const variantSelected = !requiresVariant || !!priceInfo?.variantId;
  const outOfStock = stock <= 0;

  // Stable key per product+variant, so different SKUs don't merge into one cart line.
  const cartLineId = priceInfo?.variantId
    ? `${product?.id}__${priceInfo.variantId}`
    : product?.id;

  // Check if product is already in cart or wishlist
  useEffect(() => {
    if (product) {
      try {
        const existingCart = localStorage.getItem("cartProducts");
        if (existingCart) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cartProducts = JSON.parse(existingCart);
          const now = Date.now();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const validProducts = cartProducts.filter((item: any) => item.expiresAt > now);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const existsInCart = validProducts.some((item: any) => item.product?.id === product.id);
          setIsInCart(existsInCart);
        }

        const existingWishlist = localStorage.getItem("WishlistProducts");
        if (existingWishlist) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const wishlistProducts = JSON.parse(existingWishlist);
          const now = Date.now();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const validProducts = wishlistProducts.filter((item: any) => item.expiresAt > now);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const existsInWishlist = validProducts.some((item: any) => item.product?.id === product.id);
          setIsInWishlist(existsInWishlist);
        }
      } catch {
        // Ignore localStorage parse errors
      }
    }
  }, [product]);

  const handleAddCartData = () => {
    if (!product) return;

    if (requiresVariant && !variantSelected) {
      toast.error("অনুগ্রহ করে একটি ভ্যারিয়েন্ট বেছে নিন।");
      return;
    }
    if (outOfStock) {
      toast.error("দুঃখিত, এই পণ্যটির স্টক শেষ।");
      return;
    }

    try {
      const existing = localStorage.getItem("cartProducts");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cartProducts: any[] = existing ? JSON.parse(existing) : [];
      const now = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validProducts = cartProducts.filter((item: any) => item.expiresAt > now);

      const storedProduct = {
        ...product,
        price: effectivePrice,
        priceInfo,
        displaySku: priceInfo?.variantSku,
      };

      const existingIndex = validProducts.findIndex(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) =>
          (item.product?.id === product.id &&
            item.product?.priceInfo?.variantId === priceInfo?.variantId) ||
          item.lineId === cartLineId
      );

      if (existingIndex !== -1) {
        const next = (validProducts[existingIndex].quantity || 0) + quantity;
        validProducts[existingIndex].quantity = Math.min(next, stock);
        toast.success("কার্টে পণ্যের সংখ্যা বৃদ্ধি করা হয়েছে!");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newProduct: any = {
          product: storedProduct,
          lineId: cartLineId,
          expiresAt: now + 30 * 24 * 60 * 60 * 1000,
          quantity: Math.min(quantity, stock),
        };
        validProducts.push(newProduct);
        toast.success("পণ্যটি সফলভাবে কার্টে যোগ করা হয়েছে!");
      }

      localStorage.setItem("cartProducts", JSON.stringify(validProducts));
      handleAddCart(validProducts);
      setIsInCart(true);
    } catch (err) {
      console.error(err);
      toast.error("কার্টে পণ্য যোগ করতে সমস্যা হয়েছে।");
    }
  };

  const handleAddWishlistData = () => {
    if (!product) return;

    try {
      const existing = localStorage.getItem("WishlistProducts");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wishlistProducts: any[] = existing ? JSON.parse(existing) : [];
      const now = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validProducts = wishlistProducts.filter((item: any) => item.expiresAt > now);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const alreadyExists = validProducts.some((item: any) => item.product?.id === product.id);

      if (alreadyExists) {
        toast.info("পণ্যটি ইতিমধ্যেই আপনার উইশলিস্টে রয়েছে!");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newProduct: any = {
        product,
        expiresAt: now + 30 * 24 * 60 * 60 * 1000,
      };

      const updated = [...validProducts, newProduct];
      localStorage.setItem("WishlistProducts", JSON.stringify(updated));
      handleAddWishlist(updated);
      setIsInWishlist(true);
      toast.success("পণ্যটি উইশলিস্টে যোগ করা হয়েছে!");
    } catch (err) {
      console.error(err);
      toast.error("উইশলিস্টে যোগ করতে সমস্যা হয়েছে।");
    }
  };

  const incrementQuantity = () => {
    if (stock > 0 && quantity < stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const guardedBuyNow = () => {
    if (requiresVariant && !variantSelected) {
      toast.error("অনুগ্রহ করে একটি ভ্যারিয়েন্ট বেছে নিন।");
      return;
    }
    if (outOfStock) {
      toast.error("দুঃখিত, এই পণ্যটির স্টক শেষ।");
      return;
    }
    handleBuyData(quantity);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Quantity Selector */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">পরিমাণ</span>
        <div className="flex items-center gap-3">
          {stock > 0 && stock <= 10 && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              মাত্র {stock} টি বাকি
            </span>
          )}
          <div className="inline-flex items-center rounded-lg border border-border bg-background">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={decrementQuantity}
              disabled={quantity <= 1 || outOfStock}
              className="h-8 w-8 rounded-l-lg hover:bg-muted"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-10 text-center text-sm font-semibold text-foreground select-none">
              {quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={incrementQuantity}
              disabled={outOfStock || (stock > 0 && quantity >= stock)}
              className="h-8 w-8 rounded-r-lg hover:bg-muted"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Action CTAs */}
      <div className="space-y-2.5 pt-1">
        {/* High-Converting 1-Click Order Button */}
        <Button
          type="button"
          size="lg"
          onClick={guardedBuyNow}
          disabled={outOfStock}
          className="w-full h-12 sm:h-13 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap className="h-4.5 w-4.5 fill-current shrink-0" />
          <span>{outOfStock ? "স্টক শেষ" : "অর্ডার করুন"}</span>
        </Button>

        {/* Secondary Action Row: Add to Cart & Wishlist */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            size="lg"
            variant={isInCart ? "secondary" : "outline"}
            onClick={handleAddCartData}
            disabled={outOfStock}
            className="flex-1 h-11 sm:h-12 text-sm font-semibold rounded-xl border-border hover:bg-muted transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isInCart ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span>কার্টে যুক্ত আছে</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                <span>কার্টে যোগ করুন</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleAddWishlistData}
            className="h-11 sm:h-12 w-11 sm:w-12 shrink-0 rounded-xl border-border hover:bg-muted transition-colors cursor-pointer"
            title={isInWishlist ? "উইশলিস্টে আছে" : "উইশলিস্টে যোগ করুন"}
            aria-label="Wishlist"
          >
            <Heart
              className={`h-4.5 w-4.5 ${
                isInWishlist
                  ? "fill-rose-500 text-rose-500"
                  : "text-muted-foreground"
              }`}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
