"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ArrowLeft, Sparkles, TrendingUp } from "lucide-react";
import { MobileSearchProps } from "@/interface/types";
import SearchResultsContent from "./SearchResultsContent";

const QUICK_SEARCH_TAGS = ["New Arrivals", "Best Seller", "Offers", "Exclusive"];

const MobileSearch: React.FC<MobileSearchProps> = ({
  searchValue,
  onInputChange,
  mobileSearchInputRef,
  isMobileSearchOpen,
  onSearchToggle,
  onCloseMobileSearch,
  searchResults,
  isLoading,
  debouncedSearch,
  onProductClick,
  onCategoryClick,
  onSubCategoryClick,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when mobile search modal is open
  useEffect(() => {
    if (isMobileSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSearchOpen]);

  const handleClear = () => {
    // Create synthetic change event to clear input
    const syntheticEvent = {
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>;
    onInputChange(syntheticEvent);
    mobileSearchInputRef.current?.focus();
  };

  const handleTagClick = (tag: string) => {
    const syntheticEvent = {
      target: { value: tag },
    } as React.ChangeEvent<HTMLInputElement>;
    onInputChange(syntheticEvent);
    mobileSearchInputRef.current?.focus();
  };

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onSearchToggle}
        aria-label="Search products"
        className="h-9 w-9 text-foreground hover:bg-muted"
      >
        <Search className="h-5 w-5" />
      </Button>

      {isMobileSearchOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 bg-background z-[999999] flex flex-col animate-in fade-in duration-200">
            {/* Header Bar with Safe-area padding */}
            <div className="border-b border-border/80 bg-background/95 backdrop-blur px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCloseMobileSearch}
                  aria-label="Close search"
                  className="h-10 w-10 shrink-0 rounded-full"
                >
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </Button>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="search"
                    placeholder="পণ্য বা ক্যাটাগরি খুঁজুন..."
                    className="pl-9 pr-9 h-11 w-full rounded-xl bg-muted/50 border-border text-sm focus-visible:ring-primary focus-visible:bg-background"
                    value={searchValue}
                    onChange={onInputChange}
                    ref={mobileSearchInputRef}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="search"
                  />
                  {searchValue ? (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label="Clear input"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {searchValue.trim() ? (
                <div className="space-y-3">
                  {/* Search status header */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-2">
                    <span className="truncate">
                      {isLoading ? "অনুসন্ধান করা হচ্ছে…" : `"${searchValue}" এর ফলাফল`}
                    </span>
                    {isLoading && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                        Loading
                      </span>
                    )}
                  </div>

                  <SearchResultsContent
                    searchResults={searchResults}
                    isLoading={isLoading}
                    debouncedSearch={debouncedSearch}
                    onProductClick={onProductClick}
                    onCategoryClick={onCategoryClick}
                    onSubCategoryClick={onSubCategoryClick}
                  />
                </div>
              ) : (
                /* Helpful Quick Searches when input is empty */
                <div className="py-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      জনপ্রিয় অনুসন্ধান
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_SEARCH_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagClick(tag)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-muted/60 hover:bg-muted text-foreground border border-border/50 transition-colors flex items-center gap-1 active:scale-95"
                        >
                          <Sparkles className="h-3 w-3 text-primary" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-border/80 p-5 text-center text-muted-foreground space-y-1">
                    <Search className="h-6 w-6 mx-auto mb-1 opacity-40" />
                    <p className="text-xs font-medium text-foreground">দ্রুত পণ্য খুঁজুন</p>
                    <p className="text-[11px]">
                      পণ্যের নাম, ব্র্যান্ড বা ক্যাটাগরি লিখে সহজেই খুঁজুন
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default MobileSearch;