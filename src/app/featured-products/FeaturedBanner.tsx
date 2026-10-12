import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, Zap, Star } from "lucide-react";
import Link from "next/link";

export default function FeaturedBanner() {
  return (
    <div className="container mx-auto  p-4">
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 dark:bg-primary/20"></div>
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 dark:bg-primary/10"></div>

        {/* Animated elements */}
        <Sparkles className="absolute top-6 right-20 h-6 w-6 animate-pulse text-primary/60" />
        <Zap className="absolute bottom-10 left-24 h-5 w-5 animate-ping text-primary/40" />
        <Star className="absolute top-1/2 right-1/4 h-4 w-4 animate-bounce text-primary/50 delay-300" />

        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer"></div>

        {/* Content */}
        <CardContent className="relative z-10 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Best Featured Collection
              <span className="block text-primary">
                Store to Your Doorstep!
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-muted-foreground">
                Discover exclusive products with exceptional quality and style
                for every occasion.
              </p>
              <div className="h-1 w-8 rounded-full bg-primary/30"></div>
              <div className="flex gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  New Arrivals
                </span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Limited Stock
                </span>
              </div>
            </div>
          </div>
          <Link href={"/products"}>
            <Button
              className="group bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-md transition-all"
              size="lg"
            >
              Explore more Collection
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
