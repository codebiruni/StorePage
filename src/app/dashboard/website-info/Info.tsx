/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Pencil,
  Trash2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Hash,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
  Link2,
  ExternalLink,
  Image as ImageIcon,
  Newspaper,
  Sparkles,
  Copy,
  CalendarClock,
  Layers,
  AlertTriangle,
  Loader2,
  Rocket,
} from "lucide-react";
import WorkspaceHeader from "../_shared/WorkspaceHeader";

interface WebsiteInfo {
  _id: string;
  number: string;
  email: string;
  name: string;
  logo: string;
  banner: {
    firstImage: { image: string; link?: string };
    secondImage: { image: string; link?: string };
    carousel: Array<{ image: string; link?: string; _id: string }>;
  };
  socialContact: {
    facebook: string;
    youtube?: string;
    instagrame?: string;
    linkedIn?: string;
    whatsApp?: string;
    twitter?: string;
  };
  addresses: Array<{ name: string; address: string; _id: string }>;
  mapLink: string;
  footerLinks: Array<{ name: string; url?: string; _id: string }>;
  marqueeText: string;
  createdAt: string;
  updatedAt: string;
}

type SocialKey = keyof WebsiteInfo["socialContact"];

interface SocialMeta {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  ringClass: string;
  hrefPrefix?: (v: string) => string;
}

