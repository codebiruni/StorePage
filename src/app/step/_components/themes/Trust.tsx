// Trust theme: soft pastel, lots of social-proof emphasis, testimonial-first.
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

export default function Trust({
  product,
  landing,
}: {
  product: SerializedLandingProduct;
  landing: ILandingPage;
}) {
  return (
    <div data-theme="trust">
      <Hero product={product} landing={landing} />
      <TrustBadges product={product} variant="trust" />
      <SocialProof stats={landing.socialProofStats} variant="trust" />
      <PainPoints items={landing.painPoints} variant="trust" />
      <Benefits items={landing.benefits} variant="trust" />
      <HowToUse items={landing.howToUse} variant="trust" />
      <Gallery images={product.images} variant="trust" />
      <Pricing product={product} landing={landing} variant="trust" />
      <Guarantee text={landing.guarantee} variant="trust" />
      <ShowcaseVideo url={landing.youtubeUrl} variant="trust" caption="Customer reviews in their own words" />
      <CheckoutForm product={product} checkoutNote={landing.checkoutNote} variant="trust" />
      <StickyCTA label={landing.heroCtaLabel} productId={product._id} variant="trust" />
      <PhoneWhatsapp variant="trust" />
    </div>
  );
}