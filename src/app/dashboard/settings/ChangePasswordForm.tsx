"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from the current password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to change password.");
      }

      toast.success(data.message || "Password updated successfully.");
      resetForm();
    } catch (err) {
      toast.error((err as Error)?.message || "Failed to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full sm:max-w-xl md:max-w-2xl space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Change Password
          </h2>
          <p className="text-xs text-muted-foreground">
            Update the password you use to sign in.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="current-password"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80"
        >
          Current Password
        </Label>
        <Input
          id="current-password"
          type="password"
          placeholder="Enter your current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="new-password"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80"
        >
          New Password
        </Label>
        <Input
          id="new-password"
          type="password"
          placeholder="Enter a new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="confirm-password"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80"
        >
          Confirm New Password
        </Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Re-enter the new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center gap-2"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isSubmitting ? "Updating…" : "Update Password"}
      </Button>
    </form>
  );
}