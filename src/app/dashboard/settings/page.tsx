import React, { Suspense } from "react";
import SettingsTabs from "./SettingsTabs";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SettingsTabs />
    </Suspense>
  );
}
