"use client";
import React from "react";
import Link from "next/link";
import { ChevronDown, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface NavItem {
  name: string;
  id: string;
  children: {
    name: string;
    id: string;
  }[];
}

export default function BigScreenNav({ navItems }: { navItems: NavItem[] }) {
  // Calculate columns based on children count
  const getColumns = (childrenCount: number) => {
    if (childrenCount <= 6) return 1;
    if (childrenCount <= 12) return 2;
    return 3;
  };

  return (
    <nav className="w-full max-w-screen-xl mx-auto px-2 py-0">
      <div className="flex items-center justify-center">
        {/* Home Link */}
        <Link href="/" className="mr-4 shrink-0">
          <Button variant="ghost" className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Button>
        </Link>

        {/* Category Links */}
        <div className="flex flex-nowrap justify-start items-center gap-1 relative overflow-x-auto scrollbar-hide min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item, index) => {
            const hasChildren = item.children.length > 0;
            const trigger = (
              <Button
                variant="ghost"
                asChild={!hasChildren}
                className="flex items-center gap-1 pl-[0px] px-1 py-1"
              >
                {hasChildren ? (
                  <span className="flex items-center gap-1">
                    {item.name}
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </span>
                ) : (
                  <Link href={`/products/${item.id}`}>{item.name}</Link>
                )}
              </Button>
            );

            if (!hasChildren) {
              return (
                <div key={item.id} className="relative group">
                  {trigger}
                </div>
              );
            }

            return (
              <HoverCard
                key={item.id}
                openDelay={0}
                closeDelay={120}
              >
                <HoverCardTrigger asChild>
                  <div className="relative group">{trigger}</div>
                </HoverCardTrigger>
                <HoverCardContent
                  side="bottom"
                  align={index > navItems.length / 2 ? "end" : "start"}
                  sideOffset={8}
                  // `z-[600]` keeps the dropdown above the fixed navbar
                  // (`z-[498]`) and the hero slider below it.
                  className={cn(
                    "z-[600] max-h-[350px] w-max max-w-[min(90vw,600px)] overflow-y-auto rounded-md border bg-popover p-1 shadow-lg"
                  )}
                >
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${getColumns(
                        item.children.length
                      )}, minmax(100px, 1fr))`,
                    }}
                  >
                    {item.children.map((child) => (
                      <Button
                        key={child.id}
                        variant="ghost"
                        asChild
                        className="w-full justify-start text-left whitespace-nowrap"
                      >
                        <Link
                          href={`/products/${item.id}/${child.id}`}
                          className="hover:bg-accent hover:text-accent-foreground px-3 py-2"
                        >
                          {child.name}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
