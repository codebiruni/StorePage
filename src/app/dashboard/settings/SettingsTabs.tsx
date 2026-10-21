"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sliders, MessageSquare, Truck, Lock } from "lucide-react";
import SiteSettingsForm from "../website-info/settings/SiteSettingsForm";
import TelegramSettingsCard from "./TelegramSettingsCard";
import CouriersApiForm from "../account/courier-api/CouriersApiForm";
import ChangePasswordForm from "./ChangePasswordForm";

const VALID_TABS = ["site", "telegram", "courier", "security"] as const;
type TabKey = (typeof VALID_TABS)[number];

export default function SettingsTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentTabParam = searchParams.get("tab") || "";
  const activeTab: TabKey = VALID_TABS.includes(currentTabParam as TabKey)
    ? (currentTabParam as TabKey)
    : "site";

  const handleTabChange = (val: string) => {
    router.replace(`/dashboard/settings?tab=${val}`, { scroll: false });
  };

  return (
    <div className="w-full flex justify-center py-6">
      <div className="w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your store configurations, notification alerts, courier integrations, and security.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/60">
            <TabsTrigger
              value="site"
              className="flex items-center gap-2 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Sliders className="h-4 w-4" />
              <span>Site Settings</span>
            </TabsTrigger>
            <TabsTrigger
              value="telegram"
              className="flex items-center gap-2 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Telegram Alerts</span>
            </TabsTrigger>
            <TabsTrigger
              value="courier"
              className="flex items-center gap-2 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Truck className="h-4 w-4" />
              <span>Courier API</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Lock className="h-4 w-4" />
              <span>Change Password</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Site Settings */}
          <TabsContent value="site" className="mt-6 focus-visible:outline-none">
            <SiteSettingsForm />
          </TabsContent>

          {/* Tab 2: Telegram Notifications */}
          <TabsContent value="telegram" className="mt-6 focus-visible:outline-none">
            <TelegramSettingsCard />
          </TabsContent>

          {/* Tab 3: Courier Integrations */}
          <TabsContent value="courier" className="mt-6 focus-visible:outline-none">
            <CouriersApiForm />
          </TabsContent>

          {/* Tab 4: Account Security */}
          <TabsContent value="security" className="mt-6 focus-visible:outline-none">
            <ChangePasswordForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

