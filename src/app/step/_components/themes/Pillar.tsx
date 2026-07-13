"use client";

/**
 * Pillar — trust-led, serif, founder voice.
 *
 * The "moment": the brand you've heard about from three friends and a
 * podcast finally has a page. Press logos, founder's note, methodical
 * proof sections, serif headlines that quote the brand's own voice back
 * to the visitor. Calm navy, deep forest accent.
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
  Section,
} from "@/app/step/_components/primitives/Primitives";
import { Reveal, Stagger } from "@/app/step/_components/primitives/Reveal";

import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";
import type { ILandingPage } from "@/interface/product.interface";

interface Props {
  product: SerializedLandingProduct;
  slug: string;
}

export default function Pillar({ product, slug }: Props) {
  const lp = (product.landingPage ?? {}) as ILandingPage;
  const stats = (lp.socialProofStats ?? []).slice(0, 3);

  return (
    <div data-theme="pillar">
      {/* ── Hero: founder voice, two columns ─────────────────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
              gap: 64,
              alignItems: "center",
            }}
            className="lp-pillar-hero"
          >
            <div>
              <Stagger>
                <Eyebrow>From the founders</Eyebrow>
                <Headline
                  as="h1"
                  data-size="display"
                  style={{ marginTop: 24, maxWidth: "16ch" }}
                >
                  {lp.heroSubtitle || (
                    <>
                      Trusted in <em>every</em> kitchen since the day we started.
                    </>
                  )}
                </Headline>
                <Lede style={{ marginTop: 24 }}>
                  {lp.heroSubtitle ||
                    product.details ||
                    "We do one thing well, and we&apos;ve been doing it for longer than we expected."}
                </Lede>
                <div
                  style={{
                    marginTop: 32,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    as="a"
                    href={`#order-${slug}`}
                    data-size="lg"
                    data-tone="ink"
                  >
                    {lp.heroCtaLabel || "Add to cart"}
                  </Button>
                  <Button
                    as="a"
                    href="#story"
                    data-tone="outline"
                    data-size="lg"
                  >
                    Read the promise
                  </Button>
                </div>
              </Stagger>
            </div>
            <Reveal delay={0.2} y={30}>
              <Hero product={product} variant="pillar" />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Press strip ──────────────────────────────────────────────── */}
      <Section data-tone="sunken" style={{ padding: "40px 0" }}>
        <Container data-width="wide">
          <Stagger>
            <Eyebrow style={{ justifyContent: "center", display: "flex" }}>
              As featured in
            </Eyebrow>
          </Stagger>
          <div
            style={{
              marginTop: 28,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 32,
              alignItems: "center",
              justifyItems: "center",
            }}
          >
            {(lp.trustBadges ?? []).slice(0, 6).map((b, i) => (
              <Reveal key={`${b}-${i}`} delay={i * 0.05}>
                <span
                  style={{
                    fontFamily: "var(--lp-font-display)",
                    fontStyle: "italic",
                    fontSize: 18,
                    color: "var(--lp-fg-muted)",
                    letterSpacing: "-0.01em",
                    textAlign: "center",
                  }}
                >
                  {b}
                </span>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Founder note ─────────────────────────────────────────────── */}
      <Section id="story" data-tone="canvas">
        <Container data-width="narrow">
          <Stagger>
            <Eyebrow>A note from us</Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{ marginTop: 16 }}
            >
              We started this because <em>nothing on the shelf</em> did the
              one thing we needed.
            </Headline>
            <div
              style={{
                marginTop: 32,
                fontFamily: "var(--lp-font-display)",
                fontStyle: "italic",
                fontSize: 22,
                lineHeight: 1.5,
                color: "var(--lp-fg-muted)",
                borderLeft: "2px solid var(--lp-accent)",
                paddingLeft: 24,
              }}
            >
              {lp.guarantee ||
                "Years later, we still get messages from people who tell us this is the only one they keep on the counter."}
            </div>
            <div
              style={{
                marginTop: 16,
                fontFamily: "var(--lp-font-body)",
                fontSize: 13,
                color: "var(--lp-fg-faint)",
                textAlign: "right",
              }}
            >
              — The team
            </div>
          </Stagger>
        </Container>
      </Section>

      {/* ── Stats band ───────────────────────────────────────────────── */}
      {stats.length > 0 && (
        <Section data-tone="sunken">
          <Container data-width="wide">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
                gap: 32,
              }}
              className="lp-pillar-stats"
            >
              {stats.map((s, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div
                    style={{
                      fontFamily: "var(--lp-font-display)",
                      fontSize: "clamp(32px, 3.4vw, 48px)",
                      fontWeight: 500,
                      lineHeight: 1,
                      color: "var(--lp-accent)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      color: "var(--lp-fg-muted)",
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

      {/* ── Benefits with stacked image ──────────────────────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow>Why it works</Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{ marginTop: 16, maxWidth: "20ch" }}
            >
              Built around <em>one</em> job. Doing it well.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 56 }}>
            <Reveal>
              <Benefits product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── How to use ───────────────────────────────────────────────── */}
      <Section data-tone="sunken">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow>How you use it</Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{ marginTop: 16, maxWidth: "22ch" }}
            >
              Three <em>small</em> decisions every morning.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 56 }}>
            <Reveal>
              <HowToUse product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Pain points as testimonial-style chorus ──────────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow>What we kept hearing</Eyebrow>
            <Headline
              as="h2"
              data-size="lg"
              style={{ marginTop: 16 }}
            >
              You said the others <em>almost</em> worked.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 48 }}>
            <Reveal>
              <PainPoints product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Video ────────────────────────────────────────────────────── */}
      {(lp.youtubeUrl || lp.vslUrl) && (
        <Section data-tone="ink">
          <Container data-width="wide">
            <Stagger>
              <Eyebrow style={{ color: "var(--lp-fg-faint)" }}>
                Watch
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
                See it the way <em>we</em> see it.
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

      {/* ── Gallery: gallery-rows ────────────────────────────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow>Closer look</Eyebrow>
            <Headline
              as="h2"
              data-size="lg"
              style={{ marginTop: 16 }}
            >
              Honest photographs. <em>Unedited</em>.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 48 }}>
            <Reveal>
              <Gallery product={product} variant="pillar" />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Trust + Social proof (combined) ─────────────────────────── */}
      <Section data-tone="sunken">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow>Reviews</Eyebrow>
            <Headline
              as="h2"
              data-size="lg"
              style={{ marginTop: 16 }}
            >
              What people <em>actually</em> write in.
            </Headline>
          </Stagger>

          {stats.length > 0 && (
            <div
              style={{
                marginTop: 56,
                display: "grid",
                gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`,
                gap: 24,
              }}
              className="lp-pillar-stats"
            >
              {stats.map((s, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div
                    style={{
                      background: "var(--lp-bg-raised)",
                      border: "1px solid var(--lp-line)",
                      borderRadius: 6,
                      padding: 24,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--lp-font-display)",
                        fontStyle: "italic",
                        fontSize: 32,
                        lineHeight: 1,
                        color: "var(--lp-accent)",
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        fontFamily: "var(--lp-font-body)",
                        fontSize: 13,
                        color: "var(--lp-fg-muted)",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          <div style={{ marginTop: 48 }}>
            <Reveal>
              <TrustBadges product={product} />
            </Reveal>
          </div>
          <div style={{ marginTop: 48 }}>
            <Reveal>
              <SocialProof product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Pricing + Guarantee ──────────────────────────────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
              gap: 56,
              alignItems: "start",
            }}
            className="lp-pillar-grid"
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
              Order with confidence
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
              Place the <em>order</em>.
            </Headline>
            <Lede
              style={{
                marginTop: 20,
                color: "var(--lp-fg-faint)",
              }}
            >
              {lp.checkoutNote ||
                "Ships in 2 business days. 30-day money-back guarantee."}
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
        style={{
          paddingTop: 24,
          paddingBottom: 48,
          borderTop: "1px solid rgba(246,244,239,0.1)",
        }}
      >
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