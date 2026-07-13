"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  ShieldCheck,
  Truck,
  CreditCard,
} from "lucide-react";
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider";

/**
 * Multi-tenant footer. Reads brand fields from the SiteConfig context (which
 * is fed from `getSiteConfig()` on the server and refreshed via
 * `/api/site-info` on the client). Every field uses optional chaining so a
 * freshly-deployed client with an empty siteInfo document still renders
 * cleanly — see docs/DATA_RULES.md.
 */
export default function ParentFooter() {
  // Same landing-funnel suppression as ParentNav: /step/[id] pages render
  // without site chrome. See ParentNav for the rationale.
  // Hooks must be called unconditionally before any early return.
  const pathname = usePathname();
  const { config } = useSiteConfig();

  if (pathname?.startsWith("/step")) return null;

  const name = config?.name ?? "My Store";
  const tagline =
    config?.tagline ?? "Providing high quality products with fast delivery.";
  const email = config?.contact?.email ?? "";
  const phone = config?.contact?.phone ?? "";
  const facebook = config?.social?.facebook ?? "";
  const instagram = config?.social?.instagram ?? "";
  const linkedIn = config?.social?.linkedIn ?? "";
  const twitter = config?.social?.twitter ?? "";
  const youtube = config?.social?.youtube ?? "";
  const whatsApp = config?.social?.whatsApp ?? "";
  const addressText =
    config?.addresses && config.addresses.length > 0
      ? config.addresses
          .map((a) => a?.name && a?.address ? `${a.name}: ${a.address}` : (a?.address ?? a?.name ?? ""))
          .filter(Boolean)
          .join(" \u00b7 ")
      : "";

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Shop Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              {name}
            </h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">{tagline}</p>
            <div className="flex space-x-4">
              {facebook && (
                <Button variant="ghost" size="icon" className="rounded-full">
                  <a href={facebook} target="_blank" rel="noreferrer">
                    <Facebook className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {twitter && (
                <Button variant="ghost" size="icon" className="rounded-full">
                  <a href={twitter} target="_blank" rel="noreferrer">
                    <Twitter className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {instagram && (
                <Button variant="ghost" size="icon" className="rounded-full">
                  <a href={instagram} target="_blank" rel="noreferrer">
                    <Instagram className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {linkedIn && (
                <Button variant="ghost" size="icon" className="rounded-full">
                  <a href={linkedIn} target="_blank" rel="noreferrer">
                    <Linkedin className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {youtube && (
                <Button variant="ghost" size="icon" className="rounded-full">
                  <a href={youtube} target="_blank" rel="noreferrer">
                    <Youtube className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {whatsApp && (
                <Button variant="ghost" size="icon" className="rounded-full">
                  <a
                    href={`https://wa.me/${whatsApp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link
                  href="/contact-us"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                >
                  Contact
                </Link>
              </li>
              {config?.footerLinks?.map((link, idx) => (
                <li key={`${link?.url ?? "link"}-${idx}`}>
                  <a
                    href={link?.url ?? "#"}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                  >
                    {link?.name ?? ""}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/return-policy"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                >
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              {addressText && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 mt-0.5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {addressText}
                  </span>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {phone}
                  </span>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {email}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <Truck className="w-6 h-6 text-purple-600" />
            <div>
              <h4 className="font-medium">Free Shipping</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                On offers products
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <CreditCard className="w-6 h-6 text-purple-600" />
            <div>
              <h4 className="font-medium">Secure Payment</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                100% secure payment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <div>
              <h4 className="font-medium">Quality Products</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Guaranteed quality
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <Phone className="w-6 h-6 text-purple-600" />
            <div>
              <h4 className="font-medium">24/7 Support</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dedicated support
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4 bg-gray-300 dark:bg-gray-700" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link
              href="/privacy-policy"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Privacy Policy
            </Link>
            <a
              href="#"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cookies Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
