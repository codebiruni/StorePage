"use client";

import * as React from "react";

import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) {
  const [activeTeam] = React.useState(teams[0]);
  const { config: siteConfig } = useSiteConfig();

  if (!activeTeam) {
    return null;
  }

  // Multi-tenant: brand name + tagline + logo come from siteConfig (env
  // defaults merged with siteInfo DB). Fallback chain preserves the legacy
  // hardcoded copy only as a last resort for un-seeded deployments.
  const brandName = siteConfig?.name || activeTeam.name || "My Store";
  const brandTagline = siteConfig?.tagline || activeTeam.plan || "";
  const brandLogo = siteConfig?.logo || "/logo.png";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-2 p-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
            <Image src={brandLogo} alt={brandName} width={120} height={120} />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{brandName}</span>
            <span className="truncate text-xs">{brandTagline}</span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
