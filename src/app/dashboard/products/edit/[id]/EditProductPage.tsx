"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import ProductWizard, {
  type ProductWizardProps,
} from "@/app/dashboard/_shared/product-form/ProductWizard";
import type { ProductFormData } from "@/app/dashboard/_shared/product-form/types";
import { buildLandingPagePayload } from "@/app/dashboard/_shared/persistLanding";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

/**
 * /dashboard/products/edit/[id] — fetches the existing product, then renders
 * the shared wizard in `edit` mode. PATCH on save.
 */
export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [initialData, setInitialData] = useState<Partial<ProductFormData> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/v1/product/status/${id}`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch product");
        const json = await res.json();
        if (cancelled) return;
        const product = json?.data ?? {};

        const formatted: Partial<ProductFormData> = {
          name: product.name ?? "",
          details: product.details ?? "",
          images: Array.isArray(product.images) ? product.images : [],
          generalPrice: product.generalPrice ?? {
            currentPrice: 0,
            prevPrice: 0,
            discountPercentage: 0,
          },
          stock: product.stock ?? product.quentity ?? 0,
          priceVariants: Array.isArray(product.priceVariants)
            ? product.priceVariants.map((v: ProductFormData["priceVariants"][number]) => ({
                ...v,
                stock: (v as { quentity?: number }).quentity ?? v.stock ?? 0,
              }))
            : [],
          quickOverview: Array.isArray(product.quickOverview)
            ? product.quickOverview
            : [],
          specifications: Array.isArray(product.specifications)
            ? product.specifications
            : [],
          category: typeof product.category === "string"
            ? product.category
            : product.category?._id ?? "",
          subCategory: typeof product.subCategory === "string"
            ? product.subCategory
            : product.subCategory?._id ?? "",
          coupon: Array.isArray(product.coupon) ? product.coupon : [],
          tags: Array.isArray(product.tags) ? product.tags : [],
          brand: product.brand ?? "",
          isFeatured: !!product.isFeatured,
          isDeleted: !!product.isDeleted,
          hasOffer: !!product.hasOffer,
          offerEndDate: product.offerEndDate
            ? new Date(product.offerEndDate)
            : undefined,
        };

        // The primary GET already returns the full Mongoose document, so
        // landingPage is right there on `product` — copy it directly. This
        // avoids relying on a second auth-gated fetch which may silently
        // fail for non-admin roles and leave `landingPage` undefined.
        if (product?.landingPage) {
          (formatted as ProductFormData & { landingPage?: unknown }).landingPage =
            product.landingPage;
        }

        setInitialData(formatted);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave: ProductWizardProps["onSave"] = async ({
    values,
    landingValue,
  }) => {
    try {
      // `category` is a required ObjectId on the server, but the form stores it
      // as a plain string (defaulted to ""). Sending an empty string back makes
      // Mongoose throw "Cast to ObjectId failed for value \"\"" — drop it when
      // empty so we don't clobber the existing category on save.
      const { category, subCategory, ...rest } = values as ProductFormData &
        Record<string, unknown>;
      const payload: Record<string, unknown> = {
        ...rest,
        quentity: values.stock,
        offerEndDate: values.offerEndDate
          ? new Date(values.offerEndDate).toISOString()
          : null,
        ...(typeof category === "string" && category.trim()
          ? { category }
          : {}),
        ...(typeof subCategory === "string" && subCategory.trim()
          ? { subCategory }
          : {}),
        landingPage: buildLandingPagePayload(landingValue),
      };

      const res = await fetch(`/api/v1/product/status/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Failed to update product";
        try {
          const err = await res.json();
          msg = err.message || err.error || msg;
        } catch {
          /* ignore */
        }
        return { ok: false, error: msg };
      }

      // Re-fetch the canonical product so the wizard's `initialData` updates.
      // Without this, the wizard stays seeded from the original (pre-save)
      // object and the next theme re-render can revert to whatever the
      // original fetch had — which is why the theme "always came back to
      // origin" when changing it.
      try {
        const refetch = await fetch(`/api/v1/product/status/${id}`, {
          method: "GET",
          credentials: "include",
        });
        if (refetch.ok) {
          const j = await refetch.json();
          const fresh = j?.data;
          if (fresh) {
            // Reuse the same formatter inline below — easiest is to call the
            // fetcher again. We mirror it with a fresh formatted object so the
            // reference changes (wizard re-seeds on reference change).
            const formatted: Partial<ProductFormData> = {
              name: fresh.name ?? "",
              details: fresh.details ?? "",
              images: Array.isArray(fresh.images) ? fresh.images : [],
              generalPrice: fresh.generalPrice ?? {
                currentPrice: 0,
                prevPrice: 0,
                discountPercentage: 0,
              },
              stock: fresh.stock ?? fresh.quentity ?? 0,
              priceVariants: Array.isArray(fresh.priceVariants)
                ? fresh.priceVariants.map(
                    (v: ProductFormData["priceVariants"][number]) => ({
                      ...v,
                      stock:
                        (v as { quentity?: number }).quentity ?? v.stock ?? 0,
                    }),
                  )
                : [],
              quickOverview: Array.isArray(fresh.quickOverview)
                ? fresh.quickOverview
                : [],
              specifications: Array.isArray(fresh.specifications)
                ? fresh.specifications
                : [],
              category:
                typeof fresh.category === "string"
                  ? fresh.category
                  : fresh.category?._id ?? "",
              subCategory:
                typeof fresh.subCategory === "string"
                  ? fresh.subCategory
                  : fresh.subCategory?._id ?? "",
              coupon: Array.isArray(fresh.coupon) ? fresh.coupon : [],
              tags: Array.isArray(fresh.tags) ? fresh.tags : [],
              brand: fresh.brand ?? "",
              isFeatured: !!fresh.isFeatured,
              isDeleted: !!fresh.isDeleted,
              hasOffer: !!fresh.hasOffer,
              offerEndDate: fresh.offerEndDate
                ? new Date(fresh.offerEndDate)
                : undefined,
            };
            if (fresh.landingPage) {
              formatted.landingPage = fresh.landingPage;
            }
            setInitialData(formatted);
          }
        }
      } catch (e) {
        // Non-fatal — the save itself succeeded.
        console.error("Refetch after save failed:", e);
      }

      return { ok: true };
    } catch (err) {
      console.error(err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Network error",
      };
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl py-12">
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading product…
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProductWizard
      mode="edit"
      productId={id as string}
      initialData={initialData}
      onSave={handleSave}
      heading="Edit product"
      subheading="Update details, pricing, or the landing page. Save when you're done."
    />
  );
}
