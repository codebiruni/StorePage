import React from "react";
import ChangePasswordForm from "./ChangePasswordForm";

export default function SettingsPage() {
  return (
    <div className="py-5">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and security preferences.
        </p>
      </div>

      <div className="flex justify-center">
        <ChangePasswordForm />
      </div>
    </div>
  );
}