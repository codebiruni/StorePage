"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

type Role = "user" | "admin" | "menager" | "super-admin";
type Status = "in-progress" | "blocked";

interface FormData {
  email: string;
  number: string;
  username: string;
  password: string;
  role: Role;
  status: Status;
  isActive: boolean;
  isSocial: boolean;
  isDeleted: boolean;
}

const initialFormData: FormData = {
  email: "",
  number: "",
  username: "",
  password: "",
  role: "user",
  status: "in-progress",
  isActive: true,
  isSocial: false,
  isDeleted: false,
};

export default function CreateUserForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => setFormData(initialFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim() && !formData.number.trim()) {
      toast.error("Either email or phone number is required.");
      return;
    }

    if (!formData.isSocial && !formData.password) {
      toast.error("Password is required for non-social accounts.");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/v1/user/admin-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email.trim() || undefined,
          number: formData.number.trim() || undefined,
          username: formData.username.trim() || undefined,
          password: formData.password || undefined,
          role: formData.role,
          status: formData.status,
          isActive: formData.isActive,
          isSocial: formData.isSocial,
          isDeleted: formData.isDeleted,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create user.");
      }

      toast.success("User created successfully", {
        description:
          data.data?.email || data.data?.number
            ? `${data.data.email || data.data.number} (${data.data.role})`
            : undefined,
      });

      resetForm();
      // Take the admin back to the user list so they can see the new row.
      router.push("/dashboard/handle-users");
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create user."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-none p-0 border-0 py-6">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="h-6 w-6" />
          Create New User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Identity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Identity</h3>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@company.com"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Phone Number</Label>
                <Input
                  id="number"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              At least one of email or phone number is required.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {formData.isSocial ? "(optional)" : "*"}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="At least 6 characters"
                  required={!formData.isSocial}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Access */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Access & Status</h3>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: Role) =>
                    setFormData((prev) => ({ ...prev, role: value }))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="menager">Manager</SelectItem>
                    <SelectItem value="super-admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Account Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Status) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Flags</h3>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 border rounded-md p-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4"
                  disabled={isSubmitting}
                />
                <div>
                  <div className="font-medium">Active</div>
                  <div className="text-xs text-muted-foreground">
                    User can sign in immediately.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 border rounded-md p-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isSocial"
                  checked={formData.isSocial}
                  onChange={handleInputChange}
                  className="h-4 w-4"
                  disabled={isSubmitting}
                />
                <div>
                  <div className="font-medium">Social Login</div>
                  <div className="text-xs text-muted-foreground">
                    No password is required for this account.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 border rounded-md p-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isDeleted"
                  checked={formData.isDeleted}
                  onChange={handleInputChange}
                  className="h-4 w-4"
                  disabled={isSubmitting}
                />
                <div>
                  <div className="font-medium">Soft-deleted</div>
                  <div className="text-xs text-muted-foreground">
                    Mark this account as removed (hidden from lists).
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={isSubmitting}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {isSubmitting ? "Creating…" : "Create User"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}