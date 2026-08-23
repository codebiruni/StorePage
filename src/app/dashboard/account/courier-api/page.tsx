import React from "react";
import CouriersApiForm from "./CouriersApiForm";

// Courier API setup lives under Account per the sidebar layout requested in
// the feature brief. All three Bangladeshi couriers (Pathao, Steadfast, RedX)
// are configured on a single page so admins can paste credentials once
// instead of hopping between three separate settings pages.
export default function CourierApiSettingsPage() {
  return (
    <div className="py-5 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Courier API Setup
        </h1>
        <p className="text-sm text-muted-foreground">
          Connect your Pathao, Steadfast, and RedX courier accounts so you can
          push orders with a single click from the order page.
        </p>
      </div>

      <CouriersApiForm />
    </div>
  );
}
