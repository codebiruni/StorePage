// Classic theme: clean white background, generous spacing, no fancy effects.
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

export default function Classic({
  product,
  landing,
}: {
  product: SerializedLandingProduct;
  landing: ILandingPage;
}) {
  return (
    <>
      <Hero product={product} landing={landing} />
      <PainPoints items={landing.painPoints} />
      <Benefits items={landing.benefits} />
      <HowToUse items={landing.howToUse} />
      <Gallery images={product.images} />
      <Pricing product={product} landing={landing} />
      <TrustBadges product={product} />
      <SocialProof stats={landing.socialProofStats} />
      <Guarantee text={landing.guarantee} />
      <ShowcaseVideo url={landing.youtubeUrl} caption="Watch the product in action" />
      <CheckoutForm product={product} checkoutNote={landing.checkoutNote} />
      <StickyCTA label={landing.heroCtaLabel} productId={product._id} />
      <PhoneWhatsapp />
    </>
  );
}