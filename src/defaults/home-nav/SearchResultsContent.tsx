/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Package,
  Folder,
  Tag,
  ArrowRight,
  ShoppingBasket,
  PackageSearch,
  Layers,
  WalletCards,
  Search,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { SearchResultsContentProps } from "@/interface/types";
import { resolveProductImage } from "@/lib/productImage";

const SearchResultsContent: React.FC<SearchResultsContentProps> = ({
  searchResults,
  isLoading,
  debouncedSearch,
  onProductClick,
  onCategoryClick,
  onSubCategoryClick,
}) => {
  // Show animated skeleton state while loading
  if (isLoading) {
    return (
      <div className="space-y-4 py-2 w-full animate-in fade-in-50 duration-200">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <Skeleton className="h-8 w-18 rounded-lg shrink-0" />
          <Skeleton className="h-8 w-24 rounded-lg shrink-0" />
          <Skeleton className="h-8 w-24 rounded-lg shrink-0" />
          <Skeleton className="h-8 w-28 rounded-lg shrink-0" />
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/20"
            >
              <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!searchResults) return null;

  const totalResults =
    searchResults.products.length +
    searchResults.categories.length +
    searchResults.subCategories.length;

  if (totalResults === 0) {
    return (
      <div className="text-center py-10 px-4">
        <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
          <Search className="h-6 w-6 opacity-60" />
        </div>
        <p className="font-semibold text-foreground text-sm">
          No results found
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          We couldn&apos;t find any products, categories or subcategories matching &quot;{debouncedSearch}&quot;
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      {/* Scrollable, touch-friendly tab bar with visible labels and count badges on both mobile & desktop */}
      <div className="overflow-x-auto no-scrollbar pb-2">
        <TabsList className="bg-muted/70 p-1 rounded-xl h-auto inline-flex min-w-full sm:min-w-0 gap-1">
          <TabsTrigger
            value="all"
            className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <WalletCards className="h-3.5 w-3.5 shrink-0" />
            <span>All</span>
            <span className="ml-0.5 text-[10px] font-mono rounded-full bg-muted-foreground/15 px-1.5 py-0.2">
              {totalResults}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="products"
            className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <ShoppingBasket className="h-3.5 w-3.5 shrink-0" />
            <span>Products</span>
            <span className="ml-0.5 text-[10px] font-mono rounded-full bg-muted-foreground/15 px-1.5 py-0.2">
              {searchResults.products.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="categories"
            className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <PackageSearch className="h-3.5 w-3.5 shrink-0" />
            <span>Categories</span>
            <span className="ml-0.5 text-[10px] font-mono rounded-full bg-muted-foreground/15 px-1.5 py-0.2">
              {searchResults.categories.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="subcategories"
            className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span>Sub-categories</span>
            <span className="ml-0.5 text-[10px] font-mono rounded-full bg-muted-foreground/15 px-1.5 py-0.2">
              {searchResults.subCategories.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Tab: All Results */}
      <TabsContent value="all" className="space-y-4 focus-visible:outline-none mt-2">
        {/* Products Section */}
        {searchResults.products.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-1.5 px-1">
              <Package className="h-3.5 w-3.5" />
              Products ({searchResults.products.length})
            </h3>
            <div className="space-y-2">
              {searchResults.products.map((product: any) => (
                <Link
                  key={product._id}
                  href={`/product/product-details/${product._id}`}
                  onClick={() => onProductClick(product._id)}
                  className="block"
                >
                  <Card
                    className="cursor-pointer hover:bg-muted/50 rounded-xl border border-border/70 transition-all active:scale-[0.99] p-0 overflow-hidden"
                  >
                  <CardContent className="flex p-2.5 items-center gap-3">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40">
                      <Image
                        src={resolveProductImage(product.images)}
                        alt={product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs sm:text-sm text-foreground truncate">
                        {product.name}
                      </h4>
                      {product.brand && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {product.brand}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-xs sm:text-sm text-primary font-mono">
                          ৳{product.generalPrice?.currentPrice?.toLocaleString?.() ?? product.generalPrice?.currentPrice}
                        </span>
                        {product.generalPrice?.discountPercentage > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded font-normal">
                            {product.generalPrice.discountPercentage}% off
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
              ))}
            </div>
          </div>
        )}

        {/* Categories Section */}
        {searchResults.categories.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-1.5 px-1 pt-2">
              <Folder className="h-3.5 w-3.5" />
              Categories ({searchResults.categories.length})
            </h3>
            <div className="space-y-2">
              {searchResults.categories.map((category: any) => {
                const categoryImg = resolveProductImage(category.image, "");
                return (
                  <Card
                    key={category._id}
                    className="cursor-pointer hover:bg-muted/50 rounded-xl border border-border/70 transition-all active:scale-[0.99] p-0 overflow-hidden"
                    onClick={() => onCategoryClick(category._id)}
                  >
                    <CardContent className="p-2.5 flex items-center gap-3">
                      <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40 flex items-center justify-center">
                        {categoryImg ? (
                          <Image
                            src={categoryImg}
                            alt={category.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <Folder className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs sm:text-sm text-foreground truncate">
                          {category.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">Category</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Sub Categories Section */}
        {searchResults.subCategories.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-1.5 px-1 pt-2">
              <Tag className="h-3.5 w-3.5" />
              Sub Categories ({searchResults.subCategories.length})
            </h3>
            <div className="space-y-2">
              {searchResults.subCategories.map((subCategory: any) => (
                <Card
                  key={subCategory._id}
                  className="cursor-pointer hover:bg-muted/50 rounded-xl border border-border/70 transition-all active:scale-[0.99] p-0 overflow-hidden"
                  onClick={() => onSubCategoryClick(subCategory._id)}
                >
                  <CardContent className="p-2.5 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary shrink-0 flex items-center justify-center">
                      <Tag className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs sm:text-sm text-foreground truncate">
                        {subCategory.name}
                      </h4>
                      {subCategory.category?.name ? (
                        <p className="text-[11px] text-muted-foreground truncate">
                          in {subCategory.category.name}
                        </p>
                      ) : null}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </TabsContent>

      {/* Tab: Products Only */}
      <TabsContent value="products" className="space-y-2 focus-visible:outline-none mt-2">
        {searchResults.products.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">No products found</p>
        ) : (
          searchResults.products.map((product: any) => (
            <Link
              key={product._id}
              href={`/product/product-details/${product._id}`}
              onClick={() => onProductClick(product._id)}
              className="block"
            >
              <Card
                className="cursor-pointer hover:bg-muted/50 rounded-xl border border-border/70 transition-all active:scale-[0.99] p-0 overflow-hidden"
              >
                <CardContent className="p-2.5 flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40">
                    <Image
                      src={resolveProductImage(product.images)}
                      alt={product.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-xs sm:text-sm text-foreground truncate">
                      {product.name}
                    </h4>
                    {product.brand && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {product.brand}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-xs sm:text-sm text-primary font-mono">
                        ৳{product.generalPrice?.currentPrice?.toLocaleString?.() ?? product.generalPrice?.currentPrice}
                      </span>
                      {product.generalPrice?.discountPercentage > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded font-normal">
                          {product.generalPrice.discountPercentage}% off
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </TabsContent>

      {/* Tab: Categories Only */}
      <TabsContent value="categories" className="space-y-2 focus-visible:outline-none mt-2">
        {searchResults.categories.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">No categories found</p>
        ) : (
          searchResults.categories.map((category: any) => {
            const categoryImg = resolveProductImage(category.image, "");
            return (
              <Card
                key={category._id}
                className="cursor-pointer hover:bg-muted/50 rounded-xl border border-border/70 transition-all active:scale-[0.99] p-0 overflow-hidden"
                onClick={() => onCategoryClick(category._id)}
              >
                <CardContent className="p-2.5 flex items-center gap-3">
                  <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40 flex items-center justify-center">
                    {categoryImg ? (
                      <Image
                        src={categoryImg}
                        alt={category.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <Folder className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-xs sm:text-sm text-foreground truncate">
                      {category.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">Category</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })
        )}
      </TabsContent>

      {/* Tab: Sub Categories Only */}
      <TabsContent value="subcategories" className="space-y-2 focus-visible:outline-none mt-2">
        {searchResults.subCategories.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">No sub-categories found</p>
        ) : (
          searchResults.subCategories.map((subCategory: any) => (
            <Card
              key={subCategory._id}
              className="cursor-pointer hover:bg-muted/50 rounded-xl border border-border/70 transition-all active:scale-[0.99] p-0 overflow-hidden"
              onClick={() => onSubCategoryClick(subCategory._id)}
            >
              <CardContent className="p-2.5 flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary shrink-0 flex items-center justify-center">
                  <Tag className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs sm:text-sm text-foreground truncate">
                    {subCategory.name}
                  </h4>
                  {subCategory.category?.name ? (
                    <p className="text-[11px] text-muted-foreground truncate">
                      in {subCategory.category.name}
                    </p>
                  ) : null}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
};

export default SearchResultsContent;