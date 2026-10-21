import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailsLoading() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Top Line Loader (Left to Right) */}
      <div className="fixed top-0 left-0 right-0 z-[99999999999] h-[3px] w-full overflow-hidden bg-primary/15">
        <div className="h-full w-full bg-primary animate-top-loader origin-left shadow-[0_0_12px_var(--primary),0_0_6px_var(--primary)]" />
      </div>

      <div className="top-padding container mx-auto px-4 py-6 md:py-10 max-w-7xl animate-in fade-in-50 duration-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Image Skeleton */}
          <div className="space-y-4">
            <Skeleton className="w-full aspect-square rounded-2xl border border-border/40" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-18 w-18 rounded-xl border border-border/40 shrink-0" />
              ))}
            </div>
          </div>

          {/* Right Column: Info & Action Skeletons */}
          <div className="space-y-6">
            {/* Title & Badge */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-8 w-4/5 rounded-lg" />
              <Skeleton className="h-6 w-3/5 rounded-lg" />
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <div className="flex items-baseline gap-3">
                <Skeleton className="h-9 w-32 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>

            {/* Variants Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-24 rounded-md" />
              <div className="flex gap-2.5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-24 rounded-xl border border-border/40" />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            </div>

            {/* Delivery & Assurance Info */}
            <div className="pt-4 border-t border-border/40 space-y-2.5">
              <Skeleton className="h-4 w-2/3 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

