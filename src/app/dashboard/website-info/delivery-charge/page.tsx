import { redirect } from "next/navigation";

// Delivery-charge, Meta Pixel, and Google Analytics now live together at
// /dashboard/website-info/settings. Redirect legacy URLs so old links still
// land on the right page.
export default function DeliveryChargeRedirect(): never {
  redirect("/dashboard/website-info/settings");
}