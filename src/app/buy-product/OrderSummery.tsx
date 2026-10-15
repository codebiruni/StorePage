"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import Image from "next/image";
import { resolveProductImage } from "@/lib/productImage";

interface PurchaseItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

interface OrderSummaryProps {
  itemsWithQuantity: PurchaseItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

export default function OrderSummary({
  itemsWithQuantity,
  subtotal,
  deliveryCharge,
  discount,
  grandTotal,
  onQuantityChange,
  onRemoveItem,
}: OrderSummaryProps) {
  const totalItemCount = itemsWithQuantity.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="space-y-4">
      <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden bg-card text-card-foreground">
        <CardHeader className="bg-muted/40 py-3.5 px-4 sm:px-6 border-b border-border/60">
          <CardTitle className="flex items-center justify-between text-base sm:text-lg font-bold">
            <span className="flex items-center gap-2 text-foreground">
              <ShoppingCart className="h-5 w-5 text-primary" />
              অর্ডার সারাংশ
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              {totalItemCount} টি আইটেম
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Items list */}
          <div className="space-y-3 divide-y divide-border/60">
            {itemsWithQuantity.map((item: PurchaseItem, index: number) => (
              <div
                key={item.id || index}
                className="pt-3 first:pt-0 flex items-start gap-3.5 group"
              >
                {/* Thumbnail */}
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-border/80 shrink-0 bg-muted/20">
                  <Image
                    src={resolveProductImage(item.image)}
                    alt={item.name}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug">
                    {item.name}
                  </h4>
                  <p className="text-xs font-bold text-primary mt-1">
                    ৳{item.price.toLocaleString()}
                  </p>

                  {/* Quantity & line total */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="inline-flex items-center border border-border rounded-lg bg-background">
                      <button
                        type="button"
                        onClick={() =>
                          onQuantityChange(item.id, Math.max(1, item.quantity - 1))
                        }
                        disabled={item.quantity <= 1}
                        className="h-7 w-7 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer rounded-l-lg"
                      >
                        <Minus className="h-3 w-3 text-foreground" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onQuantityChange(item.id, item.quantity + 1)
                        }
                        className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors cursor-pointer rounded-r-lg"
                      >
                        <Plus className="h-3 w-3 text-foreground" />
                      </button>
                    </div>

                    <span className="text-xs font-bold text-foreground">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveItem(item.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-lg cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Separator className="my-2" />

          {/* Pricing calculation breakdown */}
          <div className="space-y-2.5 bg-muted/30 border border-border/60 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>সাবটোটাল:</span>
              <span className="font-semibold text-foreground">
                ৳{subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>ডেলিভারি চার্জ:</span>
              <span className="font-semibold text-foreground">
                ৳{deliveryCharge}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span>ডিসকাউন্ট:</span>
                <span className="font-semibold text-primary">
                  -৳{discount.toLocaleString()}
                </span>
              </div>
            )}
            <Separator className="my-1.5" />
            <div className="flex justify-between items-center text-base sm:text-lg font-bold text-foreground pt-1">
              <span>সর্বমোট:</span>
              <span className="text-primary font-extrabold text-xl">
                ৳{grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-2 px-1 text-center">
        <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-card border border-border/60">
          <Truck className="h-4 w-4 text-primary shrink-0" />
          <span className="text-[11px] font-medium text-foreground leading-tight">
            সারাদেশে ডেলিভারি
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-card border border-border/60">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span className="text-[11px] font-medium text-foreground leading-tight">
            ১০০% আসল পণ্য
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-card border border-border/60">
          <RotateCcw className="h-4 w-4 text-primary shrink-0" />
          <span className="text-[11px] font-medium text-foreground leading-tight">
            সহজ রিটার্ন
          </span>
        </div>
      </div>
    </div>
  );
}