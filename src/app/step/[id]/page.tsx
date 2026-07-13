// /step/[id] – public single-product landing page. Server component. Reads the
// product via getLandingProduct (cached, tagged with `product:${id}`) and
// hands it to LandingPageRenderer which picks the right theme.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LandingPageRenderer from "@/app/step/_components/LandingPageRenderer";
import {
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
  return <LandingPageRenderer product={product} />;
}