"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  LogIn,
  LogOut,
  Moon,
  Search,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useContextData } from "@/defaults/context/Context";
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider";
import BrandLogo from "./BrandLogo";

interface MobileDrawerProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  id: string;
  children: { name: string; id: string }[];
}

const initials = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "U";

export default function MobileDrawer({ children }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { navItems } = useContextData() as unknown as {
    navItems: NavItem[];
  };
  const { UserData } = useContextData();
  const { config } = useSiteConfig();
  const brandName = config?.name ?? "My Store";

  const { theme, setTheme } = useTheme();

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const close = () => setOpen(false);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/v1/user/logout", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Logout failed");
      toast.success("Signed out", { description: "See you again soon." });
      close();
      window.location.href = "/";
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not sign you out",
      );
    }
  };

  const displayName: string =
    UserData?.name ||
    UserData?.username ||
    UserData?.email ||
    "Guest";
  const email: string | undefined = UserData?.email;
  const role: string | undefined = UserData?.role;
  const avatarUrl: string | undefined =
    UserData?.avatar || UserData?.image || UserData?.photoURL;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent
        side="left"
        className="flex h-full w-[88vw] max-w-sm flex-col gap-0 border-r-0 p-0 [&>button[aria-label='Close']]:hidden sm:w-[360px]"
      >
        {/* Header — brand + sticky close */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <BrandLogo
            brandName={brandName}
            logoUrl={config?.logo}
            size={32}
            asLink={false}
          />
        </div>

        {/* User card / sign-in CTA */}
        {UserData ? (
          <div className="border-b border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 py-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 rounded-xl border border-border/60">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                ) : null}
                <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                  {initials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {email || (role ? `Signed in as ${role}` : "Member")}
                </p>
              </div>
              <Link
                href={role == "user" ? "/profile" : "/dashboard"}
                onClick={close}
                className="inline-flex"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full px-3 text-xs"
                >
                  Open
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="border-b border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 py-4">
            <p className="mb-2 text-sm font-semibold">Welcome to {brandName}</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Sign in to track orders, save favorites, and check out faster.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/signin" onClick={close} className="inline-flex">
                <Button className="h-9 w-full rounded-full">
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up" onClick={close} className="inline-flex">
                <Button
                  variant="outline"
                  className="h-9 w-full rounded-full"
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Sign up
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Scrollable navigation */}
        <div className="scrollHidden flex-1 overflow-y-auto px-2 py-3">
          {/* Quick links */}
          <ul className="mb-2 grid grid-cols-1 gap-2 px-2">
            {[{ href: "/", icon: Home, label: "Home" }].map(
              ({ href, icon: Icon, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={close}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    {label}
                  </Link>
                </li>
              ),
            )}
          </ul>

          <Separator className="my-2" />

          {/* Search affordance */}
          <Link
            href="/search"
            onClick={close}
            className="mx-2 mb-2 flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted"
          >
            <Search className="h-4 w-4" />
            Search products, categories…
          </Link>

          <Separator className="my-2" />

          {/* Categories — modern accordion */}
          <div className="space-y-1">
            {navItems?.map((item) => {
              const isExpanded = expanded[item.id];
              const hasChildren = item.children.length > 0;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "overflow-hidden rounded-xl border border-transparent",
                    isExpanded && "border-border/60 bg-card shadow-sm",
                  )}
                >
                  <div className="flex items-stretch">
                    <Link
                      href={`/products/${item.id}`}
                      onClick={close}
                      className="flex flex-1 items-center gap-3 px-3 py-3 text-sm font-medium"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                      {item.name}
                    </Link>
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        aria-expanded={isExpanded}
                        aria-label={`Toggle ${item.name} subcategories`}
                        className="flex w-11 items-center justify-center text-muted-foreground transition hover:bg-muted"
                      >
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isExpanded && "rotate-90",
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {hasChildren && isExpanded && (
                    <div className="border-t border-border/60 bg-background/40">
                      <ul className="space-y-0.5 p-2">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/products/${item.id}/${child.id}`}
                              onClick={close}
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer — theme + (logout or sign-in) */}
        <div className="border-t border-border/60 bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-card text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:inline-flex" />
              <span>Theme</span>
            </button>
            {UserData ? (
              <button
                type="button"
                onClick={handleLogout}
                className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500/10 text-xs font-medium text-red-600 transition hover:bg-red-500/20 dark:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            ) : (
              <Link
                href="/signin"
                onClick={close}
                className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-xs font-medium text-primary-foreground transition hover:opacity-90"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>© {new Date().getFullYear()} {brandName}</span>
            <div className="flex items-center gap-2">
              <Link href="/privacy-policy" onClick={close} className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/return-policy" onClick={close} className="hover:text-foreground">
                Returns
              </Link>
              <Link href="/contact-us" onClick={close} className="hover:text-foreground">
                Help
              </Link>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
