"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
        <div className="border-b border-border">
          <TabsList className="bg-transparent h-auto p-0 gap-6 sm:gap-8 justify-start rounded-none">
            <TabsTrigger
              value="description"
              className="relative pb-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100"
            >
              বিস্তারিত বিবরণ
            </TabsTrigger>
            {validSpecs.length > 0 && (
              <TabsTrigger
                value="specifications"
                className="relative pb-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100"
              >
                স্পেসিফিকেশন ({validSpecs.length})
              </TabsTrigger>
            )}
            <TabsTrigger
              value="delivery"
              className="relative pb-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100"
            >
              ডেলিভারি ও রিটার্ন
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Detailed Description */}
        <TabsContent value="description" className="pt-6 focus-visible:outline-none">
          <div className="max-w-3xl space-y-6">
            <div className="text-foreground/90 leading-relaxed text-sm sm:text-base whitespace-pre-line">
              {details || "কোনো বিবরণ প্রদান করা হয়নি।"}
            </div>

            {tags.length > 0 && (
              <div className="pt-4 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">ট্যাগ:</span>
                {tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5 font-normal">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Specifications */}
        {validSpecs.length > 0 && (
          <TabsContent value="specifications" className="pt-6 focus-visible:outline-none">
            <div className="max-w-2xl divide-y divide-border/60 text-sm">
              {brand && (
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-muted-foreground font-medium">ব্র্যান্ড</span>
                  <span className="font-semibold text-foreground text-right">{brand}</span>
                </div>
              )}
              {category && (
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-muted-foreground font-medium">ক্যাটাগরি</span>
                  <span className="font-semibold text-foreground text-right">{category}</span>
                </div>
              )}
              {subCategory && subCategory !== "None" && (
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-muted-foreground font-medium">সাব-ক্যাটাগরি</span>
                  <span className="font-semibold text-foreground text-right">{subCategory}</span>
                </div>
              )}
              {validSpecs.map((spec, index) => (
                <div key={spec._id || index} className="py-2.5 flex justify-between gap-4">
                  <span className="text-muted-foreground font-medium">{spec.key}</span>
                  <span className="text-foreground text-right font-medium">{spec.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Tab 3: Delivery & Returns */}
        <TabsContent value="delivery" className="pt-6 focus-visible:outline-none">
          <div className="max-w-2xl space-y-4 text-sm text-foreground/85 leading-relaxed">
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">ডেলিভারি তথ্য</h4>
              <p className="text-muted-foreground text-xs sm:text-sm">
                আমরা দ্রুততম সময়ে সারাদেশে হোম ডেলিভারি দিয়ে থাকি। আপনার এলাকার ওপর ভিত্তি করে চেকআউটের সময় ডেলিভারি চার্জ হিসাব করা হবে।
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">পেমেন্ট ও পরিদর্শন</h4>
              <p className="text-muted-foreground text-xs sm:text-sm">
                ক্যাশ অন ডেলিভারিতে পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা রয়েছে।
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">রিটার্ন পলিসি</h4>
              <p className="text-muted-foreground text-xs sm:text-sm">
                পণ্য গ্রহণের সময় কোনো ত্রুটি বা অমিল থাকলে ডেলিভারি ম্যান থাকা অবস্থাতেই আমাদের সাথে যোগাযোগ করতে পারবেন।
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
