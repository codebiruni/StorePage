"use client";

import ProductWizard, {
  type ProductWizardProps,
} from "@/app/dashboard/_shared/product-form/ProductWizard";
import { buildLandingPagePayload } from "@/app/dashboard/_shared/persistLanding";

/**
 * /dashboard/create-product — thin wrapper around the shared wizard.
 *
 * All UI lives in `_shared/product-form/*`; this file only knows how to talk
 * to the create API endpoint.
 */
export default function ProductForm() {
  const handleSave: ProductWizardProps["onSave"] = async ({
    values,
    landingValue,
  }) => {
    try {
      const payload = {
        ...values,
        offerEndDate: values.offerEndDate
          ? new Date(values.offerEndDate).toISOString()
          : undefined,
        landingPage: buildLandingPagePayload(landingValue),
      };

      const res = await fetch("/api/v1/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Failed to create product";
        try {
          const err = await res.json();
          msg = err.message || err.error || msg;
        } catch {
          const text = await res.text().catch(() => "");
          if (text) msg = text;
        }
        return { ok: false, error: msg };
      }

      const data = await res.json().catch(() => null);
      const newId: string | undefined = data?.data?._id ?? data?.data?.id;
      return { ok: true, productId: newId };
    } catch (err) {
      console.error(err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Network error",
      };
    }
  };

  return (
    <ProductWizard
      mode="create"
      onSave={handleSave}
      heading="Add new product"
      subheading="Three short steps. Save anytime — your draft is kept on this device."
    />
  );
}
