"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import TopLeftContent from "./TopLeftContent";
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
  const { isMobile } = useSidebar();
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className=" flex aspect-square size-8 items-center justify-center rounded-lg">
                <Image src={brandLogo} alt={brandName} width={120} height={120} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{brandName}</span>
                <span className="truncate text-xs">{brandTagline}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <TopLeftContent isMobile={isMobile} />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
