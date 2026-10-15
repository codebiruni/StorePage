"use client";

import React, { useEffect, useState } from "react";
import ProductCard from "@/shired-component/ProductCard";
import { Button } from "@/components/ui/button";
import { Package, ChevronDown, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  _id: string;
  name: string;
  generalPrice: {
    currentPrice: number;
    prevPrice: number;
    discountPercentage: number;
  };
  images: string[];
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [limit, setLimit] = useState(24);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async (currentLimit: number, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const res = await fetch(`/api/v1/home/product?limit=${currentLimit}`, {
        method: "GET",
      });
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.products)) {
        setProducts(data.products);
        if (data.products.length < currentLimit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProducts(24, true);
  }, []);

  const handleLoadMore = () => {
    const nextLimit = limit + 18;
    setLimit(nextLimit);
    fetchProducts(nextLimit, false);
  };

  const ProductSkeleton = () => (
    <Card className="h-full p-0 overflow-hidden border border-border/80 rounded-xl">
      <Skeleton className="h-44 sm:h-52 w-full rounded-t-xl" />
      <CardContent className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full mt-2 rounded-lg" />
      </CardContent>
    </Card>
  );

  return (
    <section className="w-full py-8">
      {/* Header */}
      <div className="container mx-auto flex justify-between items-center px-4 mb-6">
        <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
          <Package className="w-5 h-5 text-primary" />
          <span>আমাদের সকল পণ্য</span>
          {products.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground ml-1">
              ({products.length} টি পণ্য প্রদর্শিত)
            </span>
          )}
        </div>
        <Link
          href="/products"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          সবগুলো দেখুন <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 px-4">
        {loading ? (
          Array.from({ length: 12 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))
        ) : products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground py-12">
            বর্তমানে কোনো পণ্য পাওয়া যায়নি।
          </p>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8 px-4">
        {hasMore && products.length >= 24 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="cursor-pointer h-10 px-6 font-semibold border-border hover:bg-accent rounded-xl shadow-2xs flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                লোড হচ্ছে...
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                আরও পণ্য দেখুন
              </>
            )}
          </Button>
        )}

        <Link href="/products">
          <Button
            variant="default"
            className="cursor-pointer h-10 px-6 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-xs flex items-center gap-2"
          >
            সকল ক্যাটাগরির পণ্য
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
