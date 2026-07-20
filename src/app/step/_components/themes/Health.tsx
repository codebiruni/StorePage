"use client";

/**
 * Health — high-contrast single-product funnel that mirrors the reference
 * demo6 HTML one-to-one. Renders `HealthPage`, a self-contained module that
 * composes header / hero / benefits / video / comparison / phone CTA /
 * order form / footer in a single pass. Sticky CTA + floating WhatsApp
 * shortcuts sit on top of it.
 *
 * The renderer auto-mounts this when `landingPage.theme === "health"`.
 */

import HealthPage from "./HealthPage";
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";

interface Props {
  product: SerializedLandingProduct;
  /** Slug for checkout anchor and StickyCTA links. */
  slug: string;
}

export default function Health({ product, slug }: Props) {
  return <HealthPage product={product} slug={slug} />;
}
