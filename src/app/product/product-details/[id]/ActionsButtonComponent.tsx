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
  Truck,
  Banknote,
  ShieldCheck,
  RotateCcw,
  Headphones,
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
    <div className="space-y-5">
      {/* Quantity & Stock Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">পরিমাণ (Quantity):</span>
          {stock > 0 && stock <= 10 && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              মাত্র {stock} টি বাকি আছে!
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 shadow-xs">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={decrementQuantity}
              disabled={quantity <= 1 || outOfStock}
              className="h-9 w-9 rounded-lg hover:bg-muted"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-sm font-bold text-foreground">
              {quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={incrementQuantity}
              disabled={outOfStock || (stock > 0 && quantity >= stock)}
              className="h-9 w-9 rounded-lg hover:bg-muted"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">
            {outOfStock ? "স্টক শেষ" : `স্টক: ${stock} টি`}
          </span>
        </div>
      </div>

      {/* Primary Action CTAs */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* High-Converting 1-Click Order Button */}
          <Button
            type="button"
            size="lg"
            onClick={guardedBuyNow}
            disabled={outOfStock}
            className="sm:col-span-7 h-13 text-base font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99] bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 rounded-xl cursor-pointer"
          >
            <Zap className="h-5 w-5 fill-current" />
            {outOfStock ? "স্টক শেষ" : "অর্ডার করুন (ক্যাশ অন ডেলিভারি)"}
          </Button>

          {/* Add to Cart Button */}
          <Button
            type="button"
            size="lg"
            variant={isInCart ? "secondary" : "outline"}
            onClick={handleAddCartData}
            disabled={outOfStock}
            className="sm:col-span-4 h-13 text-sm font-semibold rounded-xl border-border hover:bg-accent transition-colors flex items-center justify-center gap-2"
          >
            {isInCart ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                কার্টে যুক্ত আছে
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                কার্টে যোগ করুন
              </>
            )}
          </Button>

          {/* Wishlist Button */}
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleAddWishlistData}
            className="sm:col-span-1 h-13 w-full rounded-xl border-border hover:bg-accent transition-colors"
            title={isInWishlist ? "উইশলিস্টে আছে" : "উইশলিস্টে যোগ করুন"}
            aria-label="Wishlist"
          >
            <Heart
              className={`h-5 w-5 ${
                isInWishlist
                  ? "fill-rose-500 text-rose-500"
                  : "text-muted-foreground"
              }`}
            />
          </Button>
        </div>
      </div>

      {/* 4 Pillars Trust Reassurance Cards (Strictly SVG icons, NO EMOJIS!) */}
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 p-2.5 transition-colors">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Truck className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">হোম ডেলিভারি</p>
            <p className="text-[11px] text-muted-foreground truncate">সারাদেশে দ্রুত পৌঁছে দেওয়া হয়</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 p-2.5 transition-colors">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Banknote className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">ক্যাশ অন ডেলিভারি</p>
            <p className="text-[11px] text-muted-foreground truncate">পণ্য দেখে মূল্য পরিশোধ</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 p-2.5 transition-colors">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">১০০% আসল পণ্য</p>
            <p className="text-[11px] text-muted-foreground truncate">সরাসরি অথেনটিক কোয়ালিটি</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 p-2.5 transition-colors">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <RotateCcw className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">সহজ রিটার্ন</p>
            <p className="text-[11px] text-muted-foreground truncate">কোনো সমস্যায় দ্রুত সমাধান</p>
          </div>
        </div>
      </div>

      {/* Support hotline assistance */}
      <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Headphones className="h-4 w-4 text-primary" />
          <span>অর্ডার করতে সমস্যা হলে বা তথ্যের জন্য কল করুন:</span>
        </div>
        <span className="font-bold text-primary font-mono">+8801700-000000</span>
      </div>
    </div>
  );
}
