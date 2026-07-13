"use client";

/**
 * Atelier — editorial serif theme.
 *
 * The "moment": walking into a quiet, well-lit boutique where each
 * object is given its own space and the typography speaks slowly.
 *
 * The theme relies entirely on the global Primitives (Section /
 * Container / Eyebrow / Headline / Lede / Button) and the Reveal
 * scroll-reveal. All colour, type, and rhythm come from the
 * `[data-theme="atelier"]` block in landing.css — this file is
 * almost pure composition.
 */

import { Sparkles } from "lucide-react";

import Hero from "@/app/step/_components/sections/Hero";
import PainPoints from "@/app/step/_components/sections/PainPoints";
import Benefits from "@/app/step/_components/sections/Benefits";
import HowToUse from "@/app/step/_components/sections/HowToUse";
import Gallery from "@/app/step/_components/sections/Gallery";
import Pricing from "@/app/step/_components/sections/Pricing";
import TrustBadges from "@/app/step/_components/sections/TrustBadges";
import SocialProof from "@/app/step/_components/sections/SocialProof";
import Guarantee from "@/app/step/_components/sections/Guarantee";
import ShowcaseVideo from "@/app/step/_components/sections/ShowcaseVideo";
import CheckoutForm from "@/app/step/_components/sections/CheckoutForm";
import StickyCTA from "@/app/step/_components/sections/StickyCTA";
import PhoneWhatsapp from "@/app/step/_components/sections/PhoneWhatsapp";

import {
  Button,
  Container,
  Eyebrow,
  Headline,
  Lede,
  Marquee,
  Section,
} from "@/app/step/_components/primitives/Primitives";
import { Reveal, Stagger } from "@/app/step/_components/primitives/Reveal";

import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";
import type { ILandingPage } from "@/interface/product.interface";

interface Props {
  product: SerializedLandingProduct;
  /** Slug for checkout links. */
  slug: string;
}

