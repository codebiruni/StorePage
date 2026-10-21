"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ModeToggle } from "@/components/theme-toggle";
import { Store, ExternalLink } from "lucide-react";

export default function DashboardHeader() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentSegment = segments[segments.length - 1];

  const formatSegment = (s: string) => {
    if (!s || s === "dashboard") return "Overview";
    return s
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <header className="flex fixed top-0 w-full h-12 bg-background/95 backdrop-blur border-b items-center justify-between px-3 sm:px-4 z-40 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard" className="text-xs sm:text-sm font-medium">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {segments.length > 1 && currentSegment !== "dashboard" && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs sm:text-sm font-semibold truncate max-w-[120px] sm:max-w-xs">
                    {formatSegment(currentSegment)}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted/80 transition-colors"
          title="View Storefront"
        >
          <Store className="h-3.5 w-3.5" />
          <span>Storefront</span>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </Link>
        <ModeToggle />
      </div>
    </header>
  );
}
