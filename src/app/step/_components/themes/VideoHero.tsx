// VideoHero theme: VSL-first — the entire page collapses if there's no
// `vslUrl` because the hero *is* the video. A separate `youtubeUrl` field
// (added in Phase 1) is rendered below as a secondary showcase when present,
// distinct from the VSL hero so the buyer doesn't see the same video twice.
import Hero from "../sections/Hero";
import Benefits from "../sections/Benefits";
import HowToUse from "../sections/HowToUse";
import Gallery from "../sections/Gallery";
import Pricing from "../sections/Pricing";
import TrustBadges from "../sections/TrustBadges";
import SocialProof from "../sections/SocialProof";
import Guarantee from "../sections/Guarantee";
import CheckoutForm from "../sections/CheckoutForm";
import StickyCTA from "../sections/StickyCTA";
import PhoneWhatsapp from "../sections/PhoneWhatsapp";
import ShowcaseVideo from "../sections/ShowcaseVideo";
import { toEmbedUrl } from "@/lib/youtube";
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";
import type { ILandingPage } from "@/interface/product.interface";

export default function VideoHero({
  product,
  landing,
}: {
  product: SerializedLandingProduct;
  landing: ILandingPage;
}) {
  // If no VSL is configured we simply skip the hero video (the rest of
  // the page still renders). The hero image acts as the visual anchor.
  const heroEmbed = toEmbedUrl(landing.vslUrl, { autoplay: false });

  return (
    <div data-theme="videoHero">
      {heroEmbed ? (
        <section className="step-section">
          <div className="step-container">
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: 16,
                overflow: "hidden",
                background: "#000",
              }}
            >
              <iframe
                src={heroEmbed}
                title={`${product.name} – video sales letter`}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            </div>
          </div>
        </section>
      ) : (
        <Hero product={product} landing={landing} />
      )}

      <Benefits items={landing.benefits} />
      <HowToUse items={landing.howToUse} />
      <Gallery images={product.images} />
      <Pricing product={product} landing={landing} />
      <TrustBadges product={product} />
      <SocialProof stats={landing.socialProofStats} />
      <Guarantee text={landing.guarantee} />

      {/* Only show the secondary showcase video if it's actually different
          from the VSL — prevents double-rendering the same clip. */}
      {landing.youtubeUrl &&
        landing.youtubeUrl.trim() !== "" &&
        landing.youtubeUrl !== landing.vslUrl && (
          <ShowcaseVideo url={landing.youtubeUrl} caption="More from real customers" />
        )}

      <CheckoutForm product={product} checkoutNote={landing.checkoutNote} />
      <StickyCTA label={landing.heroCtaLabel} productId={product._id} />
      <PhoneWhatsapp />
    </div>
  );
}