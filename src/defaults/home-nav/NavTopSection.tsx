"use client";
import React from "react";
import Link from "next/link";
import { LogIn, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import WishList from "./WishList";
import CartList from "./CartList";
import SearchBar from "./SearchBar";
import BrandLogo from "./BrandLogo";
import { useContextData } from "@/defaults/context/Context";
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider";
import MobileDrawer from "./MobileDrawer";

export default function NavTopSection() {
  const { UserData } = useContextData();
  const { config } = useSiteConfig();
  const brandName = config?.name ?? "My Store";

  return (
    <div className="w-full">
      {/* Main top bar — single row, mobile + desktop share it */}
      <div className="w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container mx-auto flex h-14 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:h-16">
          {/* Mobile: hamburger + brand  |  Desktop: brand only */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="md:hidden">
              <MobileDrawer>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                  className="rounded-full text-foreground hover:bg-muted"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </MobileDrawer>
            </div>

            <BrandLogo
              brandName={brandName}
              logoUrl={config?.logo}
              size={36}
              className="md:!h-10 md:!w-10"
            />
          </div>

          {/* Search (desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
              <SearchBar />
            </div>
          {/* Right actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Mobile search trigger comes from SearchBar (built-in icon) */}
            <div className="md:hidden">
              <SearchBar />
            </div>

            {/* Wishlist */}
            <WishList />

            {/* Cart */}
            <CartList />

            {/* Theme toggle — desktop only to save mobile space */}
            <div className="hidden md:inline-flex">
              <ModeToggle />
            </div>

            {/* Profile / Sign in */}
            {UserData ? (
              <Link
                href={UserData?.role == "user" ? "/profile" : "/dashboard"}
                aria-label="Account"
                className="md:ml-1"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-foreground hover:bg-muted"
                >
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/signin" aria-label="Sign in" className="md:ml-1">
                <Button
                  variant="default"
                  size="sm"
                  className="h-9 rounded-full gap-1.5 px-3 sm:px-4 shadow-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign in</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
