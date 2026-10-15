"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  FileText,
  Banknote,
  Sparkles,
} from "lucide-react";

interface OrderFormData {
  name: string;
  number: string;
  district: string;
  upazilla: string;
  union: string; // Village / Ward / Area Address
  note: string;
  paymentMethod: "cash-on-delivery";
}

interface ShippingFormProps {
  formData: OrderFormData;
  onInputChange: (field: keyof OrderFormData, value: string) => void;
  deliveryCharge: number;
  grandTotal: number;
  loading: boolean;
  onSubmitOrder: () => void;
  isFormValid: boolean;
  insideCharge?: number;
  outsideCharge?: number;
}

const INSIDE_DISTRICT = "ঢাকা";
const INSIDE_UPAZILLA = "ঢাকা";
const OUTSIDE_DISTRICT = "বাহিরে";
const OUTSIDE_UPAZILLA = "বাহিরে";

export default function ShippingForm({
  formData,
  onInputChange,
  deliveryCharge,
  grandTotal,
  loading,
  onSubmitOrder,
  isFormValid,
  insideCharge = 70,
  outsideCharge = 90,
}: ShippingFormProps) {
  const isInsideDhaka = /dhaka|ঢাকা/i.test(formData.district);
  const hasSelectedZone = formData.district !== "";

  const selectOutside = () => {
    onInputChange("district", OUTSIDE_DISTRICT);
    onInputChange("upazilla", OUTSIDE_UPAZILLA);
  };

  const selectInside = () => {
    onInputChange("district", INSIDE_DISTRICT);
    onInputChange("upazilla", INSIDE_UPAZILLA);
  };

  return (
    <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden bg-card text-card-foreground">
      <CardHeader className="bg-muted/40 py-3.5 px-4 sm:px-6 border-b border-border/60">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-foreground">
          <MapPin className="h-5 w-5 text-primary" />
          ডেলিভারি ঠিকানা ও তথ্য
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
            <User className="w-4 h-4 text-muted-foreground" />
            আপনার নাম <span className="text-destructive">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => onInputChange("name", e.target.value)}
            placeholder="আপনার পূর্ণ নাম লিখুন"
            required
            className="h-11 text-sm bg-background"
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-muted-foreground" />
            মোবাইল নাম্বার <span className="text-destructive">*</span>
          </label>
          <Input
            type="tel"
            value={formData.number}
            onChange={(e) => onInputChange("number", e.target.value)}
            placeholder="01XXXXXXXXX"
            pattern="01[3-9]\d{8}"
            required
            className="h-11 text-sm bg-background"
          />
          <p className="text-[11px] text-muted-foreground">
            ১১ ডিজিটের সঠিক মোবাইল নাম্বার দিন (যেমন: 01712345678)
          </p>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            পূর্ণ ঠিকানা (জেলা, থানা, গ্রাম/এলাকা) <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={formData.union}
            onChange={(e) => onInputChange("union", e.target.value)}
            placeholder="বাসা নং, রোড নং, এলাকা, থানা এবং জেলা লিখুন..."
            required
            rows={2}
            className="text-sm resize-none bg-background"
          />
        </div>

        {/* Order Note */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-muted-foreground" />
            অর্ডার নোট (ঐচ্ছিক)
          </label>
          <Input
            value={formData.note}
            onChange={(e) => onInputChange("note", e.target.value)}
            placeholder="বিশেষ কোনো নির্দেশনা থাকলে লিখুন..."
            className="h-10 text-xs sm:text-sm bg-background"
          />
        </div>

        {/* Shipping Zone Selector */}
        <div className="space-y-2 pt-1">
          <label className="text-xs sm:text-sm font-semibold text-foreground flex items-center justify-between">
            <span>ডেলিভারি লোকেশন সিলেক্ট করুন:</span>
            <span className="text-xs font-normal text-muted-foreground">
              ডেলিভারি চার্জ: ৳{deliveryCharge}
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Outside Dhaka */}
            <label
              onClick={selectOutside}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                hasSelectedZone && !isInsideDhaka
                  ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-xs"
                  : "border-border/80 bg-background hover:bg-muted/40 text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="shippingZone"
                  checked={hasSelectedZone && !isInsideDhaka}
                  onChange={selectOutside}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-medium">ঢাকার বাহিরে</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-primary">
                ৳{outsideCharge}
              </span>
            </label>

            {/* Inside Dhaka */}
            <label
              onClick={selectInside}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                hasSelectedZone && isInsideDhaka
                  ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-xs"
                  : "border-border/80 bg-background hover:bg-muted/40 text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="shippingZone"
                  checked={hasSelectedZone && isInsideDhaka}
                  onChange={selectInside}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-medium">ঢাকার ভিতরে</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-primary">
                ৳{insideCharge}
              </span>
            </label>
          </div>
        </div>

        {/* Payment Method Badge */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/60">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-foreground">
              ক্যাশ অন ডেলিভারি (Cash on Delivery)
            </p>
            <p className="text-[11px] text-muted-foreground">
              পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করতে পারবেন।
            </p>
          </div>
        </div>

        {/* Submit Order Button */}
        <Button
          onClick={onSubmitOrder}
          disabled={loading || !isFormValid}
          className="w-full h-12 text-sm sm:text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              অর্ডার প্রক্রিয়া হচ্ছে...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              অর্ডার কনফার্ম করুন — ৳{grandTotal.toLocaleString()}
            </>
          )}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 pt-0.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          অর্ডার প্লেস করার পর ১ ঘন্টার মধ্যে ফোনে কনফার্মেশন পাবেন।
        </p>
      </CardContent>
    </Card>
  );
}