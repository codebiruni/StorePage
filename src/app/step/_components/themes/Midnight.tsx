"use client";

/**
 * Midnight — dark editorial luxury.
 *
 * The "moment": the lights drop in the room and the product is the only
 * thing lit. Champagne accent, restrained serif headlines, very long
 * vertical rhythm. Built around a hero → cinematic video → pricing →
 * checkout arc, with everything else as quiet interstitials.
 */

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
  slug: string;
}

export default function Midnight({ product, slug }: Props) {
  const lp = (product.landingPage ?? {}) as ILandingPage;
  const stats = (lp.socialProofStats ?? []).slice(0, 3);

  return (
    <div data-theme="midnight">
      {/* ── Cinematic dark hero ──────────────────────────────────────── */}
      <Section data-tone="ink" data-width="page">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow style={{ color: "var(--lp-fg-faint)" }}>
              {lp.heroBadge || "Limited release"}
            </Eyebrow>
            <Headline
              as="h1"
              data-size="display"
              style={{
                marginTop: 32,
                maxWidth: "14ch",
                color: "var(--lp-fg-on-ink)",
              }}
            >
              {lp.heroSubtitle || (
                <>
                  After <em>hours</em>.
                  <br />
                  For the discerning.
                </>
              )}
            </Headline>
            <Lede
              style={{
                marginTop: 24,
                color: "var(--lp-fg-faint)",
                maxWidth: "52ch",
              }}
            >
              {lp.heroSubtitle ||
                product.details ||
                "A small-batch edition, released without fanfare."}
            </Lede>
          </Stagger>

          <Reveal delay={0.3} y={50}>
            <div style={{ marginTop: 64 }}>
              <Hero product={product} variant="cinema" />
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div
              style={{
                marginTop: 48,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Button as="a" href={`#order-${slug}`} data-size="lg">
                {lp.heroCtaLabel || "Reserve yours"}
              </Button>
              <Button
                as="a"
                href="#film"
                data-tone="ghost"
                data-size="lg"
                style={{
                  color: "var(--lp-fg-on-ink)",
                  borderColor: "rgba(246,244,239,0.3)",
                }}
              >
                Watch the film
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ── Stats band (white on ink) ────────────────────────────────── */}
      {stats.length > 0 && (
        <Section data-tone="ink" style={{ padding: "40px 0" }}>
          <Container data-width="wide">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
                gap: 32,
                borderTop: "1px solid rgba(246,244,239,0.15)",
                borderBottom: "1px solid rgba(246,244,239,0.15)",
                padding: "32px 0",
              }}
              className="lp-midnight-stats"
            >
              {stats.map((s, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div
                    style={{
                      fontFamily: "var(--lp-font-display)",
                      fontSize: "clamp(28px, 3vw, 44px)",
                      fontWeight: 400,
                      lineHeight: 1,
                      color: "var(--lp-accent)",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--lp-fg-faint)",
                    }}
                  >
                    {s.label}
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── Cinematic video ──────────────────────────────────────────── */}
      {(lp.youtubeUrl || lp.vslUrl) && (
        <Section id="film" data-tone="ink" style={{ paddingTop: 96 }}>
          <Container data-width="wide">
            <Stagger>
              <Eyebrow style={{ color: "var(--lp-fg-faint)" }}>
                The film
              </Eyebrow>
              <Headline
                as="h2"
                data-size="lg"
                style={{
                  marginTop: 16,
                  color: "var(--lp-fg-on-ink)",
                  maxWidth: "20ch",
                }}
              >
                Two minutes. <em>Worth</em> every second.
              </Headline>
            </Stagger>
            <div style={{ marginTop: 48 }}>
              <Reveal>
                <ShowcaseVideo product={product} variant="cinema" />
              </Reveal>
            </div>
          </Container>
        </Section>
      )}

      {/* ── Gallery: dark, full-bleed ────────────────────────────────── */}
      <Section data-tone="ink">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow style={{ color: "var(--lp-fg-faint)" }}>
              The collection
            </Eyebrow>
            <Headline
              as="h2"
              data-size="lg"
              style={{
                marginTop: 16,
                color: "var(--lp-fg-on-ink)",
                maxWidth: "22ch",
              }}
            >
              Finished in <em>chiaroscuro</em>.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 56 }}>
            <Reveal>
              <Gallery product={product} variant="midnight" />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Trust marquee (light band) ───────────────────────────────── */}
      {(lp.trustBadges ?? []).length > 0 && (
        <Section data-tone="canvas" style={{ padding: "24px 0" }}>
          <Marquee
            items={[...(lp.trustBadges ?? []), ...(lp.trustBadges ?? [])]}
          />
        </Section>
      )}

      {/* ── Pain points: dark call-out ───────────────────────────────── */}
      <Section data-tone="sunken">
        <Container data-width="narrow">
          <Stagger>
            <Eyebrow>The friction you&apos;ve stopped mentioning</Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{ marginTop: 16 }}
            >
              It isn&apos;t <em>you</em>. It&apos;s the version you own.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 48 }}>
            <Reveal>
              <PainPoints product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Benefits: editorial two-up ───────────────────────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)",
              gap: 64,
              alignItems: "start",
            }}
            className="lp-midnight-grid"
          >
            <div style={{ position: "sticky", top: 80 }}>
              <Stagger>
                <Eyebrow>What we changed</Eyebrow>
                <Headline
                  as="h2"
                  data-size="xl"
                  style={{ marginTop: 16 }}
                >
                  Built in <em>silence</em>. Loud in the details.
                </Headline>
              </Stagger>
            </div>
            <Reveal>
              <Benefits product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── How to use: numbered cinematic ───────────────────────────── */}
      <Section data-tone="sunken">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow>How it&apos;s used</Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{ marginTop: 16, maxWidth: "22ch" }}
            >
              A <em>ritual</em>, not a routine.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 56 }}>
            <Reveal>
              <HowToUse product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Trust + Guarantee (combined band) ────────────────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow>The promise</Eyebrow>
            <Headline
              as="h2"
              data-size="lg"
              style={{ marginTop: 16 }}
            >
              We&apos;ll be <em>here</em> long after the order.
            </Headline>
          </Stagger>
          <div
            style={{
              marginTop: 48,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
              gap: 48,
              alignItems: "start",
            }}
            className="lp-midnight-grid"
          >
            <Reveal>
              <TrustBadges product={product} />
            </Reveal>
            <Reveal delay={0.1}>
              <Guarantee product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Social proof (testimonial feel) ──────────────────────────── */}
      <Section data-tone="ink">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow style={{ color: "var(--lp-fg-faint)" }}>
              In their words
            </Eyebrow>
            <Headline
              as="h2"
              data-size="lg"
              style={{
                marginTop: 16,
                color: "var(--lp-fg-on-ink)",
                maxWidth: "20ch",
              }}
            >
              Quietly <em>endorsed</em>.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 56 }}>
            <Reveal>
              <SocialProof product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Pricing on dark ──────────────────────────────────────────── */}
      <Section data-tone="ink">
        <Container data-width="narrow">
          <Stagger>
            <Eyebrow style={{ color: "var(--lp-fg-faint)" }}>
              Tonight&apos;s price
            </Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{
                marginTop: 16,
                color: "var(--lp-fg-on-ink)",
                maxWidth: "16ch",
              }}
            >
              <em>Consider</em> it.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 40 }}>
            <Reveal>
              <Pricing product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Checkout: dark finale ────────────────────────────────────── */}
      <Section id={`order-${slug}`} data-tone="ink">
        <Container data-width="narrow">
          <Stagger>
            <Eyebrow style={{ color: "var(--lp-fg-faint)" }}>
              Reserve
            </Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{
                marginTop: 16,
                color: "var(--lp-fg-on-ink)",
                maxWidth: "14ch",
              }}
            >
              Place the <em>order</em>.
            </Headline>
            <Lede
              style={{
                marginTop: 20,
                color: "var(--lp-fg-faint)",
              }}
            >
              {lp.checkoutNote ||
                "Ships in unmarked packaging within two business days."}
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
      <Section
        data-tone="ink"
        style={{ paddingTop: 24, paddingBottom: 48, borderTop: "1px solid rgba(246,244,239,0.1)" }}
      >
        <Container>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
              color: "var(--lp-fg-faint)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--lp-font-display)",
                fontStyle: "italic",
                fontSize: 18,
                color: "var(--lp-fg-on-ink)",
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