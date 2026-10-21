import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SiteSettingsRedirect() {
  redirect("/dashboard/settings?tab=site");
}
