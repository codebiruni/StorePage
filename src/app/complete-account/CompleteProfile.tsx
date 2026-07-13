"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";
import { Plus, Trash2, User, ArrowLeft } from "lucide-react";
import SingleImageUpload from "@/shired-component/SingleImageUpload";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LogedUser from "@/defaults/functions/LogedUser";

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

const CompleteProfile = ({ isEdit = false }: CompleteProfileProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<IProfileForm>({
    defaultValues: {
      name: "",
      username: "",
      email: "",
      number: "",
      dateOfBirth: undefined,
      address: [{ addressName: "", district: "", city: "", addressLine: "" }],
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

  // Prefill when in edit mode
  useEffect(() => {
    if (!isEdit) return;

    (async () => {
      try {
        const res = await fetch("/api/v1/profile", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load profile");
        const json: IProfileResponse = await res.json();
        if (!json.success || !json.data) return;

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
                  addressName: a.addressName ?? "",
                  district: a.district ?? "",
                  city: a.city ?? "",
                  addressLine: a.addressLine ?? "",
                }))
              : [{ addressName: "", district: "", city: "", addressLine: "" }],
          image: d.image ?? "",
          referralCode: d.referralCode ?? "",
        });
      } catch (err) {
        console.error("Failed to prefill profile", err);
      }
    })();
  }, [isEdit, form]);

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
        await LogedUser();
        router.push("/profile");
      } else {
        const errBody = await res.json().catch(() => ({}));
        console.error("Failed to update profile", res.status, errBody);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto pb-10 pt-2 mt-6 max-w-4xl px-4">
      <div className="flex justify-between items-center mb-6">
        <Link href={isEdit ? "/profile" : "/"}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {isEdit ? "Back to Profile" : "Go Home"}
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEdit ? "Edit Your Profile" : "Complete Your Profile"}
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit
              ? "Update your personal information — changes save instantly."
              : "Fill in your details to access all features."}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Personal Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      rules={{ required: "Name is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="username"
                      rules={{ required: "Username is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    rules={{
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="john@example.com"
                            {...field}
                            className="bg-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={
                                field.value
                                  ? format(field.value, "yyyy-MM-dd")
                                  : ""
                              }
                              onChange={(e) => {
                                const date = e.target.value
                                  ? new Date(e.target.value)
                                  : undefined;
                                field.onChange(date);
                              }}
                              max={new Date().toISOString().split("T")[0]}
                              min="1900-01-01"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Profile Image */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Profile Image</h3>
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <SingleImageUpload
                            value={field.value}
                            onUpload={(url: string) => field.onChange(url)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Addresses */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Addresses</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendAddress({
                          addressName: "",
                          district: "",
                          city: "",
                          addressLine: "",
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Address
                    </Button>
                  </div>

                  {addressFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 border rounded-lg space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`address.${index}.addressName`}
                          rules={{ required: "Address name is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Home, Work, etc."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`address.${index}.city`}
                          rules={{ required: "City is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="New York" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`address.${index}.district`}
                          rules={{ required: "District is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>District</FormLabel>
                              <FormControl>
                                <Input placeholder="Manhattan" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`address.${index}.addressLine`}
                          rules={{ required: "Address line is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main St" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {addressFields.length > 1 && (
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAddress(index)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Referral */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Referral Information</h3>
                  <FormField
                    control={form.control}
                    name="referralCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referral Code (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter referral code"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading
                      ? "Saving..."
                      : isEdit
                      ? "Save Changes"
                      : "Save Profile"}
                  </Button>
                </div>
              </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
