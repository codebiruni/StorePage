/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  AtSign,
  Building,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Gift,
  Home,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useContextData } from "@/defaults/context/Context";
import { uploadImageToR2 } from "@/lib/uploadImage";
import { cn } from "@/lib/utils";

interface IAddress {
  addressName: string;
  district: string;
  city: string;
  addressLine: string;
}

interface IProfileForm {
  name: string;
  username: string;
  email: string;
  number?: string;
  dateOfBirth?: Date;
  address: IAddress[];
  image?: string;
  referralCode?: string;
}

interface IProfileResponse {
  success: boolean;
  data?: {
    name?: string;
    username?: string;
    email?: string;
    number?: string;
    dateOfBirth?: string | null;
    address?: {
      addressName: string;
      district: string;
      city: string;
      addressLine: string;
    }[];
    image?: string;
    referralCode?: string;
  };
}

interface CompleteProfileProps {
  isEdit?: boolean;
}

export default function CompleteProfile({ isEdit: isEditProp = false }: CompleteProfileProps) {
  const searchParams = useSearchParams();
  const isEdit = isEditProp || searchParams?.get("edit") === "1" || searchParams?.get("edit") === "true";
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [verifiedContact, setVerifiedContact] = useState<{ email?: string; number?: string }>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const context = useContextData();
  const handleUser = context?.handleUser;

  const form = useForm<IProfileForm>({
    defaultValues: {
      name: "",
      username: "",
      email: "",
      number: "",
      dateOfBirth: undefined,
      address: [{ addressName: "Home", district: "", city: "", addressLine: "" }],
      image: "",
      referralCode: "",
    },
    mode: "onChange",
  });

  const {
    fields: addressFields,
    append: appendAddress,
    remove: removeAddress,
  } = useFieldArray({
    control: form.control,
    name: "address",
  });

  // Prefill profile when editing, or prefill email/phone from verified account
  useEffect(() => {
    (async () => {
      try {
        if (isEdit) {
          const res = await fetch("/api/v1/profile", {
            method: "GET",
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed to load profile");
          const json: IProfileResponse = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            form.reset({
              name: d.name ?? "",
              username: d.username ?? "",
              email: d.email ?? "",
              number: d.number ?? "",
              dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : undefined,
              address:
                d.address && d.address.length > 0
                  ? d.address.map((a) => ({
                      addressName: a.addressName ?? "Home",
                      district: a.district ?? "",
                      city: a.city ?? "",
                      addressLine: a.addressLine ?? "",
                    }))
                  : [{ addressName: "Home", district: "", city: "", addressLine: "" }],
              image: d.image ?? "",
              referralCode: d.referralCode ?? "",
            });
            return;
          }
        }

        // Onboarding flow: fetch authenticated user account to prefill email/number
        const meRes = await fetch("/api/v1/me", { credentials: "include" });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData?.user) {
            const u = meData.user;
            setVerifiedContact({ email: u.email, number: u.number });
            if (u.email) form.setValue("email", u.email);
            if (u.number) form.setValue("number", u.number);
            if (u.username) form.setValue("username", u.username);
          }
        }
      } catch (err) {
        console.error("Failed to prefill profile", err);
      }
    })();
  }, [isEdit, form]);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, or WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const upload = await uploadImageToR2(file);
      form.setValue("image", upload.publicUrl, { shouldDirty: true });
      toast.success("Profile photo uploaded!");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: IProfileForm) => {
    setIsLoading(true);
    try {
      const formData = {
        ...data,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString() : null,
      };

      const res = await fetch("/api/v1/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Sync context user data
        try {
          const meRes = await fetch("/api/v1/me", { credentials: "include" });
          if (meRes.ok) {
            const meJson = await meRes.json();
            if (meJson?.user && handleUser) {
              handleUser(meJson.user);
            }
          }
        } catch {
          // fallback
        }

        toast.success(isEdit ? "Profile updated successfully!" : "Profile completed! Welcome aboard.");
        router.push("/profile");
      } else {
        const errBody = await res.json().catch(() => ({}));
        console.error("Failed to update profile", res.status, errBody);
        toast.error(errBody.message || "Failed to save profile. Please check all fields.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while saving your profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentAvatar = form.watch("image");
  const currentName = form.watch("name") || "User";
  const nameInitials = currentName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden pb-16 pt-6">
      {/* Subtle background glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-[380px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-3xl px-4 sm:px-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link href={isEdit ? "/profile" : "/"}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground transition -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {isEdit ? "Back to Profile" : "Go to Store"}
            </Button>
          </Link>
          <Badge
            variant="outline"
            className="gap-1.5 px-3 py-1 font-medium bg-background/60 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {isEdit ? "Account Settings" : "Step 3 of 3 · Profile Setup"}
          </Badge>
        </div>

        {/* Header Title */}
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {isEdit ? "Edit Customer Profile" : "Complete Your Profile"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            {isEdit
              ? "Update your personal details, default delivery coordinates, and shipping addresses."
              : "Add your contact details and default delivery address to enable instant checkout and order tracking."}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* ─────────── 1. Avatar Card ─────────── */}
            <Card className="border border-border/60 shadow-sm bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/40">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  Profile Photo
                </CardTitle>
                <CardDescription>
                  Upload a photo so sellers and delivery agents can identify you
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Avatar Frame */}
                  <div className="relative group shrink-0">
                    <Avatar className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-2 border-border shadow-md">
                      <AvatarImage src={currentAvatar} alt={currentName} className="object-cover" />
                      <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary rounded-2xl">
                        {nameInitials}
                      </AvatarFallback>
                    </Avatar>

                    {isUploadingAvatar && (
                      <div className="absolute inset-0 rounded-2xl bg-background/70 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleAvatarFileSelect}
                    />

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2 font-medium"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {currentAvatar ? "Change Photo" : "Upload Photo"}
                      </Button>

                      {currentAvatar ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => form.setValue("image", "", { shouldDirty: true })}
                          className="text-destructive hover:bg-destructive/10 text-xs"
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Square format recommended (at least 300 × 300 px). Max file size 5MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─────────── 2. Personal Information Card ─────────── */}
            <Card className="border border-border/60 shadow-sm bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/40">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your basic identity for billing and invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: "Full name is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Full Name *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="John Doe" {...field} className="h-10 pl-9" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Username */}
                  <FormField
                    control={form.control}
                    name="username"
                    rules={{ required: "Username is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Username *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="johndoe" {...field} className="h-10 pl-9" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email Address */}
                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    validate: (val) => {
                      const num = form.getValues("number");
                      if (!val && !num) {
                        return "Either email or phone number is required";
                      }
                      if (val && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(val)) {
                        return "Invalid email address";
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Email Address {form.watch("number") ? "(Optional)" : "*"}
                        </FormLabel>
                        {verifiedContact.email && verifiedContact.email === field.value ? (
                          <Badge variant="secondary" className="gap-1 text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3 w-3" /> Verified
                          </Badge>
                        ) : null}
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                            className="h-10 pl-9"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Phone Number */}
                  <FormField
                    control={form.control}
                    name="number"
                    rules={{
                      validate: (val) => {
                        const em = form.getValues("email");
                        if (!val && !em) {
                          return "Either phone number or email is required";
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Phone Number {form.watch("email") ? "(Optional)" : "*"}
                          </FormLabel>
                          {verifiedContact.number && verifiedContact.number === field.value ? (
                            <Badge variant="secondary" className="gap-1 text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                              <Check className="h-3 w-3" /> Verified
                            </Badge>
                          ) : null}
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="+8801700000000" {...field} className="h-10 pl-9" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date of Birth */}
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Date of Birth (Optional)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="date"
                              value={
                                field.value ? format(field.value, "yyyy-MM-dd") : ""
                              }
                              onChange={(e) => {
                                const date = e.target.value
                                  ? new Date(e.target.value)
                                  : undefined;
                                field.onChange(date);
                              }}
                              max={new Date().toISOString().split("T")[0]}
                              min="1920-01-01"
                              className="h-10 pl-9"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ─────────── 3. Delivery Addresses Card ─────────── */}
            <Card className="border border-border/60 shadow-sm bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/40 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Delivery Addresses
                  </CardTitle>
                  <CardDescription>
                    Where should we ship your online orders?
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendAddress({
                      addressName: `Address #${addressFields.length + 1}`,
                      district: "",
                      city: "",
                      addressLine: "",
                    })
                  }
                  className="gap-1.5 text-xs font-medium"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Address
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {addressFields.map((fieldItem, index) => (
                  <div
                    key={fieldItem.id}
                    className="p-4 sm:p-5 border border-border/60 rounded-xl bg-muted/20 space-y-4 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {form.watch(`address.${index}.addressName`) || `Address #${index + 1}`}
                        </span>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            Primary Default
                          </Badge>
                        )}
                      </div>

                      {addressFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAddress(index)}
                          className="text-destructive hover:bg-destructive/10 h-8 px-2 text-xs gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Address Name */}
                      <FormField
                        control={form.control}
                        name={`address.${index}.addressName`}
                        rules={{ required: "Address label is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">
                              Label (Home / Office) *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Home className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="Home" {...field} className="h-9 pl-8 text-sm" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* District */}
                      <FormField
                        control={form.control}
                        name={`address.${index}.district`}
                        rules={{ required: "District is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">
                              District / State *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="Dhaka" {...field} className="h-9 pl-8 text-sm" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* City / Thana */}
                      <FormField
                        control={form.control}
                        name={`address.${index}.city`}
                        rules={{ required: "City is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">
                              City / Thana *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="Gulshan" {...field} className="h-9 pl-8 text-sm" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Street / Delivery Line */}
                    <FormField
                      control={form.control}
                      name={`address.${index}.addressLine`}
                      rules={{ required: "Detailed address is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Street, House & Area Details *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="House 12, Road 4, Sector 7..."
                              {...field}
                              className="h-9 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ─────────── 4. Referral Code (Optional) ─────────── */}
            <Card className="border border-border/60 shadow-sm bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  Have a Referral Code?
                </CardTitle>
                <CardDescription className="text-xs">
                  Enter an invitation or referral code to unlock exclusive welcome bonus rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative max-w-sm">
                          <Gift className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="e.g. FRIEND2026"
                            {...field}
                            className="h-10 pl-9 uppercase tracking-wider"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* ─────────── Submit Section ─────────── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-xs text-muted-foreground text-center sm:text-left">
                Your details are encrypted and kept safe according to our Privacy Policy.
              </p>

              <Button
                type="submit"
                disabled={isLoading || isUploadingAvatar}
                className="h-11 px-8 font-semibold shadow-md transition-all active:scale-[0.98] w-full sm:w-auto"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving profile…
                  </span>
                ) : isEdit ? (
                  "Save Changes"
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Profile & Continue
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
