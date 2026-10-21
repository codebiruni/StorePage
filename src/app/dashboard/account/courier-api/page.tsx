import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function CourierApiSettingsRedirect() {
  redirect("/dashboard/settings?tab=courier");
}
