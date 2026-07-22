import React from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Search } from "lucide-react";
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
  // Show the dropdown only after the user has typed something that
  // produced an API call (avoids a flash on every keystroke).
  const trimmed = debouncedSearch.trim();
  const showDropdown = trimmed.length > 0;

  return (
    <Popover open={showDropdown} modal={false}>
      <div className="hidden md:flex relative flex-1 lg:w-xl max-w-xl mx-4">
        <PopoverAnchor asChild>
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Search products, categories, sub-categories..."
              className="pr-10 w-full"
              value={searchValue}
              onChange={onInputChange}
              ref={searchInputRef}
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </PopoverAnchor>
      </div>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[var(--radix-popover-trigger-width)] max-w-xl max-h-[60vh] overflow-hidden p-0 z-[1100]"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
          <p className="truncate text-xs text-muted-foreground">
            Search results for{" "}
            <strong className="font-semibold text-foreground">
              {searchValue}
            </strong>
          </p>
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
            Esc to close
          </span>
        </div>

        <div className="max-h-[calc(60vh-44px)] overflow-y-auto px-3 py-3">
          <SearchResultsContent
            searchResults={searchResults}
            isLoading={isLoading}
            debouncedSearch={debouncedSearch}
            onProductClick={onProductClick}
            onCategoryClick={onCategoryClick}
            onSubCategoryClick={onSubCategoryClick}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DesktopSearch;