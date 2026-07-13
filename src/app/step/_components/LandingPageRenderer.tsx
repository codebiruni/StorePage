"use client";
// Theme dispatcher. Each theme is its own chunk so a landing page only
// ships the JS for the theme it actually uses.
//
// Themes:
//   • atelier   — editorial serif, newsprint warm whites
//   • midnight  — dark editorial luxury, champagne accent
//   • kinetic   — bold sans, mono eyebrows, motion-led
//   • pillar    — trust-led serif, founder voice
//   • origin    — minimal monochrome, single accent
//
// Legacy themes (classic / bold / trust / minimal / videoHero) are
// resolved to the closest modern theme via `resolveLandingTheme`.

import dynamic from "next/dynamic";
import type { SerializedLandingProduct } from "../_lib/landing-data";
import { resolveLandingTheme } from "@/interface/product.interface";

// Eager-load Atelier as the safe default — it ships with the bundle so a
// bad/missing theme still renders something intentional.
import Atelier from "./themes/Atelier";

// The rest are split out so each page only downloads the chunk it needs.
const Midnight = dynamic(() => import("./themes/Midnight"));
const Kinetic = dynamic(() => import("./themes/Kinetic"));
const Pillar = dynamic(() => import("./themes/Pillar"));
const Origin = dynamic(() => import("./themes/Origin"));

export default function LandingPageRenderer({
  product,
}: {
  product: SerializedLandingProduct;
}) {
  const rawTheme = product.landingPage?.theme ?? "atelier";
  const theme = resolveLandingTheme(rawTheme);
  const slug = product.slug || product._id;

  switch (theme) {
    case "midnight":
      return <Midnight product={product} slug={slug} />;
    case "kinetic":
      return <Kinetic product={product} slug={slug} />;
    case "pillar":
      return <Pillar product={product} slug={slug} />;
    case "origin":
      return <Origin product={product} slug={slug} />;
    case "atelier":
    default:
      return <Atelier product={product} slug={slug} />;
  }
}