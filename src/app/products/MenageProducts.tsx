/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import ProductCard from "@/shired-component/ProductCard";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  RotateCw,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Tag,
} from "lucide-react";

interface Product {
  _id: string;
  name: string;
  images: string[];
  generalPrice: {
    currentPrice: number;
  };
  brand: string;
  tags: string[];
  specifications: any[];
  averageRating: number;
  totalReviewCount: number;
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface Filters {
  searchTerm: string;
  sortBy: string;
  sortOrder: string;
  minPrice: number;
  maxPrice: number;
  brand: string;
}

interface ApiResponse {
  status: string;
  products: Product[];
  pagination: PaginationInfo;
  filters: Filters;
  message: string;
}

export default function MenageProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [filters, setFilters] = useState({
    searchTerm: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    minPrice: "" as string | number,
    maxPrice: "" as string | number,
    brand: "",
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductElementRef = useRef<HTMLDivElement | null>(null);
  const isMounted = useRef(false);

  // Fetch products function - use ref to avoid recreation
  const fetchProducts = useCallback(
    async (
      page: number = 1,
      reset: boolean = false,
      currentFilters = filters
    ) => {
      if (!hasMore && page > 1 && !reset) return;

      try {
        setLoading(true);
        if (reset) {
          setInitialLoading(true);
        }

        const minVal = Number(currentFilters.minPrice) || 0;
        const maxVal =
          currentFilters.maxPrice !== "" && Number(currentFilters.maxPrice) > 0
            ? Number(currentFilters.maxPrice)
            : 9999999999;

        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          search: currentFilters.searchTerm,
          sort: currentFilters.sortBy,
          order: currentFilters.sortOrder,
          minPrice: minVal.toString(),
          maxPrice: maxVal.toString(),
          brand: currentFilters.brand,
        });

        const res = await fetch(`/api/v1/all-products?${params}`, {
          method: "GET",
          credentials: "include",
          
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.status}`);
        }

        const data: ApiResponse = await res.json();

        if (data.status === "success") {
          if (reset) {
            setProducts(data.products);
          } else {
            setProducts((prev) => [...prev, ...data.products]);
          }
          setPagination(data.pagination);
          setHasMore(data.pagination.hasNextPage);
        } else {
          throw new Error(data.message || "Failed to fetch products");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching products");
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [hasMore] // Only include hasMore as dependency
  );

  // Initial load
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      fetchProducts(1, true);
    }
  }, []); // Empty dependency array for initial load only

  // Filter changes - use debounce to prevent too many API calls
  useEffect(() => {
    if (!isMounted.current) return;

    const handler = setTimeout(() => {
      setProducts([]);
      setHasMore(true);
      fetchProducts(1, true, filters);
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [
    filters.searchTerm,
    filters.sortBy,
    filters.sortOrder,
    filters.minPrice,
    filters.maxPrice,
    filters.brand,
  ]); // Only specific filter properties

  // Infinite scroll setup
  useEffect(() => {
    if (loading || !hasMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchProducts((pagination?.currentPage || 0) + 1, false, filters);
      }
    });

    if (lastProductElementRef.current) {
      observer.current.observe(lastProductElementRef.current);
    }

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [loading, hasMore, pagination, fetchProducts]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (combinedKey: string) => {
    switch (combinedKey) {
      case "newest":
        setFilters((prev) => ({ ...prev, sortBy: "createdAt", sortOrder: "desc" }));
        break;
      case "price_asc":
        setFilters((prev) => ({ ...prev, sortBy: "price", sortOrder: "asc" }));
        break;
      case "price_desc":
        setFilters((prev) => ({ ...prev, sortBy: "price", sortOrder: "desc" }));
        break;
      case "name_asc":
        setFilters((prev) => ({ ...prev, sortBy: "name", sortOrder: "asc" }));
        break;
      case "rating_desc":
        setFilters((prev) => ({ ...prev, sortBy: "rating", sortOrder: "desc" }));
        break;
      default:
        setFilters((prev) => ({ ...prev, sortBy: "createdAt", sortOrder: "desc" }));
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      searchTerm: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      minPrice: "",
      maxPrice: "",
      brand: "",
    });
  };

  const isFilterActive = Boolean(
    filters.searchTerm ||
    (filters.minPrice !== "" && Number(filters.minPrice) > 0) ||
    (filters.maxPrice !== "" && Number(filters.maxPrice) > 0) ||
    filters.brand ||
    filters.sortBy !== "createdAt" ||
    filters.sortOrder !== "desc"
  );

  const activeFilterCount = [
    Boolean(filters.searchTerm),
    Boolean(filters.minPrice !== "" && Number(filters.minPrice) > 0),
    Boolean(filters.maxPrice !== "" && Number(filters.maxPrice) > 0),
    Boolean(filters.brand),
  ].filter(Boolean).length;

  const pricePresets = [
    { label: "Under ৳500", min: 0, max: 500 },
    { label: "৳500 - ৳1,500", min: 500, max: 1500 },
    { label: "৳1,500 - ৳5,000", min: 1500, max: 5000 },
    { label: "৳5,000+", min: 5000, max: "" },
  ];

  // Skeleton loader component
  const ProductSkeleton = () => (
    <Card className="h-full p-0 overflow-hidden">
      <Skeleton className="h-48 w-full rounded-t-lg" />
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <Skeleton className="h-6 w-1/3" />
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              All Products
            </h1>
            {pagination?.totalCount !== undefined && (
              <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {pagination.totalCount} Products
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Explore our curated collection of premium quality products
          </p>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="bg-card border border-border/80 rounded-2xl p-3 sm:p-4 shadow-xs mb-8 space-y-3">
        {/* Primary Row: Search, Sort & Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, models, or brands..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className="pl-9.5 pr-8 h-10 rounded-xl bg-muted/40 border-border/70 focus-visible:bg-background text-sm"
            />
            {filters.searchTerm && (
              <button
                type="button"
                onClick={() => handleFilterChange("searchTerm", "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="w-full sm:w-[220px]">
            <Select
              value={
                filters.sortBy === "createdAt" && filters.sortOrder === "desc"
                  ? "newest"
                  : filters.sortBy === "price" && filters.sortOrder === "asc"
                  ? "price_asc"
                  : filters.sortBy === "price" && filters.sortOrder === "desc"
                  ? "price_desc"
                  : filters.sortBy === "name"
                  ? "name_asc"
                  : filters.sortBy === "rating"
                  ? "rating_desc"
                  : "newest"
              }
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/70 text-sm font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent align="end" className="rounded-xl">
                <SelectItem value="newest">Newest Arrivals</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating_desc">Top Rated</SelectItem>
                <SelectItem value="name_asc">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Toggle Button */}
          <Button
            type="button"
            variant={showFilters || activeFilterCount > 0 ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 px-3.5 rounded-xl font-medium text-sm flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-background text-foreground text-[11px] font-bold flex items-center justify-center ml-0.5">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Reset Button (visible when filters are applied) */}
          {isFilterActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-10 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Expandable Filter Details (Price & Brand) */}
        {showFilters && (
          <div className="pt-3 border-t border-border/60 space-y-3.5 animate-in fade-in-50 slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Min & Max Price Inputs */}
              <div className="sm:col-span-7 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <span>Price Range (৳)</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">৳</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="Min (0)"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                      className="pl-7 h-9 rounded-lg bg-muted/30 border-border/70 text-xs sm:text-sm font-mono"
                    />
                  </div>
                  <span className="text-muted-foreground text-xs font-bold">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">৳</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                      className="pl-7 h-9 rounded-lg bg-muted/30 border-border/70 text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Brand Filter */}
              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <span>Brand</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Enter brand name..."
                    value={filters.brand}
                    onChange={(e) => handleFilterChange("brand", e.target.value)}
                    className="pl-8.5 h-9 rounded-lg bg-muted/30 border-border/70 text-xs sm:text-sm"
                  />
                  {filters.brand && (
                    <button
                      type="button"
                      onClick={() => handleFilterChange("brand", "")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Price Range Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-muted-foreground mr-1">Quick Ranges:</span>
              {pricePresets.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      minPrice: preset.min,
                      maxPrice: preset.max,
                    }));
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    Number(filters.minPrice) === preset.min &&
                    (preset.max === "" ? filters.maxPrice === "" : Number(filters.maxPrice) === preset.max)
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "bg-muted/40 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filter Badges */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50 text-xs">
            <span className="text-muted-foreground text-[11px] font-medium">Active Filters:</span>
            {filters.searchTerm && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal text-xs">
                Search: &quot;{filters.searchTerm}&quot;
                <button
                  type="button"
                  onClick={() => handleFilterChange("searchTerm", "")}
                  className="hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(filters.minPrice !== "" && Number(filters.minPrice) > 0) ||
            (filters.maxPrice !== "" && Number(filters.maxPrice) > 0) ? (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal text-xs font-mono">
                ৳{filters.minPrice || 0} - ৳{filters.maxPrice || "∞"}
                <button
                  type="button"
                  onClick={() => {
                    handleFilterChange("minPrice", "");
                    handleFilterChange("maxPrice", "");
                  }}
                  className="hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null}
            {filters.brand && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal text-xs">
                Brand: {filters.brand}
                <button
                  type="button"
                  onClick={() => handleFilterChange("brand", "")}
                  className="hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg mb-8">
          <p>{error}</p>
          <Button
            onClick={() => fetchProducts(1, true, filters)}
            variant="outline"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {initialLoading ? (
          // Show skeleton loaders for initial load
          Array.from({ length: 12 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))
        ) : products.length > 0 ? (
          // Show products
          products.map((product, index) => {
            if (products.length === index + 1) {
              // Last product - attach ref for infinite scroll
              return (
                <div ref={lastProductElementRef} key={product._id}>
                  <ProductCard product={product} />
                </div>
              );
            } else {
              return <ProductCard key={product._id} product={product} />;
            }
          })
        ) : (
          // No products found
          <div className="col-span-full text-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter parameters
            </p>
          </div>
        )}

        {/* Loading more skeletons */}
        {loading &&
          !initialLoading &&
          hasMore &&
          Array.from({ length: 6 }).map((_, index) => (
            <ProductSkeleton key={`skeleton-${index}`} />
          ))}
      </div>

      {/* No more products message */}
      {!hasMore && products.length > 0 && (
        <div className="text-center mt-8 text-muted-foreground">
          You`ve reached the end of the product list
        </div>
      )}
    </div>
  );
}
