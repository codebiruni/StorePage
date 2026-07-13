"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, User, Phone, Truck } from "lucide-react";
import { ModeToggle } from "@/components/theme-toggle";
import WishList from "./WishList";
import CartList from "./CartList";
import SearchBar from "./SearchBar";
import BrandLogo from "./BrandLogo";
import useContextData from "../custom-component/useContextData";
import CpmpaireList from "./CpmpaireList";
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider";

export default function NavTopSection() {
  const { UserData } = useContextData();
  const { config } = useSiteConfig();
  const brandName = config?.name ?? "My Store";

  return (
    <div className="w-full">
      {/* Announcement / utility strip — hides on small screens to save vertical space */}
      {config?.contact?.phone ? (
        <div className="hidden md:block w-full bg-primary/95 text-primary-foreground">
          <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-1.5 text-[12px]">
            <div className="flex items-center gap-5">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                Free shipping over ৳2000
              </span>
              <span className="hidden lg:inline-flex items-center gap-1.5 opacity-90">
                <Phone className="h-3.5 w-3.5" />
                {config.contact.phone}
              </span>
            </div>
            <div className="flex items-center gap-4 opacity-90">
              <span className="hidden lg:inline">Cash on delivery</span>
              <span className="hidden xl:inline">7-day easy returns</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main top bar */}
      <div className="w-full py-3 md:py-3.5 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4">
          {/* Logo + Brand */}
          <BrandLogo brandName={brandName} logoUrl={config?.logo} size={40} />

          {/* Search Bar (desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <SearchBar />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Mobile search trigger */}
            <div className="md:hidden">
              <SearchBar />
            </div>

            {/* Compare */}
            <CpmpaireList />

            {/* Wishlist */}
          <WishList />

            {/* Cart */}
          <CartList />

            {/* Theme toggle */}
          <ModeToggle />

            {/* Profile / Sign in */}
          {UserData ? (
              <Link
                href={UserData?.role == "user" ? "/profile" : "/dashboard"}
                aria-label="Account"
              >
                <Button variant="ghost" size="icon" className="rounded-full">
                <User className="w-5 h-5" />
              </Button>
            </Link>
          ) : (
              <Link href="/signin" aria-label="Sign in">
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full gap-1.5 px-3 sm:px-4 h-9 shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
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
