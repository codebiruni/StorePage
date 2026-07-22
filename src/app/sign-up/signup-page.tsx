"use client";

import SignupForm from "@/components/signup-form";
import { useContextData } from "@/defaults/context/Context";
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import BrandLogo from "@/defaults/home-nav/BrandLogo";
import { Sparkles } from "lucide-react";

export default function SignupPage() {
  const { UserData } = useContextData();
  const router = useRouter();
  const { config } = useSiteConfig();
  const brandName = config?.name ?? "Online Shop";

  useEffect(() => {
    if (UserData) {
      router.push(UserData.role == "user" ? "/profile" : "/dashboard");
    }
  }, [UserData, router]);

  return (
    <div className="top-padding relative flex min-h-svh w-full items-start justify-center overflow-x-hidden overflow-y-auto bg-background px-4 py-8 sm:px-6 sm:py-10 lg:items-center lg:py-12">
      {/* Decorative background — purely visual, sits behind everything */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-[360px] w-[360px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>

      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl backdrop-blur-sm lg:grid-cols-2">
        {/* ─────────── Left: brand panel (desktop only) ─────────── */}
        <aside className="relative hidden flex-col justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-background p-10 lg:flex">
          <BrandLogo brandName={brandName} logoUrl={config?.logo} size={44} />

          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Join {brandName}
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Create your account
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Save addresses, track orders, and unlock personalized
              recommendations across every device.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Faster checkout with saved details
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Wishlist, compare, and price-drop alerts
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Secure 2-step verification available
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground/80">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
        </aside>

        {/* ─────────── Right: form panel ─────────── */}
        <section className="flex flex-col gap-6 p-6 sm:p-10">
          <div className="flex items-center justify-end">
            <p className="text-sm text-muted-foreground">
              Already a member?{" "}
              <a
                href="/signin"
                className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                Sign in
              </a>
            </p>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-sm">
              <SignupForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
