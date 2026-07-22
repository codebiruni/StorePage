"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronsUpDown,
  LogOut,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useContextData } from "@/defaults/context/Context";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

function getInitials(name?: string, email?: string) {
  const source = (name || email || "?").trim();
  if (!source) return "U";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return source.charAt(0).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { UserData } = useContextData();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const displayName: string =
    UserData?.name ||
    UserData?.fullName ||
    UserData?.username ||
    UserData?.email ||
    "Signed-in user";

  const email: string | undefined =
    UserData?.email || UserData?.number || undefined;

  const role: string | undefined = UserData?.role;

  const avatarUrl: string | undefined =
    UserData?.avatar || UserData?.image || UserData?.photoURL || undefined;

  const initials = getInitials(displayName, email);

  const performLogout = async () => {
    try {
      setSigningOut(true);
      const response = await fetch("/api/v1/user/logout", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Logout request failed");
      }

      toast.success("Signed out successfully", {
        description: "See you again soon.",
      });

      setConfirmOpen(false);
      router.refresh();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Could not sign you out", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group"
              aria-label="Open account menu"
            >
              <Avatar className="h-8 w-8 rounded-lg border border-sidebar-border/60 shadow-sm">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                ) : null}
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold tracking-tight">
                  {displayName}
                </span>
                {email ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {email}
                  </span>
                ) : (
                  <span className="truncate text-xs text-muted-foreground">
                    Manage account
                  </span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-70 transition-transform group-data-[state=open]:rotate-180" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 z-[1000] rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Avatar className="h-9 w-9 rounded-lg">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-left text-sm leading-tight">
                  <p className="truncate font-semibold">{displayName}</p>
                  {email ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {email}
                    </p>
                  ) : null}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled
              className="cursor-default opacity-100"
            >
              <Mail className="mr-2 h-4 w-4" />
              <span className="truncate">{email || "No email on file"}</span>
            </DropdownMenuItem>
            {role ? (
              <DropdownMenuItem disabled className="cursor-default opacity-100">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span className="capitalize">{role.replace("-", " ")}</span>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setConfirmOpen(true);
              }}
              className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                  <LogOut className="h-4 w-4" />
                </span>
                Sign out of your account?
              </DialogTitle>
              <DialogDescription>
                You&apos;ll need to sign in again to access your dashboard,
                orders, and saved items.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={signingOut}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={performLogout}
                disabled={signingOut}
              >
                {signingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing out…
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Yes, sign out
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}