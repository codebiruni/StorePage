"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Sliders,
  Truck,
  Tag,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  MapPin,
} from "lucide-react";

interface Specification {
  _id?: string;
  key: string;
  value: string;
}

interface BasicInfoProps {
  data: {
    quickOverview?: string[];
    offerPercentage?: number;
    tags?: string[];
    brand?: string;
    specifications?: Specification[];
    category?: string;
    subCategory?: string;
    details?: string;
  };
}

export default function BasicInfo({ data }: BasicInfoProps) {
  const {
    tags = [],
    brand,
    specifications = [],
    category,
    subCategory,
    details = "",
  } = data;

  const validSpecs = specifications.filter(
    (s) => s && s.key && s.value && s.key.trim().length > 0
  );

  return (
    <div className="w-full mt-12 pt-8 border-t border-border">
      <Tabs defaultValue="description" className="w-full">
        <div className="flex justify-start">
          <TabsList className="inline-flex h-12 p-1 bg-muted/60 rounded-xl overflow-x-auto max-w-full">
            <TabsTrigger
              value="description"
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-xs px-3 sm:px-5"
            >
              <FileText className="h-4 w-4" />
              বিস্তারিত বিবরণ
            </TabsTrigger>
            <TabsTrigger
              value="specifications"
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-xs px-3 sm:px-5"
            >
              <Sliders className="h-4 w-4" />
              স্পেসিফিকেশন {validSpecs.length > 0 && `(${validSpecs.length})`}
            </TabsTrigger>
            <TabsTrigger
              value="delivery"
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-xs px-3 sm:px-5"
            >
              <Truck className="h-4 w-4" />
              ডেলিভারি পলিসি
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab 1: Detailed Description ───────────────────────────── */}
        <TabsContent value="description" className="mt-6 focus-visible:outline-none">
          <div className="w-full rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                পণ্যটির বিস্তারিত বিবরণ
              </h2>
              <div className="text-foreground/80 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {details || "কোনো বিবরণ প্রদান করা হয়নি।"}
              </div>
            </div>

            {/* Tags footer */}
            {tags.length > 0 && (
              <div className="pt-6 border-t border-border/60">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> সম্পর্কিত ট্যাগ
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs px-2.5 py-1">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 2: Specifications ─────────────────────────────────── */}
        <TabsContent value="specifications" className="mt-6 focus-visible:outline-none">
          <div className="w-full rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" />
              টেকনিক্যাল স্পেসিফিকেশন
            </h2>

            {/* Meta Attributes (Brand, Category, Subcategory) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30 border border-border/60 text-sm">
              {brand && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground block">ব্র্যান্ড (Brand)</span>
                  <span className="font-bold text-foreground">{brand}</span>
                </div>
              )}
              {category && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground block">ক্যাটাগরি (Category)</span>
                  <span className="font-bold text-foreground">{category}</span>
                </div>
              )}
              {subCategory && subCategory !== "None" && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground block">সাব-ক্যাটাগরি</span>
                  <span className="font-bold text-foreground">{subCategory}</span>
                </div>
              )}
            </div>

            {/* Structured Specifications Table */}
            {validSpecs.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-3 px-4 w-1/3">বৈশিষ্ট্য (Attribute)</th>
                      <th className="py-3 px-4">বিবরণ (Value)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {validSpecs.map((spec, index) => (
                      <tr
                        key={spec._id || index}
                        className={index % 2 === 0 ? "bg-background" : "bg-muted/15"}
                      >
                        <td className="py-3 px-4 font-medium text-foreground">{spec.key}</td>
                        <td className="py-3 px-4 text-muted-foreground">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                এই পণ্যটির জন্য অতিরিক্ত কোনো স্পেসিফিকেশন যুক্ত করা নেই।
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 3: Delivery & Returns Policy ──────────────────────── */}
        <TabsContent value="delivery" className="mt-6 focus-visible:outline-none">
          <div className="w-full rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              ডেলিভারি ও রিটার্ন সংক্রান্ত তথ্য
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Delivery Cost & Time */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <MapPin className="h-4.5 w-4.5" />
                  ডেলিভারি চার্জ ও সময়সীমা
                </div>
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>ঢাকা সিটির ভেতরে:</strong> ৭০৳ (২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>ঢাকা সিটির বাইরে:</strong> ৯০৳ (৪৮ থেকে ৭২ ঘণ্টার মধ্যে ডেলিভারি)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>অর্ডার নিশ্চিত করার পর দ্রুততম সময়ে ডেলিভারি টিম আপনার সাথে যোগাযোগ করবে।</span>
                  </li>
                </ul>
              </div>

              {/* Cash On Delivery & Inspection */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <ShieldCheck className="h-4.5 w-4.5" />
                  ক্যাশ অন ডেলিভারি ও পরিদর্শন
                </div>
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>ডেলিভারি ম্যানের সামনে পণ্য দেখে ও নিশ্চিত হয়ে টাকা পরিশোধ করার সুবিধা রয়েছে।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>কোনো প্রকার অগ্রিম পেমেন্ট ছাড়াই অর্ডার সম্পন্ন করুন।</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Return Policy Banner */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-bold text-amber-900 dark:text-amber-200 block mb-1">
                  সহজ রিটার্ন ও রিপ্লেসমেন্ট পলিসি
                </span>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  পণ্য হাতে পাওয়ার পর যদি কোনো ত্রুটি বা অমিল পান, তাহলে ডেলিভারি ম্যান থাকা অবস্থাতেই আমাদের হেল্পলাইনে কল করুন অথবা সাথে সাথেই রিটার্ন করে দিন। আমরা দ্রুত রিপ্লেসমেন্ট বা সমস্যার সমাধান নিশ্চিত করব।
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
