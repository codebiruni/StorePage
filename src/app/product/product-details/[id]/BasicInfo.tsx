"use client";

import React, { useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, SlidersHorizontal, Truck, ShieldCheck, CreditCard, ChevronRight } from "lucide-react";

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

  const tabsScrollRef = useRef<HTMLDivElement>(null);

  const handleTabClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  return (
    <div className="w-full mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-border">
      <Tabs defaultValue="description" className="w-full">
        {/* Responsive, horizontally slideable Tab Navigation Bar */}
        <div className="relative border-b border-border/80">
          <div
            ref={tabsScrollRef}
            className="overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            <TabsList className="bg-transparent h-auto p-0 gap-2 sm:gap-6 justify-start rounded-none inline-flex min-w-max">
              <TabsTrigger
                value="description"
                onClick={handleTabClick}
                className="relative pb-3.5 pt-1 px-3 text-xs sm:text-sm font-semibold text-muted-foreground transition-all hover:text-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100 flex items-center gap-1.5 shrink-0"
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>বিস্তারিত বিবরণ</span>
              </TabsTrigger>

              {validSpecs.length > 0 && (
                <TabsTrigger
                  value="specifications"
                  onClick={handleTabClick}
                  className="relative pb-3.5 pt-1 px-3 text-xs sm:text-sm font-semibold text-muted-foreground transition-all hover:text-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100 flex items-center gap-1.5 shrink-0"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>স্পেসিফিকেশন</span>
                  <span className="ml-1 text-[11px] font-mono rounded-full bg-muted px-1.5 py-0.2 text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    {validSpecs.length}
                  </span>
                </TabsTrigger>
              )}

              <TabsTrigger
                value="delivery"
                onClick={handleTabClick}
                className="relative pb-3.5 pt-1 px-3 text-xs sm:text-sm font-semibold text-muted-foreground transition-all hover:text-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100 flex items-center gap-1.5 shrink-0"
              >
                <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>ডেলিভারি ও রিটার্ন</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Tab 1: Detailed Description */}
        <TabsContent value="description" className="pt-6 sm:pt-8 focus-visible:outline-none">
          <div className="max-w-3xl space-y-6">
            <div className="text-foreground/90 leading-relaxed text-sm sm:text-base whitespace-pre-line break-words">
              {details || "কোনো বিবরণ প্রদান করা হয়নি।"}
            </div>

            {tags.length > 0 && (
              <div className="pt-4 flex flex-wrap items-center gap-1.5 border-t border-border/50">
                <span className="text-xs text-muted-foreground mr-1 font-medium">ট্যাগ:</span>
                {tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs px-2.5 py-0.5 font-normal rounded-md">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Specifications (Fully responsive table) */}
        {validSpecs.length > 0 && (
          <TabsContent value="specifications" className="pt-6 sm:pt-8 focus-visible:outline-none">
            <div className="max-w-3xl rounded-xl border border-border/70 overflow-hidden divide-y divide-border/60 bg-card shadow-2xs">
              {brand && (
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 hover:bg-muted/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium sm:min-w-[140px]">
                    ব্র্যান্ড
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-foreground break-words sm:text-right">
                    {brand}
                  </span>
                </div>
              )}

              {category && (
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 hover:bg-muted/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium sm:min-w-[140px]">
                    ক্যাটাগরি
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-foreground break-words sm:text-right">
                    {category}
                  </span>
                </div>
              )}

              {subCategory && subCategory !== "None" && (
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 hover:bg-muted/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium sm:min-w-[140px]">
                    সাব-ক্যাটাগরি
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-foreground break-words sm:text-right">
                    {subCategory}
                  </span>
                </div>
              )}

              {validSpecs.map((spec, index) => (
                <div
                  key={spec._id || index}
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 hover:bg-muted/20 transition-colors"
                >
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium sm:min-w-[140px]">
                    {spec.key}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-foreground break-words sm:text-right">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Tab 3: Delivery & Returns */}
        <TabsContent value="delivery" className="pt-6 sm:pt-8 focus-visible:outline-none">
          <div className="max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border/70 bg-card space-y-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Truck className="h-4 w-4" />
              </div>
              <h4 className="font-semibold text-foreground text-sm">দ্রুত ডেলিভারি</h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                আমরা দ্রুততম সময়ে সারাদেশে হোম ডেলিভারি দিয়ে থাকি। আপনার এলাকার ওপর ভিত্তি করে চেকআউটের সময় ডেলিভারি চার্জ নির্ধারণ হবে।
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-card space-y-2">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
              <h4 className="font-semibold text-foreground text-sm">ক্যাশ অন ডেলিভারি</h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা রয়েছে। পণ্য ডেলিভারির পর নিশ্চিন্তে পেমেন্ট করুন।
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-card space-y-2">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h4 className="font-semibold text-foreground text-sm">রিটার্ন ও রিপ্লেসমেন্ট</h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                পণ্য গ্রহণের সময় কোনো ত্রুটি বা অমিল থাকলে ডেলিভারি ম্যান থাকা অবস্থাতেই সাথে সাথে আমাদের জানান।
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
