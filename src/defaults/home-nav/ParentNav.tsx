"use client";
import React from "react";
import NavTopSection from "./NavTopSection";
import BigScreenNav from "./BigScreenNav";
import { useContextData } from "@/defaults/context/Context";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  id: string;
  children: { name: string; id: string }[];
}

export default function ParentNav() {
  const { navItems, loading, error } = useContextData();

  // Mirror ParentFooter's suppression: the public /step/[id] landing pages
  // are full-bleed funnels and must not show site chrome (top nav, promo
  // strip, search bar, etc.). Render nothing when we're inside that route
  // tree so the funnel owns the entire viewport.
  // Hooks must be called unconditionally before any early return.
  const pathname = usePathname();
  if (pathname?.startsWith("/step")) return null;

  if (loading) {
    return (
      <div className="fixed top-0 z-[498] flex w-full flex-col bg-background/95 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <NavTopSection />
        <div className="container mx-auto px-2 py-4">
          <div className="flex animate-pulse justify-center">
            <div className="h-6 w-32 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed top-0 z-[498] flex w-full flex-col bg-background/95 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <NavTopSection />
        <div className="container mx-auto px-2 py-4 text-center text-destructive">
          Failed to load navigation: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 z-[498] flex w-full flex-col bg-background/95 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <NavTopSection />
      <div className="hidden w-full border-b border-border/60 md:block">
        <BigScreenNav navItems={navItems as unknown as NavItem[]} />
      </div>
    </div>
  );
}
