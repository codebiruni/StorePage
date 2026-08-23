import React from "react";
import SiteSettingsForm from "../website-info/settings/SiteSettingsForm";
import connectDb from "@/lib/connectdb";
import SiteInfo from "@/models/siteInfo.model";
import { getEnvSiteConfig } from "@/lib/siteConfig";
import type { ISiteInfo } from "@/interface/siteInfo.interface";

export const dynamic = "force-dynamic";

export default async function UtilityPage() {
  // Same server-load pattern as the website-info settings page so the form
  // renders with up-to-date DB values (delivery charges, Meta Pixel, GA).
  const env = getEnvSiteConfig();

  let deliveryInsideDhaka = env.deliveryCharge.insideDhaka;
  let deliveryOutsideDhaka = env.deliveryCharge.outsideDhaka;
  let metaPixelId = env.metaPixelId ?? "";
  let gaMeasurementId = env.gaMeasurementId ?? "";

  try {
    await connectDb();
    const doc = (await SiteInfo.findOne().lean()) as Partial<ISiteInfo> | null;
    const charge = (doc as any)?.deliveryCharge;
    if (charge) {
      if (typeof charge.insideDhaka === "number") {
        deliveryInsideDhaka = charge.insideDhaka;
      }
      if (typeof charge.outsideDhaka === "number") {
        deliveryOutsideDhaka = charge.outsideDhaka;
      }
    }
    if (typeof (doc as any)?.metaPixelId === "string") {
      metaPixelId = (doc as any).metaPixelId;
    }
    if (typeof (doc as any)?.gaMeasurementId === "string") {
      gaMeasurementId = (doc as any).gaMeasurementId;
    }
  } catch {
    // Swallow — env defaults already cover us.
  }

  return (
    <div className="py-5 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Utility</h1>
        <p className="text-sm text-muted-foreground">
          Delivery fees, Meta Pixel, and Google Analytics — all in one place.
        </p>
      </div>

      <SiteSettingsForm
        initialValues={{
          deliveryInsideDhaka,
          deliveryOutsideDhaka,
          metaPixelId,
          gaMeasurementId,
        }}
      />
    </div>
  );
}
