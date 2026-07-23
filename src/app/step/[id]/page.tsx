// /step/[id] – public single-product landing page. Server component. Reads the
// product via getLandingProduct (cached, tagged with `product:${id}`) and
// hands it to StepPreviewBridge which dispatches by section type.
//
// StepPreviewBridge is a client wrapper around LandingPageRenderer that
// additionally listens for `landing-draft` postMessage events from the
// dashboard landing-page editor so the iframe mirror can reflect unsaved
// edits. Real visitors never post messages, so they see exactly the saved
// state with zero behavioural change.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import StepPreviewBridge from "@/app/step/_components/StepPreviewBridge";
import {
  buildLandingConfig,
  getLandingProduct,
  listAllProductIds,
} from "@/app/step/_lib/landing-data";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const ids = await listAllProductIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getLandingProduct(id);
  if (!product) {
    return { title: "Product not found" };
  }
  const og = product.images?.[0];
  return {
    title: product.name,
    description: product.details?.slice(0, 160) ?? product.name,
    openGraph: og
      ? {
          title: product.name,
          description: product.details?.slice(0, 160) ?? product.name,
          images: [og],
        }
      : undefined,
  };
}

export default async function StepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getLandingProduct(id);
  if (!product) notFound();
  const config = buildLandingConfig(product);
  if (!config.enabled) notFound();
  return (
    <StepPreviewBridge
      productId={id}
      initialConfig={config}
      product={product}
    />
  );
}