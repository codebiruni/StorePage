"use client";

import React, { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { DesktopSearchProps } from "@/interface/types";
import SearchResultsContent from "./SearchResultsContent";

const DesktopSearch: React.FC<DesktopSearchProps> = ({
  searchValue,
  onInputChange,
  searchInputRef,
  searchResults,
  isLoading,
  debouncedSearch,
  onProductClick,
  onCategoryClick,
  onSubCategoryClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const trimmed = debouncedSearch.trim();
  const hasQuery = searchValue.trim().length > 0;

  // Open dropdown when user types something
  useEffect(() => {
    if (trimmed.length > 0 || hasQuery) {
      setIsOpen(true);
    }
  }, [trimmed, hasQuery]);

  // Handle click outside and Escape key to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleClear = () => {
    const syntheticEvent = {
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>;
    onInputChange(syntheticEvent);
    setIsOpen(false);
    searchInputRef.current?.focus();
  };

  const showDropdown = isOpen && (hasQuery || trimmed.length > 0);

  return (
    <div
      ref={containerRef}
      className="hidden md:flex relative flex-1 lg:w-xl max-w-xl mx-4"
    >
      <div className="relative w-full">
        <Input
          type="search"
          placeholder="Search products, categories, sub-categories..."
          className="pr-10 pl-4 w-full h-10 rounded-xl bg-muted/40 hover:bg-muted/60 focus-visible:bg-background transition-colors text-sm"
          value={searchValue}
          onChange={(e) => {
            onInputChange(e);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (searchValue.trim().length > 0) setIsOpen(true);
          }}
          ref={searchInputRef}
          autoComplete="off"
          spellCheck={false}
        />
        {searchValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Dropdown positioned directly beneath the search input with z-[99999] */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-2 z-[99999] bg-popover text-popover-foreground rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
          style={{ maxHeight: "calc(75vh - 50px)" }}
        >
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
            <p className="truncate text-xs text-muted-foreground">
              Search results for{" "}
              <strong className="font-semibold text-foreground">
                &quot;{searchValue}&quot;
              </strong>
            </p>
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
              Esc to close
            </span>
          </div>

          <div
            className="overflow-y-auto p-3"
            style={{ maxHeight: "calc(75vh - 95px)" }}
          >
            <SearchResultsContent
              searchResults={searchResults}
              isLoading={isLoading}
              debouncedSearch={debouncedSearch}
              onProductClick={(id) => {
                onProductClick(id);
                setIsOpen(false);
              }}
              onCategoryClick={(id) => {
                onCategoryClick(id);
                setIsOpen(false);
              }}
              onSubCategoryClick={(id) => {
                onSubCategoryClick(id);
                setIsOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopSearch;