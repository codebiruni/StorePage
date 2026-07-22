/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Loader2,
  Hash,
  Mail,
  Phone,
  Globe,
  MapPin,
  Link2,
  Newspaper,
  Image as ImageIcon,
  Layers,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
  BarChart3,
  X as XIcon,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import SingleImageUpload from "@/shired-component/SingleImageUpload";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import WorkspaceHeader from "../../_shared/WorkspaceHeader";

type SocialKey =
  | "facebook"
  | "youtube"
  | "instagrame"
  | "linkedIn"
  | "whatsApp"
  | "twitter";

interface SocialMeta {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  ringClass: string;
  placeholder: string;
  required?: boolean;
}

const SOCIAL_META: Record<SocialKey, SocialMeta> = {
  facebook: {
    label: "Facebook",
    icon: Facebook,
    colorClass: "text-[#1877F2]",
    ringClass: "ring-[#1877F2]/20 bg-[#1877F2]/5",
    placeholder: "https://facebook.com/yourpage",
    required: true,
  },
  youtube: {
    label: "YouTube",
    icon: Youtube,
    colorClass: "text-[#FF0000]",
    ringClass: "ring-[#FF0000]/20 bg-[#FF0000]/5",
    placeholder: "https://youtube.com/@yourchannel",
  },
  instagrame: {
    label: "Instagram",
    icon: Instagram,
    colorClass: "text-pink-600",
    ringClass: "ring-pink-600/20 bg-pink-600/5",
    placeholder: "https://instagram.com/yourhandle",
  },
  linkedIn: {
    label: "LinkedIn",
    icon: Linkedin,
    colorClass: "text-[#0A66C2]",
    ringClass: "ring-[#0A66C2]/20 bg-[#0A66C2]/5",
    placeholder: "https://linkedin.com/company/yourco",
  },
  whatsApp: {
    label: "WhatsApp",
    icon: MessageCircle,
    colorClass: "text-emerald-600",
    ringClass: "ring-emerald-600/20 bg-emerald-600/5",
    placeholder: "+8801XXXXXXXXX",
  },
  twitter: {
    label: "Twitter / X",
    icon: XIcon,
    colorClass: "text-foreground",
    ringClass: "ring-foreground/20 bg-foreground/5",
    placeholder: "https://x.com/yourhandle",
  },
};

interface CarouselItem {
  image: string;
  link?: string;
}
interface AddressItem {
  name: string;
  address: string;
}
interface FooterLinkItem {
  name: string;
  url?: string;
}

interface FormValues {
  number: string;
  email: string;
  name: string;
  logo: string;
  banner: {
    carousel: CarouselItem[];
    firstImage: { image: string; link?: string };
    secondImage: { image: string; link?: string };
  };
  socialContact: {
    facebook: string;
    youtube?: string;
    instagrame?: string;
    linkedIn?: string;
    whatsApp?: string;
    twitter?: string;
    other?: string;
  };
  addresses: AddressItem[];
  mapLink: string;
  footerLinks: FooterLinkItem[];
  marqueeText: string;
  metaPixelId?: string;
  gaMeasurementId?: string;
}

function safeHref(value: string) {
  if (!value) return "#";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export default function EditInfo() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const form = useForm<FormValues>({
    defaultValues: {
      number: "",
      email: "",
      name: "",
      logo: "",
      banner: {
        carousel: [{ image: "", link: "" }],
        firstImage: { image: "", link: "" },
        secondImage: { image: "", link: "" },
      },
      socialContact: {
        facebook: "",
        youtube: "",
        instagrame: "",
        linkedIn: "",
        whatsApp: "",
        twitter: "",
      },
      addresses: [{ name: "", address: "" }],
      mapLink: "",
      footerLinks: [{ name: "", url: "" }],
      marqueeText: "",
      metaPixelId: "",
      gaMeasurementId: "",
    },
    mode: "onChange",
  });

  const {
    fields: carouselFields,
    append: appendCarousel,
    remove: removeCarousel,
  } = useFieldArray({ control: form.control, name: "banner.carousel" });

  const {
    fields: addressFields,
    append: appendAddress,
    remove: removeAddress,
  } = useFieldArray({ control: form.control, name: "addresses" });

  const {
    fields: footerFields,
    append: appendFooter,
    remove: removeFooter,
  } = useFieldArray({ control: form.control, name: "footerLinks" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/v1/web-info", {
          method: "GET",
          credentials: "include",
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message || "Failed to fetch website info");
        }
        const fetchedData = result.data;
        form.reset({
          number: fetchedData.number || "",
          email: fetchedData.email || "",
          name: fetchedData.name || "",
          logo: fetchedData.logo || "",
          banner: {
            carousel:
              fetchedData.banner?.carousel?.length
                ? fetchedData.banner.carousel.map((item: any) => ({
                    image: item.image,
                    link: item.link || "",
                  }))
                : [{ image: "", link: "" }],
            firstImage: {
              image: fetchedData.banner.firstImage.image,
              link: fetchedData.banner.firstImage.link || "",
            },
            secondImage: {
              image: fetchedData.banner.secondImage.image,
              link: fetchedData.banner.secondImage.link || "",
            },
          },
          socialContact: {
            facebook: fetchedData.socialContact.facebook || "",
            youtube: fetchedData.socialContact.youtube || "",
            instagrame: fetchedData.socialContact.instagrame || "",
            linkedIn: fetchedData.socialContact.linkedIn || "",
            whatsApp: fetchedData.socialContact.whatsApp || "",
            twitter: fetchedData.socialContact.twitter || "",
          },
          addresses:
            fetchedData.addresses?.length
              ? fetchedData.addresses.map((address: any) => ({
                  name: address.name,
                  address: address.address,
                }))
              : [{ name: "", address: "" }],
          mapLink: fetchedData.mapLink || "",
          footerLinks:
            fetchedData.footerLinks?.length
              ? fetchedData.footerLinks.map((link: any) => ({
                  name: link.name,
                  url: link.url || "",
                }))
              : [{ name: "", url: "" }],
          marqueeText: fetchedData.marqueeText || "",
          metaPixelId: fetchedData.metaPixelId || "",
          gaMeasurementId: fetchedData.gaMeasurementId || "",
        });
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load website info", {
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [form]);

  const validateForm = (data: FormValues) => {
    const errors: Record<string, string> = {};

    if (!data.name) errors.name = "Website name is required";
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errors.email = "Valid email is required";
    if (!data.number) errors.number = "Phone number is required";
    if (!data.logo) errors.logo = "Logo is required";
    if (!data.banner.firstImage.image)
      errors["banner.firstImage.image"] = "First banner image is required";
    if (!data.banner.secondImage.image)
      errors["banner.secondImage.image"] = "Second banner image is required";
    if (!data.socialContact.facebook)
      errors["socialContact.facebook"] = "Facebook link is required";
    if (!data.mapLink) errors.mapLink = "Map link is required";
    if (!data.marqueeText) errors.marqueeText = "Marquee text is required";

    data.addresses.forEach((address, index) => {
      if (!address.name)
        errors[`addresses.${index}.name`] = "Address name is required";
      if (!address.address)
        errors[`addresses.${index}.address`] = "Address is required";
    });

    data.footerLinks.forEach((link, index) => {
      if (!link.name)
        errors[`footerLinks.${index}.name`] = "Link name is required";
    });

    data.banner.carousel.forEach((carousel, index) => {
      if (!carousel.image)
        errors[`banner.carousel.${index}.image`] = `Carousel image ${
          index + 1
        } is required`;
    });

    return errors;
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/web-info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update website info");
      }
      toast.success("Website information updated successfully");
      router.push("/dashboard/website-info");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to update website info", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (data: FormValues) => {
    const errors = validateForm(data);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        form.setError(field as keyof FormValues, { type: "manual", message });
      });
      toast.error("Please fill all required fields correctly");
      return;
    }
    await onSubmit(data);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading current configuration…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Edit Website Information"
        subtitle="Update the public-facing details of your store"
        badges={["Editing", "Site Config"]}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/website-info")}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              form="website-info-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        }
      />

      <Form {...form}>
        <form
          id="website-info-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="banners">Banners</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="footer">Footer &amp; Misc</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Brand Identity
                  </CardTitle>
                  <CardDescription>
                    Core public details customers see first
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" /> Website Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Store name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" /> Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+8801…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" /> Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="hello@store.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="marqueeText"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="flex items-center gap-2">
                          <Newspaper className="h-4 w-4" /> Marquee Text
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder="Free shipping on orders over ৳2,000"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Scrolling announcement shown across the site
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* BRANDING */}
            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Logo
                  </CardTitle>
                  <CardDescription>
                    Upload your brand logo (PNG/SVG recommended)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                              <Input placeholder="https://…" {...field} />
                              <SingleImageUpload
                                onUpload={(url: string) => field.onChange(url)}
                              />
                            </div>
                            {field.value && (
                              <div className="relative h-28 w-28 rounded-md overflow-hidden border bg-muted/30 flex items-center justify-center">
                                <NextImage
                                  src={field.value}
                                  alt="Logo preview"
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* BANNERS */}
            <TabsContent value="banners" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>First Banner</CardTitle>
                    <CardDescription>Top hero area image</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FormField
                      control={form.control}
                      name="banner.firstImage.image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex-1 space-y-2">
                                <Input placeholder="https://…" {...field} />
                                <SingleImageUpload
                                  onUpload={(url: string) => field.onChange(url)}
                                />
                              </div>
                              {field.value && (
                                <div className="relative h-24 w-32 rounded-md overflow-hidden border bg-muted/30">
                                  <NextImage
                                    src={field.value}
                                    alt="First banner preview"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Second Banner</CardTitle>
                    <CardDescription>Secondary promo image</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FormField
                      control={form.control}
                      name="banner.secondImage.image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex-1 space-y-2">
                                <Input placeholder="https://…" {...field} />
                                <SingleImageUpload
                                  onUpload={(url: string) => field.onChange(url)}
                                />
                              </div>
                              {field.value && (
                                <div className="relative h-24 w-32 rounded-md overflow-hidden border bg-muted/30">
                                  <NextImage
                                    src={field.value}
                                    alt="Second banner preview"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        Carousel
                      </CardTitle>
                      <CardDescription>
                        Sliding banner images shown on the homepage
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendCarousel({ image: "", link: "" })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add slide
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {carouselFields.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      No carousel slides yet. Add one to get started.
                    </p>
                  )}
                  {carouselFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Slide {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCarousel(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name={`banner.carousel.${index}.image`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel>Image URL</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="https://…"
                                    {...f}
                                  />
                                </FormControl>
                                <SingleImageUpload
                                  onUpload={(url: string) => f.onChange(url)}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`banner.carousel.${index}.link`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel>Link</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="/products/…"
                                    {...f}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SOCIAL */}
            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-primary" />
                    Social Channels
                  </CardTitle>
                  <CardDescription>
                    Link the social accounts that appear in the footer
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {(Object.keys(SOCIAL_META) as SocialKey[]).map((key) => {
                    const meta = SOCIAL_META[key];
                    const Icon = meta.icon;
                    return (
                      <div
                        key={key}
                        className={`rounded-xl border p-4 ring-1 ring-inset ${meta.ringClass}`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-background ${meta.colorClass}`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold">
                              {meta.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {meta.placeholder}
                            </p>
                          </div>
                        </div>
                        <FormField
                          control={form.control}
                          name={`socialContact.${key}` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder={meta.placeholder}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    );
                  })}
                  <FormField
                    control={form.control}
                    name="socialContact.other"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <XIcon className="h-4 w-4" /> Other (X, TikTok…)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* LOCATIONS */}
            <TabsContent value="locations" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Store Addresses
                      </CardTitle>
                      <CardDescription>
                        Physical locations shown to shoppers
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendAddress({ name: "", address: "" })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add address
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addressFields.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      No addresses added yet.
                    </p>
                  )}
                  {addressFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Address {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAddress(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.name`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Main Branch" {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.address`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Full Address</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={2}
                                placeholder="House, Road, City"
                                {...f}
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Google Map
                  </CardTitle>
                  <CardDescription>
                    Embedded map URL for the primary location
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="mapLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Map embed / share link</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://maps.google.com/…"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* FOOTER & MISC */}
            <TabsContent value="footer" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-primary" />
                        Footer Links
                      </CardTitle>
                      <CardDescription>
                        Custom links shown in the footer column
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendFooter({ name: "", url: "" })}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add link
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {footerFields.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      No footer links yet.
                    </p>
                  )}
                  {footerFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-lg border p-4 grid gap-3 sm:grid-cols-2"
                    >
                      <FormField
                        control={form.control}
                        name={`footerLinks.${index}.name`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Label</FormLabel>
                            <FormControl>
                              <Input placeholder="Return Policy" {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`footerLinks.${index}.url`}
                          render={({ field: f }) => (
                            <FormItem className="flex-1">
                              <FormLabel>URL</FormLabel>
                              <FormControl>
                                <Input placeholder="/return-policy" {...f} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFooter(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ANALYTICS */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Tracking IDs
                  </CardTitle>
                  <CardDescription>
                    Optional IDs for analytics and marketing pixels
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="metaPixelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Pixel ID</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gaMeasurementId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Analytics ID</FormLabel>
                        <FormControl>
                          <Input placeholder="G-XXXXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}