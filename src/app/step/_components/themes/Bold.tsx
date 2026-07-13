// Bold theme: dark background, oversized typography, neon accents.
import Hero from "../sections/Hero";
import PainPoints from "../sections/PainPoints";
import Benefits from "../sections/Benefits";
import HowToUse from "../sections/HowToUse";
import Gallery from "../sections/Gallery";
import Pricing from "../sections/Pricing";
import TrustBadges from "../sections/TrustBadges";
import SocialProof from "../sections/SocialProof";
import Guarantee from "../sections/Guarantee";
import ShowcaseVideo from "../sections/ShowcaseVideo";
import CheckoutForm from "../sections/CheckoutForm";
import StickyCTA from "../sections/StickyCTA";
import PhoneWhatsapp from "../sections/PhoneWhatsapp";
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";
import type { ILandingPage } from "@/app/step/_lib/landing-shared";

export default function Bold({
  product,
  landing,
}: {
  product: SerializedLandingProduct;
  landing: ILandingPage;
}) {
  return (
    <div data-theme="bold">
      <Hero product={product} landing={landing} />
      <PainPoints items={landing.painPoints} variant="bold" />
      <Benefits items={landing.benefits} variant="bold" />
      <HowToUse items={landing.howToUse} variant="bold" />
      <Gallery images={product.images} variant="bold" />
      <Pricing product={product} landing={landing} variant="bold" />
      <TrustBadges product={product} variant="bold" />
      <SocialProof stats={landing.socialProofStats} variant="bold" />
      <Guarantee text={landing.guarantee} variant="bold" />
      <ShowcaseVideo url={landing.youtubeUrl} variant="bold" caption="দেখুন কিভাবে কাজ করে" />
      <CheckoutForm product={product} checkoutNote={landing.checkoutNote} variant="bold" />
      <StickyCTA label={landing.heroCtaLabel} productId={product._id} variant="bold" />
      <PhoneWhatsapp variant="bold" />
    </div>
  );
}