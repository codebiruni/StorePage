"use client";

import ProductWizard, {
  type ProductWizardProps,
} from "@/app/dashboard/_shared/product-form/ProductWizard";

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
        landingPage: {
          theme: landingValue.theme,
          heroTitle: landingValue.heroTitle,
          heroSubtitle: landingValue.heroSubtitle,
          heroBadge: landingValue.heroBadge,
          heroCtaLabel: landingValue.heroCtaLabel,
          painPoints: (landingValue.painPoints ?? []).filter(Boolean),
          benefits: (landingValue.benefits ?? []).filter(Boolean),
          howToUse: (landingValue.howToUse ?? []).filter(Boolean),
          guarantee: landingValue.guarantee,
          trustBadges: (landingValue.trustBadges ?? []).filter(Boolean),
          vslUrl: landingValue.vslUrl,
          youtubeUrl: landingValue.youtubeUrl,
          checkoutNote: landingValue.checkoutNote,
          comparison: {
            oursTitle: landingValue.comparisonOursTitle,
            oursItems: (landingValue.comparisonOursItems ?? []).filter(Boolean),
            othersTitle: landingValue.comparisonOthersTitle,
            othersItems: (landingValue.comparisonOthersItems ?? []).filter(Boolean),
          },
          phoneStripNote: landingValue.phoneStripNote,
        },
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
