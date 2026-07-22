"use client";
import React from "react";
import NavTopSection from "./NavTopSection";
import BigScreenNav from "./BigScreenNav";
import { useContextData } from "@/defaults/context/Context";

interface NavItem {
  name: string;
  id: string;
  children: { name: string; id: string }[];
}

export default function ParentNav() {
  const { navItems, loading, error } = useContextData();

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