const SOCIAL_META: Record<SocialKey, SocialMeta> = {
  facebook: {
    label: "Facebook",
    icon: Facebook,
    colorClass: "text-[#1877F2]",
    ringClass: "ring-[#1877F2]/20",
  },
  youtube: {
    label: "YouTube",
    icon: Youtube,
    colorClass: "text-[#FF0000]",
    ringClass: "ring-[#FF0000]/20",
  },
  instagrame: {
    label: "Instagram",
    icon: Instagram,
    colorClass: "text-pink-600",
    ringClass: "ring-pink-600/20",
  },
  linkedIn: {
    label: "LinkedIn",
    icon: Linkedin,
    colorClass: "text-[#0A66C2]",
    ringClass: "ring-[#0A66C2]/20",
  },
  whatsApp: {
    label: "WhatsApp",
    icon: MessageCircle,
    colorClass: "text-emerald-600",
    ringClass: "ring-emerald-600/20",
    hrefPrefix: (v) => (v.startsWith("http") ? v : `https://wa.me/${v.replace(/\D/g, "")}`),
  },
  twitter: {
    label: "Twitter / X",
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="currentColor"
      >
        <path d="M18.244 2H21l-6.52 7.453L22 22h-6.156l-4.82-6.293L5.4 22H2.643l6.973-7.972L2 2h6.31l4.357 5.768L18.244 2Zm-1.08 18h1.705L7.92 4H6.115l11.05 16Z" />
      </svg>
    ),
    colorClass: "text-foreground",
    ringClass: "ring-foreground/20",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeHref(value: string, prefix?: (v: string) => string) {
  if (!value) return "#";
  if (/^https?:\/\//i.test(value)) return value;
  return prefix ? prefix(value) : `https://${value}`;
}

export default function Info() {
  const [data, setData] = useState<WebsiteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/v1/web-info", {
          method: "GET",
          credentials: "include",
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed to fetch website info");
        setData(result.data);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load website info", {
          description:
            error instanceof Error ? error.message : "An unknown error occurred",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/v1/web-info", {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to delete website info");
      toast.success("Website information deleted successfully");
      setData(null);
      setDeleteOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete website info", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => router.push("/dashboard/website-info/edit");

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}`);
    }
  };

  // ---- Derived stats for the overview tab
  const stats = useMemo(() => {
    if (!data) return null;
    const socialCount = Object.values(data.socialContact || {}).filter(Boolean)
      .length;
    const bannerCount =
      (data.banner.firstImage?.image ? 1 : 0) +
      (data.banner.secondImage?.image ? 1 : 0) +
      (data.banner.carousel?.length || 0);
    return [
      {
        label: "Address",
        value: data.addresses?.length ?? 0,
        icon: MapPin,
      },
      {
        label: "Banners",
        value: bannerCount,
        icon: ImageIcon,
      },
      {
        label: "Footer links",
        value: data.footerLinks?.length ?? 0,
        icon: Link2,
      },
      {
        label: "Social channels",
        value: socialCount,
        icon: Globe,
      },
    ];
  }, [data]);

  // ---------------- Loading state ----------------
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading website configuration…</p>
      </div>
    );
  }

  // ---------------- Empty state ----------------
  if (!data) {
    return (
      <div className="mt-6">
        <WorkspaceHeader
          title="Website Information"
          subtitle="Configure the public-facing details of your store"
          badges={["Site Config", "Single Source"]}
          action={
            <Button onClick={() => router.push("/dashboard/website-info/edit")}>
              <Rocket className="h-4 w-4 mr-2" />
              Set up site info
            </Button>
          }
        />
        <Card className="border-dashed mt-6">
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No website info yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Create the brand identity, banners, contact details and social channels
                that power the storefront, footer and contact page.
              </p>
            </div>
            <Button onClick={() => router.push("/dashboard/website-info/edit")}>
              <Pencil className="h-4 w-4 mr-2" />
              Create website info
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -------------------------- Render --------------------------
  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Website Information"
        subtitle="Single source of truth for storefront identity, banners, contacts and policies"
        badges={["Site Config", "Admin View"]}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Delete website information?
                  </DialogTitle>
                  <DialogDescription>
                    This will wipe the current site configuration — name, banners,
                    contacts, addresses, social links, footer and marquee. This
                    action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {isDeleting ? "Deleting…" : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-muted">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="footer">Footer &amp; Misc</TabsTrigger>
        </TabsList>

        {/* ---------------- Overview ---------------- */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Brand identity
                </CardTitle>
                <CardDescription>
                  How the storefront identifies itself across the site.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-6">
                <FieldTile
                  icon={Hash}
                  label="Site name"
                  value={data.name}
                  onCopy={() => copy(data.name, "Site name")}
                />
                <FieldTile
                  icon={Mail}
                  label="Email"
                  value={data.email}
                  href={`mailto:${data.email}`}
                  onCopy={() => copy(data.email, "Email")}
                />
                <FieldTile
                  icon={Phone}
                  label="Phone"
                  value={data.number}
                  href={`tel:${data.number}`}
                  onCopy={() => copy(data.number, "Phone number")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Logo
                </CardTitle>
                <CardDescription>Used in the site header, emails and invoices.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="relative w-40 h-40 rounded-2xl overflow-hidden border bg-muted/40 shadow-inner">
                  <Image
                    src={data.logo}
                    alt="Website logo"
                    fill
                    className="object-contain p-3"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" />
                Announcement marquee
              </CardTitle>
              <CardDescription>
                Scrolling text shown across the top of the storefront.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm italic">
                “{data.marqueeText}”
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Branding ---------------- */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Logo
              </CardTitle>
              <CardDescription>
                Visible in the header, footer, emails and PDF invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-start gap-6">
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden border bg-muted/40 shadow-inner">
                <Image
                  src={data.logo}
                  alt="Website logo"
                  fill
                  className="object-contain p-3"
                />
              </div>
              <div className="flex-1 space-y-3">
                <FieldRow label="File URL" value={data.logo} mono onCopy={() => copy(data.logo, "Logo URL")} />
                <p className="text-xs text-muted-foreground">
                  Open the edit screen to replace the logo.
                </p>
                <Button variant="outline" onClick={handleEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Update logo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Banners ---------------- */}
        <TabsContent value="banners" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <BannerCard
              label="First Banner"
              image={data.banner.firstImage.image}
              link={data.banner.firstImage.link}
              onCopyLink={() =>
                data.banner.firstImage.link && copy(data.banner.firstImage.link, "Banner link")
              }
            />
            <BannerCard
              label="Second Banner"
              image={data.banner.secondImage.image}
              link={data.banner.secondImage.link}
              onCopyLink={() =>
                data.banner.secondImage.link && copy(data.banner.secondImage.link, "Banner link")
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Carousel banners
                <Badge variant="secondary" className="ml-1">
                  {data.banner.carousel?.length || 0}
                </Badge>
              </CardTitle>
              <CardDescription>
                Slides that rotate on the home page hero.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {data.banner.carousel?.length ? (
                    data.banner.carousel.map((item, index) => (
                      <div
                        key={item._id}
                        className="relative w-64 h-32 rounded-xl overflow-hidden border bg-muted/40 shrink-0 group"
                      >
                        <Image
                          src={item.image}
                          alt={`Carousel image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 text-white">
                          <p className="text-xs font-medium">Slide {index + 1}</p>
                          {item.link && (
                            <a
                              href={safeHref(item.link)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs inline-flex items-center gap-1 hover:underline truncate max-w-full"
                            >
                              <Link2 className="h-3 w-3" />
                              {item.link}
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No carousel slides yet.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Social ---------------- */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Social channels
              </CardTitle>
              <CardDescription>
                Profiles rendered in the footer, contact page and share dialogs.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(SOCIAL_META) as SocialKey[]).map((key) => {
                const value = data.socialContact?.[key];
                if (!value) return null;
                const meta = SOCIAL_META[key];
                const Icon = meta.icon;
                const href = safeHref(value, meta.hrefPrefix);
                return (
                  <div
                    key={key}
                    className={`group rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`h-10 w-10 rounded-lg ring-1 ${meta.ringClass} bg-background flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${meta.colorClass}`} />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copy(value, meta.label)}
                        title={`Copy ${meta.label}`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {meta.label}
                      </p>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline break-all inline-flex items-center gap-1"
                      >
                        {value}
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                      </a>
                    </div>
                  </div>
                );
              })}
              {Object.values(data.socialContact || {}).filter(Boolean).length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">
                  No social channels configured.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Locations ---------------- */}
        <TabsContent value="locations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Addresses
                <Badge variant="secondary" className="ml-1">
                  {data.addresses?.length || 0}
                </Badge>
              </CardTitle>
              <CardDescription>Physical locations listed on the contact page.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {data.addresses?.length ? (
                data.addresses.map((address) => (
                  <div
                    key={address._id}
                    className="rounded-xl border bg-muted/30 p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2 text-primary">
                      <MapPin className="h-4 w-4" />
                      <p className="font-medium">{address.name}</p>
                    </div>
                    <Separator className="my-2" />
                    <p className="text-sm whitespace-pre-line text-foreground/90">
                      {address.address}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground col-span-full">
                  No addresses configured.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Map
              </CardTitle>
              <CardDescription>
                Embedded location shown on the contact page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.mapLink ? (
                <div className="rounded-xl overflow-hidden border bg-muted/20">
                  <iframe
                    src={data.mapLink}
                    width="100%"
                    height="320"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Store location"
                    className="w-full"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No map link configured.</p>
              )}
              {data.mapLink && (
                <FieldRow label="Map URL" value={data.mapLink} mono onCopy={() => copy(data.mapLink, "Map URL")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Footer & Misc ---------------- */}
        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Footer links
                <Badge variant="secondary" className="ml-1">
                  {data.footerLinks?.length || 0}
                </Badge>
              </CardTitle>
              <CardDescription>
                Quick links rendered at the bottom of the storefront.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.footerLinks?.length ? (
                <div className="flex flex-wrap gap-2">
                  {data.footerLinks.map((link) => (
                    <a
                      key={link._id}
                      href={safeHref(link.url || "#")}
                      target={link.url ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary text-secondary-foreground px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 transition-colors"
                    >
                      {link.name}
                      {link.url && <ExternalLink className="h-3 w-3 opacity-70" />}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No footer links configured.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" />
                Marquee text
              </CardTitle>
              <CardDescription>Scrolling announcement rendered site-wide.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm italic">
                “{data.marqueeText}”
              </div>
              <FieldRow label="Plain text" value={data.marqueeText} onCopy={() => copy(data.marqueeText, "Marquee text")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                Metadata
              </CardTitle>
              <CardDescription>Audit timestamps for the current configuration.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <FieldTile icon={CalendarClock} label="Created" value={formatDate(data.createdAt)} />
              <FieldTile icon={CalendarClock} label="Last updated" value={formatDate(data.updatedAt)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============== Internal presentational helpers ==============

function FieldTile({
  icon: Icon,
  label,
  value,
  href,
  onCopy,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  onCopy?: () => void;
  mono?: boolean;
}) {
  return (
    <div className="group rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <p className="text-xs uppercase tracking-wide">{label}</p>
        </div>
        {onCopy && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onCopy}
            title={`Copy ${label.toLowerCase()}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {href ? (
        <a
          href={href}
          className="text-sm font-medium mt-2 inline-block hover:underline break-all"
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noopener noreferrer"
        >
          {value}
        </a>
      ) : (
        <p className={`text-sm font-medium mt-2 break-all ${mono ? "font-mono text-xs" : ""}`}>
          {value}
        </p>
      )}
    </div>
  );
}

function FieldRow({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md bg-muted px-2 py-1.5 text-xs font-mono">
          {value}
        </code>
        {onCopy && (
          <Button variant="outline" size="sm" onClick={onCopy}>
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy
          </Button>
        )}
      </div>
    </div>
  );
}

function BannerCard({
  label,
  image,
  link,
  onCopyLink,
}: {
  label: string;
  image?: string;
  link?: string;
  onCopyLink?: () => void;
}) {
  if (!image) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          <ImageIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
          {label} not configured
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
        {link && (
          <CardDescription>
            <a
              href={safeHref(link)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs inline-flex items-center gap-1 hover:underline break-all"
            >
              <Link2 className="h-3 w-3" />
              {link}
            </a>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative aspect-[2/1] rounded-xl overflow-hidden border bg-muted/30">
          <Image src={image} alt={label} fill className="object-cover" />
        </div>
        {link && onCopyLink && (
          <Button variant="outline" size="sm" onClick={onCopyLink}>
            <Copy className="h-3.5 w-3.5 mr-2" />
            Copy link
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
