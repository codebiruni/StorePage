"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Tag,
  AlertCircle,
  ZoomIn,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolveProductImage } from "@/lib/productImage";

interface ImagePartsProps {
  images: string[];
  discountPercentage?: number;
  inStock?: boolean;
  isFeatured?: boolean;
}

export default function ImageParts({
  images,
  discountPercentage = 0,
  inStock = true,
  isFeatured = false,
}: ImagePartsProps) {
  const safeImages =
    Array.isArray(images) && images.length > 0
      ? images
      : [resolveProductImage([])];

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  // If selected image index is out of bounds due to array change, reset to 0
  useEffect(() => {
    if (selectedImageIndex >= safeImages.length) {
      setSelectedImageIndex(0);
    }
  }, [safeImages.length, selectedImageIndex]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prevIndex) =>
      prevIndex === safeImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prevIndex) =>
      prevIndex === 0 ? safeImages.length - 1 : prevIndex - 1
    );
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  }, []);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 50, y: 50 });
  };

  const currentImageSrc = resolveProductImage(safeImages[selectedImageIndex]);

  return (
    <div className="w-full flex flex-col-reverse md:flex-row gap-4 lg:sticky lg:top-28 self-start">
      {/* Thumbnails Strip */}
      {safeImages.length > 1 && (
        <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[500px] scrollbar-hide py-1 md:py-0 shrink-0">
          {safeImages.map((img, index) => {
            const isSelected = selectedImageIndex === index;
            const src = resolveProductImage(img);
            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                onMouseEnter={() => setSelectedImageIndex(index)}
                className={`relative h-16 w-16 md:h-18 md:w-18 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-muted/40 cursor-pointer ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 shadow-xs scale-102"
                    : "border-border hover:border-muted-foreground/40 opacity-70 hover:opacity-100"
                }`}
                aria-label={`View image ${index + 1}`}
              >
                <Image
                  src={src}
                  alt={`Product thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Image Showcase with Smooth Hover Magnifier */}
      <div className="relative flex-1">
        <Card className="overflow-hidden border border-border/80 shadow-xs rounded-2xl bg-card">
          <CardContent className="p-0">
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="relative aspect-square w-full overflow-hidden select-none cursor-crosshair bg-muted/10"
            >
              {/* Magnified Image Container */}
              <div
                className="relative w-full h-full transition-transform duration-100 ease-out will-change-transform"
                style={{
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                  transform: isHovered ? "scale(2.4)" : "scale(1)",
                }}
              >
                <Image
                  src={currentImageSrc}
                  alt={`Product preview ${selectedImageIndex + 1}`}
                  fill
                  className="object-contain p-3 md:p-6 pointer-events-none"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  priority
                />
              </div>

              {/* Badges Overlay */}
              <div
                className={`absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none transition-opacity duration-200 ${
                  isHovered ? "opacity-0" : "opacity-100"
                }`}
              >
                {discountPercentage > 0 && (
                  <span className="inline-flex items-center text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-foreground/90 text-background backdrop-blur-md shadow-xs tracking-tight">
                    -{discountPercentage}%
                  </span>
                )}
                {isFeatured && (
                  <Badge className="bg-amber-500 text-white font-medium text-xs shadow-xs px-2.5 py-0.5 hover:bg-amber-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>

              {/* Hover Zoom Hint Pill (Desktop only) */}
              <div
                className={`absolute top-3 right-3 z-10 pointer-events-none transition-opacity duration-200 hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-foreground/80 bg-background/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-border/60 shadow-xs ${
                  isHovered ? "opacity-0" : "opacity-100"
                }`}
              >
                <ZoomIn className="h-3.5 w-3.5 text-primary" />
                <span>মাউস রেখে জুম করে দেখুন</span>
              </div>

              {/* Navigation Arrows for Multiple Images */}
              {safeImages.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className={`absolute left-2.5 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 bg-background/85 backdrop-blur-md shadow-xs hover:bg-background transition-opacity duration-200 z-10 ${
                      isHovered ? "opacity-0 pointer-events-none" : "opacity-100"
                    }`}
                    onClick={handlePrev}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 bg-background/85 backdrop-blur-md shadow-xs hover:bg-background transition-opacity duration-200 z-10 ${
                      isHovered ? "opacity-0 pointer-events-none" : "opacity-100"
                    }`}
                    onClick={handleNext}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Stock status indicator at bottom right */}
              <div
                className={`absolute bottom-3 right-3 z-10 pointer-events-none transition-opacity duration-200 ${
                  isHovered ? "opacity-0" : "opacity-100"
                }`}
              >
                {inStock ? (
                  <div className="inline-flex items-center gap-1.5 bg-background/90 backdrop-blur-md text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    ইন স্টক
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 bg-background/90 backdrop-blur-md text-rose-700 dark:text-rose-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-500/20 shadow-xs">
                    <AlertCircle className="h-3.5 w-3.5" />
                    স্টক আউট
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
