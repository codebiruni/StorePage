"use client";
// Theme dispatcher. Only the Health theme ships now; other legacy theme
// values persisted in older products are normalized to "health" via
// `resolveLandingTheme` so any saved page still renders.

import { type SerializedLandingProduct } from "../_lib/landing-shared";
import Health from "./themes/Health";

export default function LandingPageRenderer({
  product,
}: {
  product: SerializedLandingProduct;
}) {
  const slug = product.slug || product._id;
  return <Health product={product} slug={slug} />;
}