export default function Atelier({ product, slug }: Props) {
  const lp = (product.landingPage ?? {}) as ILandingPage;
  const trustMarquee = (lp.trustBadges ?? []).filter(Boolean);

  return (
    <div data-theme="atelier">
      {/* ── Hero: editorial cover, oversized italic headline ──────────── */}
      <Section data-tone="canvas" data-width="page">
        <Container data-width="wide">
          <Reveal>
            <Eyebrow>
              <Sparkles size={11} aria-hidden />
              The {product.name} edition
            </Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <Headline
              as="h1"
              data-size="display"
              style={{ marginTop: 24, maxWidth: "16ch" }}
            >
              {lp.heroSubtitle || (
                <>
                  A quiet <em>ritual</em> for the way you actually live.
                </>
              )}
            </Headline>
          </Reveal>
          <Reveal delay={0.18}>
            <Lede style={{ marginTop: 24, fontSize: 18 }}>
              {lp.heroSubtitle ||
                product.details ||
                "Made by hand, told in chapters, finished in our studio."}
            </Lede>
          </Reveal>
          <Reveal delay={0.26}>
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 36,
                flexWrap: "wrap",
              }}
            >
              <Button as="a" href={`#order-${slug}`} data-size="lg">
                {lp.heroCtaLabel || "Begin your order"}
              </Button>
              <Button as="a" href="#story" data-tone="outline" data-size="lg">
                Read the story
              </Button>
            </div>
          </Reveal>
        </Container>

        <Container data-width="wide" style={{ marginTop: 56 }}>
          <Reveal delay={0.32} y={40}>
            <Hero product={product} variant="gallery" />
          </Reveal>
        </Container>
      </Section>

      {/* ── Trust marquee: whisper between sections ───────────────────── */}
      {trustMarquee.length > 0 && (
        <Section data-tone="sunken" style={{ padding: "28px 0" }}>
          <Marquee items={[...trustMarquee, ...trustMarquee]} />
        </Section>
      )}

      {/* ── Pain points: pulled-quote rhythm ──────────────────────────── */}
      <Section id="story" data-tone="canvas">
        <Container data-width="narrow">
          <Stagger>
            <Eyebrow>Chapter one</Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{ marginTop: 16, fontStyle: "italic" }}
            >
              You don&apos;t need more. You need the <em>right</em> one.
            </Headline>
          </Stagger>
        </Container>
        <Container data-width="wide" style={{ marginTop: 48 }}>
          <Reveal>
            <PainPoints product={product} />
          </Reveal>
        </Container>
      </Section>

      {/* ── Benefits: gallery framing, asymmetric columns ─────────────── */}
      <Section data-tone="sunken">
        <Container data-width="wide">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)",
              gap: 48,
              alignItems: "start",
            }}
            className="lp-atelier-grid"
          >
            <div style={{ position: "sticky", top: 80 }}>
              <Stagger>
                <Eyebrow>Chapter two</Eyebrow>
                <Headline
                  as="h2"
                  data-size="xl"
                  style={{ marginTop: 16 }}
                >
                  Considered, <em>again</em> and again.
                </Headline>
                <Lede style={{ marginTop: 20 }}>
                  Every detail was a small argument won in the studio. These
                  are the ones we chose to keep.
                </Lede>
              </Stagger>
            </div>
            <Reveal>
              <Benefits product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── How to use: editorial steps ───────────────────────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow>Chapter three</Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{ marginTop: 16, maxWidth: "20ch" }}
            >
              Three small <em>moments</em>, every day.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 56 }}>
            <Reveal>
              <HowToUse product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Gallery: atelier contact-sheet feel ───────────────────────── */}
      <Section data-tone="ink">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow style={{ color: "var(--lp-fg-faint)" }}>
              The atelier
            </Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{ marginTop: 16, maxWidth: "18ch" }}
            >
              Photographed in the studio, <em>untouched</em>.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 56 }}>
            <Reveal>
              <Gallery product={product} variant="atelier" />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Showcase video ────────────────────────────────────────────── */}
      {(lp.youtubeUrl || lp.vslUrl) && (
        <Section data-tone="canvas">
          <Container data-width="wide">
            <Stagger>
              <Eyebrow>Watch</Eyebrow>
              <Headline
                as="h2"
                data-size="lg"
                style={{ marginTop: 16, maxWidth: "22ch" }}
              >
                See it <em>move</em>.
              </Headline>
            </Stagger>
            <div style={{ marginTop: 40 }}>
              <Reveal>
                <ShowcaseVideo product={product} />
              </Reveal>
            </div>
          </Container>
        </Section>
      )}

      {/* ── Trust badges: editorial list ──────────────────────────────── */}
      <Section data-tone="sunken">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow>Why people keep it</Eyebrow>
            <Headline
              as="h2"
              data-size="lg"
              style={{ marginTop: 16 }}
            >
              Quietly <em>built</em> to last.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 48 }}>
            <Reveal>
              <TrustBadges product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Social proof ──────────────────────────────────────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow>Field notes</Eyebrow>
            <Headline
              as="h2"
              data-size="lg"
              style={{ marginTop: 16 }}
            >
              In the words of the people who <em>kept</em> it.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 48 }}>
            <Reveal>
              <SocialProof product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Pricing + Guarantee (side by side, generous gap) ──────────── */}
      <Section data-tone="sunken">
        <Container data-width="wide">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 64,
              alignItems: "start",
            }}
            className="lp-atelier-grid"
          >
            <Reveal>
              <Pricing product={product} />
            </Reveal>
            <Reveal delay={0.1}>
              <Guarantee product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Checkout ─────────────────────────────────────────────────── */}
      <Section id={`order-${slug}`} data-tone="ink">
        <Container data-width="narrow">
          <Stagger>
            <Eyebrow style={{ color: "var(--lp-fg-faint)" }}>
              Order
            </Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{ marginTop: 16, maxWidth: "16ch" }}
            >
              Take one <em>home</em>.
            </Headline>
            <Lede
              style={{
                marginTop: 20,
                color: "var(--lp-fg-faint)",
              }}
            >
              {lp.checkoutNote ||
                "Ships from the studio within two business days."}
            </Lede>
          </Stagger>
          <div style={{ marginTop: 40 }}>
            <Reveal>
              <CheckoutForm product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Footer band ──────────────────────────────────────────────── */}
      <Section data-tone="canvas" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <Container>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: "var(--lp-font-display)",
                fontStyle: "italic",
                fontSize: 18,
              }}
            >
              {product.name}
            </span>
            <PhoneWhatsapp product={product} compact />
          </div>
        </Container>
      </Section>

      <StickyCTA product={product} slug={slug} />
    </div>
  );
}