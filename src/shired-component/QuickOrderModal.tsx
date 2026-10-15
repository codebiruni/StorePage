"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Minus, Zap, CheckCircle2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider";
import { useOrderDraft } from "@/hooks/useOrderDraft";
import { resolveProductImage } from "@/lib/productImage";

interface QuickOrderModalProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickOrderModal({
  product,
  open,
  onOpenChange,
}: QuickOrderModalProps) {
  const router = useRouter();
  const { config: siteConfig } = useSiteConfig();

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  // Delivery configuration
  const insideCharge = siteConfig?.deliveryCharge?.insideDhaka ?? 70;
  const outsideCharge = siteConfig?.deliveryCharge?.outsideDhaka ?? 90;
  const [shippingZone, setShippingZone] = useState<"outside" | "inside">("outside");
  const deliveryCharge = shippingZone === "inside" ? insideCharge : outsideCharge;

  // Variants handling
  const variants = useMemo(
    () =>
      (product?.priceVariants || []).filter(
        (v: any) => v && (v.sku || v.regularPrice || v.salePrice)
      ),
    [product?.priceVariants]
  );

  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(
    variants.length > 0 ? 0 : null
  );

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setQuantity(1);
      if (variants.length > 0) {
        setSelectedVariantIndex(0);
      }
    }
  }, [open, variants.length]);

  const currentVariant =
    selectedVariantIndex !== null ? variants[selectedVariantIndex] : null;

  const unitPrice = currentVariant
    ? currentVariant.salePrice || currentVariant.regularPrice
    : product?.generalPrice?.currentPrice ?? 0;

  const originalPrice = currentVariant
    ? currentVariant.regularPrice
    : product?.generalPrice?.prevPrice;

  const stock = currentVariant
    ? currentVariant.quentity ?? 99
    : product?.quentity ?? 99;

  const subtotal = unitPrice * quantity;
  const grandTotal = subtotal + deliveryCharge;

  const firstImage =
    Array.isArray(product?.images) && product.images.length > 0
      ? resolveProductImage(product.images)
      : resolveProductImage(product?.images?.[0] || product?.image);

  // Lead recovery with useOrderDraft
  const { draftId, saveDraft } = useOrderDraft({ source: "buy-product" });
  useEffect(() => {
    if (!open) return;
    if (!name && !number && !address) return;
    const zoneLabel = shippingZone === "inside" ? "ঢাকার ভিতরে" : "ঢাকার বাহিরে";
    saveDraft({
      productIds: Array.from({ length: quantity }, () => product._id),
      name,
      number,
      address: `${address} (${zoneLabel})`,
      note: note || (currentVariant?.sku ? `Variant: ${currentVariant.sku}` : undefined),
      deliveryCharge,
      totalAmount: subtotal,
      variantSku: currentVariant?.sku,
    });
  }, [
    open,
    name,
    number,
    address,
    shippingZone,
    note,
    deliveryCharge,
    subtotal,
    quantity,
    currentVariant?.sku,
    product?._id,
    saveDraft,
  ]);

  const incrementQuantity = () => {
    if (stock > 0 && quantity < stock) {
      setQuantity((q) => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("আপনার নাম লিখুন");
      return;
    }
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(number.trim())) {
      toast.error("সঠিক ১১ ডিজিটের ফোন নাম্বার দিন (০১XXXXXXXXX)");
      return;
    }
    if (!address.trim()) {
      toast.error("ডেলিভারি ঠিকানা লিখুন");
      return;
    }

    setLoading(true);
    try {
      const zoneLabel = shippingZone === "inside" ? "ঢাকার ভিতরে" : "ঢাকার বাহিরে";
      const fullAddress = `${address.trim()} (${zoneLabel})`;
      const productsArray = Array.from({ length: quantity }, () => product._id);

      const orderData = {
        name: name.trim(),
        number: number.trim(),
        address: fullAddress,
        products: productsArray,
        totalAmount: subtotal,
        deliveryCharge,
        grandTotal,
        paymentMethod: "cash-on-delivery",
        note: note.trim() || (currentVariant?.sku ? `Variant: ${currentVariant.sku}` : undefined),
        source: "quick-order",
        draftId,
      };

      const res = await fetch("/api/v1/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "অর্ডার প্লেস করা সম্ভব হয়নি");
      }

      toast.success("অর্ডার সফলভাবে সম্পন্ন হয়েছে!");
      onOpenChange(false);

      const orderId = json?.data?.orderId || json?.orderId || json?.data?._id;
      const target = orderId
        ? `/step/thanks?orderId=${encodeURIComponent(orderId)}`
        : "/step/thanks";
      router.push(target);
    } catch (err: any) {
      toast.error(err?.message || "অর্ডার সম্পন্ন হতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="text-left pb-2 border-b">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-primary">
            <Zap className="w-5 h-5 fill-primary text-primary" />
            দ্রুত অর্ডার করুন (Cash on Delivery)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            পণ্য হাতে পেয়ে টাকা পরিশোধ করুন। কোনো অগ্রিম পেমেন্ট লাগবে না।
          </DialogDescription>
        </DialogHeader>

        {/* Product mini summary */}
        <div className="flex gap-3 py-2 items-center bg-muted/40 p-3 rounded-xl border">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0 border bg-background">
            <Image
              src={firstImage}
              alt={product?.name || "Product"}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate text-foreground">
              {product?.name}
            </h4>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-bold text-primary">
                ৳{unitPrice.toLocaleString()}
              </span>
              {originalPrice ? (
                <span className="text-xs line-through text-muted-foreground">
                  ৳{originalPrice.toLocaleString()}
                </span>
              ) : null}
            </div>

            {/* Quantity Controls in header */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium text-muted-foreground">পরিমাণ:</span>
              <div className="inline-flex items-center border rounded-md bg-background">
                <button
                  type="button"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="h-7 w-7 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center text-xs font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={incrementQuantity}
                  disabled={stock > 0 && quantity >= stock}
                  className="h-7 w-7 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Variants selector (if any) */}
        {variants.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              ভ্যারিয়েন্ট সিলেক্ট করুন:
            </label>
            <div className="flex flex-wrap gap-2">
              {variants.map((v: any, idx: number) => {
                const isSelected = selectedVariantIndex === idx;
                return (
                  <button
                    key={v._id || idx}
                    type="button"
                    onClick={() => setSelectedVariantIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border bg-background hover:bg-muted text-foreground"
                    }`}
                  >
                    {v.sku || `Option ${idx + 1}`} — ৳{(v.salePrice || v.regularPrice).toLocaleString()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              আপনার নাম <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: মোঃ করিম"
              required
              className="h-10 text-sm"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              মোবাইল নাম্বার <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="01XXXXXXXXX"
              pattern="01[3-9]\d{8}"
              required
              className="h-10 text-sm"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              পূর্ণ ঠিকানা (জেলা, থানা, গ্রাম/এলাকা) <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="আপনার পূর্ণ ডেলিভারি ঠিকানা লিখুন..."
              rows={2}
              required
              className="text-sm resize-none"
            />
          </div>

          {/* Order Note (optional) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              অর্ডার নোট (ঐচ্ছিক)
            </label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="বিশেষ কোনো নির্দেশনা থাকলে লিখুন..."
              className="h-9 text-xs"
            />
          </div>

          {/* Shipping Zone Radio Options */}
          <div className="space-y-1 pt-1">
            <label className="text-xs font-semibold text-foreground">
              ডেলিভারি লোকেশন:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Outside Dhaka */}
              <label
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                  shippingZone === "outside"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="modalShippingZone"
                    checked={shippingZone === "outside"}
                    onChange={() => setShippingZone("outside")}
                    className="accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-medium">ঢাকার বাহিরে</span>
                </div>
                <span className="text-xs font-bold">৳{outsideCharge}</span>
              </label>

              {/* Inside Dhaka */}
              <label
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                  shippingZone === "inside"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="modalShippingZone"
                    checked={shippingZone === "inside"}
                    onChange={() => setShippingZone("inside")}
                    className="accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-medium">ঢাকার ভিতরে</span>
                </div>
                <span className="text-xs font-bold">৳{insideCharge}</span>
              </label>
            </div>
          </div>

          {/* Pricing summary breakdown */}
          <div className="bg-muted/50 p-3 rounded-lg border space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>সাবটোটাল ({quantity} টি পণ্য):</span>
              <span className="font-semibold text-foreground">৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>ডেলিভারি চার্জ:</span>
              <span className="font-semibold text-foreground">৳{deliveryCharge}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border">
              <span>সর্বমোট মূল্য:</span>
              <span className="text-primary text-base font-extrabold">৳{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                অর্ডার প্রক্রিয়া হচ্ছে...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                অর্ডার কনফার্ম করুন — ৳{grandTotal.toLocaleString()}
              </>
            )}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 pt-0.5">
            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            অর্ডার করার পর আমাদের প্রতিনিধি আপনাকে কল করে কনফার্ম করবেন।
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

