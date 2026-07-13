import React from "react";
import SiteSettingsForm from "./SiteSettingsForm";
import connectDb from "@/lib/connectdb";
import SiteInfo from "@/models/siteInfo.model";
import { getEnvSiteConfig } from "@/lib/siteConfig";
import type { ISiteInfo } from "@/interface/siteInfo.interface";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  // Server-load current DB values so the form renders with up-to-date data.
  // Fallback to env defaults if the doc doesn't exist yet.
  const env = getEnvSiteConfig();

  let deliveryInsideDhaka = env.deliveryCharge.insideDhaka;
  let deliveryOutsideDhaka = env.deliveryCharge.outsideDhaka;
  let metaPixelId = env.metaPixelId ?? "";
  let gaMeasurementId = env.gaMeasurementId ?? "";

  try {
    await connectDb();
    const doc = (await SiteInfo.findOne().lean()) as Partial<ISiteInfo> | null;
    if (doc?.deliveryCharge) {
      if (typeof doc.deliveryCharge.insideDhaka === "number") {
        deliveryInsideDhaka = doc.deliveryCharge.insideDhaka;
      }
      if (typeof doc.deliveryCharge.outsideDhaka === "number") {
        deliveryOutsideDhaka = doc.deliveryCharge.outsideDhaka;
      }
    }
    if (typeof doc?.metaPixelId === "string") {
      metaPixelId = doc.metaPixelId;
    }
    if (typeof doc?.gaMeasurementId === "string") {
      gaMeasurementId = doc.gaMeasurementId;
    }
  } catch {
    // Swallow — env defaults already cover us.
  }

  return (
    <div className="py-5 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Site Settings</h1>
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