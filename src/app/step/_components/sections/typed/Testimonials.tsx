"use client";

/**
 * Testimonials section — slider of customer quote cards. Image aspect is
 * freeform (3:4 cap) since these are usually screenshots.
 */

import { useEffect, useState } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { TestimonialsSectionData } from "@/app/step/_lib/landing-config";

export default function TestimonialsSection({
  data,
}: {
  data: TestimonialsSectionData;
}) {
  const items = data.items ?? [];
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    const onReInit = () => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    };
    api.on("select", onSelect);
    api.on("reInit", onReInit);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onReInit);
    };
  }, [api]);

  if (items.length === 0) return null;

  return (
    <section className="lp-section" data-tone="raised">
      <div className="lp-container">
        {data.title ? (
          <h2
            className="lp-headline mb-8 text-center"
            data-size="xl"
            style={{ color: "var(--lp-primary)" }}
          >
            {data.title}
          </h2>
        ) : null}

        <div className="relative px-2 sm:px-10">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: items.length > 3,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 sm:-ml-4">
              {items.map((it, i) => (
                <CarouselItem
                  key={i}
                  className="pl-2 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <figure className="flex h-full flex-col items-center rounded-xl border border-black/5 bg-white p-4 text-center">
                    {it.image ? (
                      <div
                        className="mb-3 flex w-full justify-center overflow-hidden rounded-md border border-black/5"
                        style={{ aspectRatio: "3 / 4", maxWidth: 280 }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.image}
                          alt={it.name || `Testimonial ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                    {it.text ? (
                      <blockquote className="text-sm italic text-black/80">
                        &ldquo;{it.text}&rdquo;
                      </blockquote>
                    ) : null}
                    {it.name ? (
                      <figcaption className="mt-2 text-xs font-medium text-black/60">
                        — {it.name}
                      </figcaption>
                    ) : null}
                  </figure>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 sm:-left-2" />
            <CarouselNext className="right-0 sm:-right-2" />
          </Carousel>

          {count > 1 ? (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: count }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === current ? "true" : undefined}
                  onClick={() => api?.scrollTo(i)}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: i === current ? 20 : 8,
                    background:
                      i === current
                        ? "var(--lp-primary)"
                        : "rgba(0,0,0,0.2)",
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}