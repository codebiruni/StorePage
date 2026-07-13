import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import ParentNav from "@/defaults/home-nav/ParentNav";
import ParentFooter from "@/defaults/home-footer/ParentFooter";
import AosWrapper from "@/defaults/aos-wrapper/AosWrapper";
import NextTopLoader from "nextjs-toploader";
import Context from "@/defaults/context/Context";
import ThemeProvider from "@/components/theme-provider";
import { Toaster } from "sonner";
import { Suspense } from "react";

import MetaPixel from "@/components/MetaPixel";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import SiteConfigProvider from "@/defaults/context/SiteConfigProvider";
import { getSiteConfig } from "@/lib/siteConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ────────────────────────────────────────────────────────────────────────
// Landing-page typography. The public /step/[id] themes each pick one of
// these via --lp-font-display on their [data-theme] root.
//   --font-display → Fraunces        (editorial serif: Atelier)
//                    Instrument_Serif (luxury serif:  Midnight, Pillar)
//                    Space_Grotesk    (geometric sans: Kinetic, Origin)
// ────────────────────────────────────────────────────────────────────────

const displayFraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const displayInstrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

const displaySpaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/**
 * Build the full Next.js Metadata + Viewport trees from the merged SiteConfig.
 * All values fall back to env defaults when siteInfo is missing a field, so a
 * fresh deployment still produces sensible `<head>` output.
 */
async function buildMetadata() {
  const cfg = await getSiteConfig();
  const ogImage = cfg.logo ? `${cfg.siteUrl}${cfg.logo.startsWith("/") ? cfg.logo : `/${cfg.logo}`}` : `${cfg.siteUrl}/logo.png`;
  const description = cfg.marqueeText || cfg.tagline || "Online store";

  const metadata: Metadata = {
    title: {
      default: cfg.name,
      template: `%s | ${cfg.name}`,
    },
    description,
    applicationName: cfg.name,
    icons: {
      icon: cfg.logo || "/logo.png",
      apple: cfg.logo || "/logo.png",
    },
    openGraph: {
      type: "website",
      title: cfg.name,
      description,
      url: cfg.siteUrl,
      siteName: cfg.name,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: cfg.name,
      description,
      images: [ogImage],
    },
  };

  const viewport: Viewport = {
    themeColor: cfg.themeColor,
    width: "device-width",
    initialScale: 1,
  };

  return { metadata, viewport, cfg };
}

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await buildMetadata();
  return metadata;
}

export async function generateViewport(): Promise<Viewport> {
  const { viewport } = await buildMetadata();
  return viewport;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { cfg } = await buildMetadata();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content={cfg.name} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="apple-mobile-web-app-title" content={cfg.name} />
        <meta name="description" content={cfg.tagline || cfg.marqueeText} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />

        <link rel="apple-touch-icon" href={cfg.logo || "/logo.png"} />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href={cfg.logo || "/logo.png"}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={cfg.logo || "/logo.png"}
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href={cfg.logo || "/logo.png"}
        />

        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={cfg.logo || "/logo.png"}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={cfg.logo || "/logo.png"}
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="mask-icon" href={cfg.logo || "/logo.png"} color={cfg.themeColor} />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={cfg.siteUrl} />
        <meta name="twitter:title" content={cfg.name} />
        <meta
          name="twitter:description"
          content={cfg.tagline || cfg.marqueeText}
        />
        <meta
          name="twitter:image"
          content={`${cfg.siteUrl}${cfg.logo || "/logo.png"}`}
        />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={cfg.name} />
        <meta property="og:description" content={cfg.tagline || cfg.marqueeText} />
        <meta property="og:site_name" content={cfg.name} />
        <meta property="og:url" content={cfg.siteUrl} />
        <meta
          property="og:image"
          content={`${cfg.siteUrl}${cfg.logo || "/logo.png"}`}
        />

        <link
          rel="apple-touch-startup-image"
          href={cfg.logo || "/logo.png"}
          sizes="2048x2732"
        />
        <link
          rel="apple-touch-startup-image"
          href={cfg.logo || "/logo.png"}
          sizes="1668x2224"
        />
        <link
          rel="apple-touch-startup-image"
          href={cfg.logo || "/logo.png"}
          sizes="1536x2048"
        />
        <link
          rel="apple-touch-startup-image"
          href={cfg.logo || "/logo.png"}
          sizes="1125x2436"
        />
        <link
          rel="apple-touch-startup-image"
          href={cfg.logo || "/logo.png"}
          sizes="1242x2208"
        />
        <link
          rel="apple-touch-startup-image"
          href={cfg.logo || "/logo.png"}
          sizes="750x1334"
        />
        <link
          rel="apple-touch-startup-image"
          href={cfg.logo || "/logo.png"}
          sizes="640x1136"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${displayFraunces.variable} ${displayInstrumentSerif.variable} ${displaySpaceGrotesk.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AosWrapper>
            <NextTopLoader
              color={cfg.themeColor}
              showSpinner={true}
              height={3}
              zIndex={99999999999}
            />
            <SiteConfigProvider initialConfig={cfg}>
              <Context>
                <Suspense fallback={null}>
                    <MetaPixel pixelId={cfg.metaPixelId} />
                    <GoogleAnalytics gaId={cfg.gaMeasurementId} />
                </Suspense>

                <Toaster className="z-[999999]" />
                <ParentNav />
                {/* <ChatbotComponent /> */}
                {children}
                <ParentFooter />
              </Context>
            </SiteConfigProvider>
          </AosWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}