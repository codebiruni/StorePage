"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import ProductBasicInfo from "./ProductBasicInfo";
import ProductPricingAndOffers from "./ProductPricingAndOffers";
import LandingPageEditor, {
  type LandingFormValue,
  EMPTY_LANDING_VALUE,
} from "@/app/dashboard/_shared/LandingPageEditor";

interface PriceVariant {
  regularPrice: number;
  salePrice?: number;
  quentity: number;
  sku: string;
}

interface Specification {
  key: string;
  value: string;
}

interface Coupon {
  name: string;
  Type: "parcent" | "offer" | "freeDelevery";
  totalOffer: number;
}

interface GeneralPrice {
  currentPrice: number;
  prevPrice: number;
  discountPercentage: number;
}

interface ProductFormData {
  name: string;
  images: string[];
  priceVariants: PriceVariant[];
  quickOverview: string[];
  specifications: Specification[];
  details: string;
  category: string;
  subCategory: string;
  coupon: Coupon[];
  tags: string[];
  brand?: string;
  quentity: number;
  isFeatured: boolean;
  isDeleted: boolean;
  hasOffer: boolean;
  offerEndDate?: Date;
  offerPercentage?: number;
  generalPrice: GeneralPrice;
}

const ProductForm = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [landingValue, setLandingValue] =
    useState<LandingFormValue>(EMPTY_LANDING_VALUE);

  const form = useForm<ProductFormData>({
    defaultValues: {
      name: "",
      images: [],
      priceVariants: [{ regularPrice: 0, salePrice: 0, quentity: 1, sku: "" }],
      quickOverview: [],
      specifications: [{ key: "", value: "" }],
      details: "",
      category: "",
      subCategory: "",
      coupon: [],
      tags: [],
      brand: "",
      quentity: 0,
      isFeatured: false,
      isDeleted: false,
      hasOffer: false,
      offerEndDate: undefined,
      offerPercentage: 0,
      generalPrice: { currentPrice: 0, prevPrice: 0, discountPercentage: 0 },
    },
  });

  // Load data from localStorage on mount
  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      // Format data for API — merge the landing-page block from the editor.
      const formattedData = {
        ...data,
        offerEndDate: data.offerEndDate
          ? new Date(data.offerEndDate)
          : undefined,
        landingPage: {
          theme: landingValue.theme,
          heroSubtitle: landingValue.heroSubtitle,
          heroBadge: landingValue.heroBadge,
          heroCtaLabel: landingValue.heroCtaLabel,
          painPoints: landingValue.painPoints.filter(Boolean),
          benefits: landingValue.benefits.filter(Boolean),
          howToUse: landingValue.howToUse.filter(Boolean),
          guarantee: landingValue.guarantee,
          trustBadges: landingValue.trustBadges.filter(Boolean),
          vslUrl: landingValue.vslUrl,
          youtubeUrl: landingValue.youtubeUrl,
          checkoutNote: landingValue.checkoutNote,
        },
      };

      const res = await fetch("/api/v1/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formattedData),
      });

      // -------- DETAILED SERVER ERROR CAPTURE --------
      if (!res.ok) {
        let serverError = "Failed to create product";
        try {
          // Try parsing as JSON first (common for validation frameworks like Zod/Mongoose)
          const errorData = await res.json();
          console.error("SERVER ERROR DETAILS (JSON):", errorData);
          serverError = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch {
          // Fallback if the server returned a plain text error instead of JSON
          const errorText = await res.text().catch(() => "");
          console.error("SERVER ERROR DETAILS (TEXT):", errorText);
          if (errorText) serverError = errorText;
        }

        throw new Error(serverError);
      }
      // ------------------------------------------------

      // Parse the created product so we can redirect to its edit page
      // (where the live landing-page URL is available for copy/preview).
      let createdId: string | undefined;
      try {
        const json = await res.json();
        createdId = json?.data?._id || json?.data?.id;
      } catch {
        // Non-JSON success body — ignore.
      }

      toast.success("Product created successfully!");
      form.reset();
      setLandingValue(EMPTY_LANDING_VALUE);
      localStorage.removeItem("productFormData");

      if (createdId) {
        router.push(`/dashboard/products/edit/${createdId}`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Caught error in form submission:", error);
      // This will now print the actual server message inside your toast notice!
      toast.error(error.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="p-0 border-0 shadow-none py-6">
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <ProductBasicInfo form={form} />
              <ProductPricingAndOffers form={form} />

              {/* Landing Page Builder — the editor is fully controlled by the
                  parent so the create page owns its own state. The productId
                  prop is omitted (no id until after save) so Copy/Preview
                  buttons are disabled until then. */}
              <LandingPageEditor
                value={landingValue}
                onChange={setLandingValue}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setLandingValue(EMPTY_LANDING_VALUE);
                    localStorage.removeItem("productFormData");
                  }}
                >
                  Reset Form
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Product"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;
