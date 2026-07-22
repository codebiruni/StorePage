/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegisterPayload {
  email?: string;
  number?: string;
  password: string;
  isSocial: boolean;
}

interface RegisterResponse {
  success: boolean;
  error?: string;
  data?: any;
}

type Method = "email" | "number";

interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  {
    id: "letter",
    label: "Contains a letter",
    test: (v) => /[A-Za-z]/.test(v),
  },
  {
    id: "digit",
    label: "Contains a number",
    test: (v) => /\d/.test(v),
  },
];

function scorePassword(value: string) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  if (value.length >= 12) score += 1;
  return Math.min(score, 4);
}

const STRENGTH_LABEL = ["Too weak", "Weak", "Fair", "Good", "Strong"] as const;

export default function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [method, setMethod] = useState<Method>("email");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (password && value !== password) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (confirmPassword && value !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const strength = useMemo(() => scorePassword(password), [password]);
  const strengthLabel = STRENGTH_LABEL[strength];
  const strengthColors = [
    "bg-muted",
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
  ] as const;

  const rulesMet = PASSWORD_RULES.map((rule) => ({
    ...rule,
    ok: rule.test(password),
  }));
  const allRulesMet = rulesMet.every((rule) => rule.ok);

  const canSubmit =
    !loading &&
    !passwordError &&
    Boolean(password) &&
    Boolean(confirmPassword) &&
    allRulesMet &&
    (method === "email"
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      : number.trim().length >= 6);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Please complete every field correctly.");
      return;
    }

    setLoading(true);

    try {
      const payload: RegisterPayload = {
        password,
        isSocial: false,
      };

      if (method === "email") {
        payload.email = email.trim();
      } else {
        payload.number = number.trim();
      }

      const res = await fetch("/api/v1/user/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: RegisterResponse = await res.json().catch(() => ({} as any));

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Account created!", {
        description: "Please verify your account to continue.",
      });
      const identifier = email || number;
      router.push(`/sign-up/${encodeURIComponent(identifier)}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      noValidate
      {...props}
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserPlus className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick a method and set a password — we&apos;ll verify the rest.
        </p>
      </div>

      {/* Error alert */}
      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive animate-in fade-in-50 slide-in-from-top-1">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Method toggle */}
      <div className="grid gap-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
          Sign up with
        </Label>
        <div
          role="tablist"
          aria-label="Sign-up method"
          className="grid grid-cols-2 rounded-lg border border-input bg-muted/30 p-1 text-sm"
        >
          {(
            [
              { id: "email", label: "Email", icon: Mail },
              { id: "number", label: "Phone", icon: Phone },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = method === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMethod(id)}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 font-medium transition",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Identifier */}
      <div className="grid gap-2">
        <Label
          htmlFor={method === "email" ? "email" : "number"}
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80"
        >
          {method === "email" ? "Email address" : "Phone number"}
        </Label>
        {method === "email" ? (
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required={method === "email"}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 pl-9 transition focus-visible:ring-offset-0"
            />
          </div>
        ) : (
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="number"
              type="tel"
              placeholder="01XXXXXXXXX"
              required={method === "number"}
              autoComplete="tel"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="h-11 pl-9 transition focus-visible:ring-offset-0"
            />
          </div>
        )}
      </div>

      {/* Password */}
      <div className="grid gap-2">
        <Label
          htmlFor="password"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80"
        >
          Password
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            className="h-11 pl-9 pr-10 transition focus-visible:ring-offset-0"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Strength meter + rules */}
        {password.length > 0 ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Password strength</span>
              <span
                className={cn(
                  "font-medium",
                  strength <= 1 && "text-red-500",
                  strength === 2 && "text-orange-500",
                  strength === 3 && "text-amber-500",
                  strength === 4 && "text-emerald-500",
                )}
              >
                {strengthLabel}
              </span>
            </div>
            <div
              className="grid grid-cols-4 gap-1"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={strength}
              aria-label="Password strength"
            >
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-colors",
                    i < strength ? strengthColors[strength] : "bg-muted",
                  )}
                />
              ))}
            </div>

            <ul className="grid gap-1 pt-1 text-xs text-muted-foreground">
              {rulesMet.map((rule) => (
                <li
                  key={rule.id}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    rule.ok && "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {rule.ok ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  {rule.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Confirm password */}
      <div className="grid gap-2">
        <Label
          htmlFor="confirmPassword"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80"
        >
          Confirm password
        </Label>
        <div className="relative">
          <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            className={cn(
              "h-11 pl-9 pr-10 transition focus-visible:ring-offset-0",
              passwordError && "border-destructive/60 ring-1 ring-destructive/30",
            )}
          />
        </div>
        {passwordError ? (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            {passwordError}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="h-11 w-full font-medium shadow-sm transition-all active:scale-[0.98]"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account…
          </span>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
