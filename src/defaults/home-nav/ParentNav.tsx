"use client";
import React, { useState, useEffect } from "react";
import NavTopSection from "./NavTopSection";
import BigScreenNav from "./BigScreenNav";
import { useContextData } from "@/defaults/context/Context";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  id: string;
  children: { name: string; id: string }[];
}

export default function ParentNav() {
  const { navItems, loading, error } = useContextData();
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const pathname = usePathname();

  // Reset scroll state on navigation
  useEffect(() => {
    setIsScrolledDown(false);
  }, [pathname]);

  // Scroll listener: detects scroll direction with RAF throttling
  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = Math.max(0, window.scrollY);
          const diff = currentScrollY - lastScrollY;

          // Never hide if search input or anything in the top nav is focused
          const activeEl = document.activeElement;
          const isTopNavFocused =
            activeEl &&
            activeEl.closest &&
            activeEl.closest("#nav-top-section");

          if (isTopNavFocused) {
            setIsScrolledDown(false);
          } else if (currentScrollY <= 20) {
            // Near top of page: always show everything
            setIsScrolledDown(false);
          } else if (diff > 8 && currentScrollY > 64) {
            // Scrolling down past top bar: hide logo & search, keep menu bar stuck
            setIsScrolledDown(true);
          } else if (diff < -8) {
            // Scrolling up: smoothly bring everything back
            setIsScrolledDown(false);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mirror ParentFooter's suppression: the public /step/[id] landing pages
  // are full-bleed funnels and must not show site chrome (top nav, promo
  // strip, search bar, etc.). Render nothing when we're inside that route
  // tree so the funnel owns the entire viewport.
  // Hooks must be called unconditionally before any early return.
  if (pathname?.startsWith("/step")) return null;

  const navContainerClass = cn(
    "fixed top-0 left-0 right-0 z-[498] flex w-full flex-col bg-background/95 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-transform duration-300 ease-in-out will-change-transform",
    isScrolledDown
      ? "-translate-y-14 md:-translate-y-16"
      : "translate-y-0"
  );

  if (loading) {
    return (
      <div className={navContainerClass}>
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
      <div className={navContainerClass}>
        <NavTopSection />
        <div className="container mx-auto px-2 py-4 text-center text-destructive">
          Failed to load navigation: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={navContainerClass}>
      <NavTopSection />
      <div className="hidden w-full border-b border-border/60 md:block">
        <BigScreenNav navItems={navItems as unknown as NavItem[]} />
      </div>
    </div>
  );
}
