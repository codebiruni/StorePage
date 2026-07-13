// Minimal theme: monochrome, large whitespace, single accent color.
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

export default function Minimal({
  product,
  landing,
}: {
  product: SerializedLandingProduct;
  landing: ILandingPage;
}) {
  return (
    <div data-theme="minimal">
      <Hero product={product} landing={landing} />
      <PainPoints items={landing.painPoints} variant="minimal" />
      <Benefits items={landing.benefits} variant="minimal" />
      <Gallery images={product.images} variant="minimal" />
      <HowToUse items={landing.howToUse} variant="minimal" />
      <Pricing product={product} landing={landing} variant="minimal" />
      <ShowcaseVideo url={landing.youtubeUrl} variant="minimal" caption="A short look" />
      <CheckoutForm product={product} checkoutNote={landing.checkoutNote} variant="minimal" />
      <StickyCTA label={landing.heroCtaLabel} productId={product._id} variant="minimal" />
      <PhoneWhatsapp variant="minimal" />
    </div>
  );
}