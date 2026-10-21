"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Truck,
  CreditCard,
  Headphones,
  Clock,
  MessageCircle,
  Lock,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider";
import BrandLogo from "@/defaults/home-nav/BrandLogo";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-3.04-1.52z" />
    </svg>
  );
}

/**
 * Multi-tenant modern e-commerce footer in English.
 * Reads brand information dynamically from SiteConfigProvider.
 */
export default function ParentFooter() {
  const pathname = usePathname();
  const { config } = useSiteConfig();

  // Landing page funnel (/step/[id]) and administrative dashboard (/dashboard) suppression
  if (pathname?.startsWith("/step") || pathname?.startsWith("/dashboard")) return null;

  const name = config?.name ?? "My Store";
  const tagline =
    config?.tagline ||
    "Your trusted destination for premium quality products, great value, and exceptional shopping experience.";
  const email = config?.contact?.email ?? "";
  const phone = config?.contact?.phone ?? "";
  const facebook = config?.social?.facebook ?? "";
  const instagram = config?.social?.instagram ?? "";
  const linkedIn = config?.social?.linkedIn ?? "";
  const twitter = config?.social?.twitter ?? "";
  const youtube = config?.social?.youtube ?? "";
  const whatsApp = config?.social?.whatsApp ?? "";
  const tiktok = config?.social?.tiktok ?? "";

  const hasSocial = Boolean(
    facebook || instagram || linkedIn || twitter || youtube || whatsApp || tiktok
  );

  return (
    <footer className="w-full bg-background/95 border-t border-border/80 text-foreground transition-colors duration-200">
      {/* 1. Value Proposition & Trust Badges Strip */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Delivery Guarantee */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-card/60 border border-border/60 shadow-xs hover:border-primary/40 hover:bg-card transition-all duration-200">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold tracking-tight">Fast Delivery</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Swift, reliable doorstep shipping across the country.
                </p>
              </div>
            </div>

            {/* Quality Guarantee */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-card/60 border border-border/60 shadow-xs hover:border-primary/40 hover:bg-card transition-all duration-200">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold tracking-tight">100% Genuine</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quality-verified authentic products direct to you.
                </p>
              </div>
            </div>

            {/* Payment Security */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-card/60 border border-border/60 shadow-xs hover:border-primary/40 hover:bg-card transition-all duration-200">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold tracking-tight">Secure Payment</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cash on delivery & encrypted online transactions.
                </p>
              </div>
            </div>

            {/* Customer Support */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-card/60 border border-border/60 shadow-xs hover:border-primary/40 hover:bg-card transition-all duration-200">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Headphones className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold tracking-tight">Dedicated Support</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Prompt customer assistance ready to answer questions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Navigation Grid */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand Info & Mission (Col 1: 4 columns) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <BrandLogo
                brandName={name}
                logoUrl={config?.logo}
                size={40}
                className="!h-10 !w-10"
              />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {tagline}
            </p>

            {/* Operating Hours */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Online Orders Open 24/7</span>
            </div>

            {/* Social Media Links */}
            {hasSocial && (
              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Follow Us
                </h5>
                <div className="flex flex-wrap items-center gap-2">
                  {facebook && (
                    <a
                      href={facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="h-9 w-9 rounded-full border border-border/70 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-colors"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {instagram && (
                    <a
                      href={instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="h-9 w-9 rounded-full border border-border/70 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-colors"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {twitter && (
                    <a
                      href={twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Twitter / X"
                      className="h-9 w-9 rounded-full border border-border/70 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                  {linkedIn && (
                    <a
                      href={linkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                      className="h-9 w-9 rounded-full border border-border/70 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {youtube && (
                    <a
                      href={youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube"
                      className="h-9 w-9 rounded-full border border-border/70 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-colors"
                    >
                      <Youtube className="h-4 w-4" />
                    </a>
                  )}
                  {tiktok && (
                    <a
                      href={tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok"
                      className="h-9 w-9 rounded-full border border-border/70 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-colors"
                    >
                      <TikTokIcon className="h-4 w-4" />
                    </a>
                  )}
                  {whatsApp && (
                    <a
                      href={`https://wa.me/${whatsApp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                      className="h-9 w-9 rounded-full border border-border/70 flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-500/10 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Shop Links (Col 2: 2 columns) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-sm font-bold tracking-tight uppercase text-foreground">
              Shop & Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/products"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  <span>All Products</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/offers"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  <span>Special Offers</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/featured-products"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  <span>Featured Items</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  <span>New Arrivals</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care & Policies (Col 3: 3 columns) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-sm font-bold tracking-tight uppercase text-foreground">
              Customer Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/delivery-information"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  <span>Delivery Information</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/return-policy"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  <span>Returns & Refunds</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about-us"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  <span>About Our Store</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact-us"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  <span>Contact Us</span>
                </Link>
              </li>
              {/* Dynamic Footer Links from Admin */}
              {config?.footerLinks?.map((link, idx) => (
                <li key={`${link?.url ?? "footer-link"}-${idx}`}>
                  <a
                    href={link?.url ?? "#"}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
                  >
                    <ExternalLink className="h-3 w-3 text-muted-foreground/60" />
                    <span>{link?.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details & Addresses (Col 4: 3 columns) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-sm font-bold tracking-tight uppercase text-foreground">
              Contact & Store
            </h4>
            <div className="space-y-3 text-sm">
              {phone && (
                <div className="flex items-start gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5 text-primary">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Customer Hotline</span>
                    <a
                      href={`tel:${phone}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {phone}
                    </a>
                  </div>
                </div>
              )}

              {email && (
                <div className="flex items-start gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5 text-primary">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground block">Email Support</span>
                    <a
                      href={`mailto:${email}`}
                      className="font-medium text-foreground hover:text-primary transition-colors break-all"
                    >
                      {email}
                    </a>
                  </div>
                </div>
              )}

              {/* Physical Store Addresses */}
              {config?.addresses && config.addresses.length > 0 && (
                <div className="flex items-start gap-2.5 pt-1">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5 text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Store Location</span>
                    {config.addresses.map((addr, idx) => (
                      <p key={idx} className="text-xs text-foreground/90 leading-relaxed">
                        {addr.name ? <strong className="font-medium">{addr.name}: </strong> : null}
                        {addr.address}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick WhatsApp Support Trigger */}
              {whatsApp && (
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${whatsApp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-600/20 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Payment Methods & Security Trust Strip */}
        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span>256-Bit SSL Secured Checkout & Confidential Shopping</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
            <span className="px-2.5 py-1 rounded-lg bg-card border border-border/80 shadow-2xs">
              Cash on Delivery (COD)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-card border border-border/80 shadow-2xs">
              bKash / Nagad / Upay
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-card border border-border/80 shadow-2xs">
              Visa / MasterCard
            </span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Copyright Bar */}
      <div className="border-t border-border/60 bg-muted/30">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/return-policy" className="hover:text-foreground transition-colors">
              Return & Refund Policy
            </Link>
            <span>•</span>
            <Link href="/delivery-information" className="hover:text-foreground transition-colors">
              Delivery Information
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
