/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useTransition } from "react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, RotateCw, ShieldCheck } from "lucide-react";
import BrandLogo from "@/defaults/home-nav/BrandLogo";
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider";

function maskIdentifier(id: string) {
  if (!id) return "";
  if (id.includes("@")) {
    const [local, domain] = id.split("@");
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
  }
  if (id.length > 6) {
    return `${id.slice(0, 3)}****${id.slice(-3)}`;
  }
  return id;
}

export default function OtpForm() {
  const router = useRouter();
  const params = useParams();
  const rawIdentifier = Array.isArray(params?.identifier)
    ? params.identifier[0]
    : (params?.identifier as string) || "";
  const identifier = decodeURIComponent(rawIdentifier);

  const { config } = useSiteConfig();
  const brandName = config?.name ?? "Online Shop";

  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, startResendTransition] = useTransition();

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const verifyOtp = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/user/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, code: codeToVerify }),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Verification failed");
      }

      toast.success("Account Verified!", {
        description: "Welcome! Let's complete your profile.",
      });

      router.push("/complete-account");
    } catch (err: any) {
      toast.error("Verification Failed", {
        description: err.message || "Invalid or expired verification code.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Invalid Code", {
        description: "Please enter the complete 6-digit code.",
      });
      return;
    }
    await verifyOtp(otp);
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      verifyOtp(value);
    }
  };

  const handleResend = () => {
    if (resendCooldown > 0 || isResending) return;

    startResendTransition(async () => {
      try {
        const res = await fetch("/api/v1/user/manage/resend-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to resend code");
        }

        toast.success("Code Sent", {
          description: data.message || "A new 6-digit verification code was sent.",
        });
        setResendCooldown(60);
      } catch (err: any) {
        toast.error("Resend Failed", {
          description: err.message || "Could not resend verification code.",
        });
      }
    });
  };

  return (
    <div className="top-padding relative flex min-h-svh w-full items-start justify-center overflow-x-hidden overflow-y-auto bg-background px-4 py-8 sm:px-6 sm:py-10 lg:items-center lg:py-12">
      {/* Decorative background glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-[360px] w-[360px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>

      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl backdrop-blur-sm lg:grid-cols-2">
        {/* Left Branding Panel */}
        <aside className="relative hidden flex-col justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-background p-10 lg:flex">
          <BrandLogo brandName={brandName} logoUrl={config?.logo} size={44} />

          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Two-Step Verification
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Security First
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              We verify every new account to ensure your orders, addresses, and account details remain safe and secure.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Protects against unauthorized access
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Ensures order alerts reach you safely
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Fast one-time 6-digit confirmation
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground/80">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
        </aside>

        {/* Right Form Panel */}
        <section className="flex flex-col justify-center gap-6 p-6 sm:p-10">
          <div className="flex items-center justify-between">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Change details
            </Link>
            <span className="text-xs text-muted-foreground">Step 2 of 3</span>
          </div>

          <div className="space-y-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Check your inbox
            </h1>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <strong className="font-semibold text-foreground">
                {maskIdentifier(identifier)}
              </strong>
              . Enter it below to activate your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
            <div className="py-2">
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                value={otp}
                onChange={handleOtpChange}
                disabled={isSubmitting}
                autoFocus
              >
                <InputOTPGroup className="gap-2 sm:gap-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="h-12 w-10 text-lg font-semibold border-muted-foreground/30 sm:h-14 sm:w-12 rounded-lg transition-all focus:border-primary"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || otp.length !== 6}
              className="h-11 w-full font-medium shadow-sm transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying code…
                </span>
              ) : (
                "Verify & Continue"
              )}
            </Button>

            {/* Resend actions */}
            <div className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
              <p>Didn&apos;t receive the code?</p>
              {resendCooldown > 0 ? (
                <span className="font-medium text-foreground">
                  Resend available in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline focus-visible:outline-none"
                >
                  {isResending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCw className="h-3.5 w-3.5" />
                  )}
                  Resend verification code
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Having trouble? Make sure you check your spam/junk folder or{" "}
            <Link href="/sign-up" className="text-foreground underline underline-offset-4">
              try another contact method
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
