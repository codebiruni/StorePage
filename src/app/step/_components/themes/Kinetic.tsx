"use client";

/**
 * Kinetic — motion-led, bold sans.
 *
 * The "moment": a brand that feels like it's already in motion when you
 * arrive. Oversized Space Grotesk headlines, monospace micro-detail,
 * layered marquees, alternating diagonal-leaning sections. Designed to
 * convert on energy: bold CTA, fast stats, sharp pricing block.
 */

import { ArrowRight } from "lucide-react";

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

export default function Kinetic({ product, slug }: Props) {
  const lp = (product.landingPage ?? {}) as ILandingPage;
  const stats = (lp.socialProofStats ?? []).slice(0, 4);
  const trusts = (lp.trustBadges ?? []).filter(Boolean);

  return (
    <div data-theme="kinetic">
      {/* ── Hero: oversized sans, mono eyebrow, fast CTA ─────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Reveal>
              <Eyebrow
                style={{
                  fontFamily: "var(--lp-font-mono)",
                  letterSpacing: "0.1em",
                }}
              >
                {lp.heroBadge || "Now shipping"} / v.{product._id?.slice(-4) || "01"}
              </Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <span
                style={{
                  fontFamily: "var(--lp-font-mono)",
                  fontSize: 12,
                  color: "var(--lp-fg-faint)",
                }}
              >
                ↘ scroll
              </span>
            </Reveal>
          </div>

          <Reveal delay={0.05}>
            <Headline
              as="h1"
              data-size="display"
              style={{ marginTop: 40, maxWidth: "15ch" }}
            >
              {lp.heroSubtitle || (
                <>
                  Built for <em>the</em> next ten minutes.
                </>
              )}
            </Headline>
          </Reveal>
          <Reveal delay={0.15}>
            <Lede
              style={{
                marginTop: 24,
                maxWidth: "48ch",
                fontFamily: "var(--lp-font-mono)",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {lp.heroSubtitle ||
                product.details ||
                "A short product page that respects your time."}
            </Lede>
          </Reveal>

          <Reveal delay={0.25}>
            <div
              style={{
                marginTop: 32,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Button as="a" href={`#order-${slug}`} data-size="lg">
                {lp.heroCtaLabel || "Get it now"}
                <ArrowRight size={16} />
              </Button>
              <Button as="a" href="#demo" data-tone="ghost" data-size="lg">
                See it work
              </Button>
            </div>
          </Reveal>

          <div style={{ marginTop: 56 }}>
            <Reveal delay={0.32} y={40}>
              <Hero product={product} variant="kinetic" />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Marquee: bold uppercase crawl ────────────────────────────── */}
      <Section data-tone="ink" style={{ padding: "32px 0" }}>
        <Marquee
          items={(() => {
            const arr =
              trusts.length > 0
                ? trusts
                : ["Free shipping", "30-day guarantee", "Carbon-neutral", "Built to last"];
            const doubled = [...arr, ...arr];
            return doubled.map((b, i) => (
              <span
                key={`${b}-${i}`}
                style={{
                  fontFamily: "var(--lp-font-display)",
                  fontWeight: 600,
                  fontSize: 22,
                  letterSpacing: "0.02em",
                  color: "var(--lp-fg-on-ink)",
                }}
              >
                {b}
              </span>
            ));
          })()}
        />
      </Section>

      {/* ── Stat band ────────────────────────────────────────────────── */}
      {stats.length > 0 && (
        <Section data-tone="canvas" style={{ padding: "64px 0" }}>
          <Container data-width="wide">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
                gap: 24,
              }}
              className="lp-kinetic-stats"
            >
              {stats.map((s, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div
                    style={{
                      borderTop: "2px solid var(--lp-fg)",
                      paddingTop: 16,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--lp-font-display)",
                        fontSize: "clamp(36px, 5vw, 64px)",
                        fontWeight: 700,
                        lineHeight: 1,
                        letterSpacing: "-0.04em",
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        fontFamily: "var(--lp-font-mono)",
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--lp-fg-muted)",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── Pain points ──────────────────────────────────────────────── */}
      <Section data-tone="sunken">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow
              style={{
                fontFamily: "var(--lp-font-mono)",
                letterSpacing: "0.1em",
              }}
            >
              /01 — the friction
            </Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{ marginTop: 16, maxWidth: "20ch" }}
            >
              You keep <em>paying</em> for the workaround.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 48 }}>
            <Reveal>
              <PainPoints product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Benefits: kinetic two-up ─────────────────────────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow
              style={{
                fontFamily: "var(--lp-font-mono)",
                letterSpacing: "0.1em",
              }}
            >
              /02 — what changes
            </Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{ marginTop: 16, maxWidth: "20ch" }}
            >
              Faster, lighter, <em>sharper</em>.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 56 }}>
            <Reveal>
              <Benefits product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── How to use: numeric cinematic ────────────────────────────── */}
      <Section data-tone="sunken">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow
              style={{
                fontFamily: "var(--lp-font-mono)",
                letterSpacing: "0.1em",
              }}
            >
              /03 — the sequence
            </Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{ marginTop: 16, maxWidth: "22ch" }}
            >
              Three steps. <em>Zero</em> friction.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 56 }}>
            <Reveal>
              <HowToUse product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Video demo ───────────────────────────────────────────────── */}
      {(lp.youtubeUrl || lp.vslUrl) && (
        <Section id="demo" data-tone="ink">
          <Container data-width="wide">
            <Stagger>
              <Eyebrow
                style={{
                  fontFamily: "var(--lp-font-mono)",
                  letterSpacing: "0.1em",
                  color: "var(--lp-fg-faint)",
                }}
              >
                /04 — watch
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
                Thirty seconds. <em>Done</em>.
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

      {/* ── Gallery ──────────────────────────────────────────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow
              style={{
                fontFamily: "var(--lp-font-mono)",
                letterSpacing: "0.1em",
              }}
            >
              /05 — closer look
            </Eyebrow>
            <Headline
              as="h2"
              data-size="lg"
              style={{ marginTop: 16 }}
            >
              Every angle, <em>honest</em>.
            </Headline>
          </Stagger>
          <div style={{ marginTop: 48 }}>
            <Reveal>
              <Gallery product={product} variant="kinetic" />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Trust + Social proof ─────────────────────────────────────── */}
      <Section data-tone="sunken">
        <Container data-width="wide">
          <Stagger>
            <Eyebrow
              style={{
                fontFamily: "var(--lp-font-mono)",
                letterSpacing: "0.1em",
              }}
            >
              /06 — proof
            </Eyebrow>
            <Headline
              as="h2"
              data-size="lg"
              style={{ marginTop: 16 }}
            >
              Receipts, not <em>claims</em>.
            </Headline>
          </Stagger>
          <div
            style={{
              marginTop: 48,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 48,
              alignItems: "start",
            }}
            className="lp-pillar-grid"
          >
            <Reveal>
              <TrustBadges product={product} />
            </Reveal>
            <Reveal delay={0.1}>
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
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
              gap: 48,
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

      {/* ── Checkout finale ──────────────────────────────────────────── */}
      <Section id={`order-${slug}`} data-tone="ink">
        <Container data-width="narrow">
          <Stagger>
            <Eyebrow
              style={{
                fontFamily: "var(--lp-font-mono)",
                letterSpacing: "0.1em",
                color: "var(--lp-fg-faint)",
              }}
            >
              /07 — checkout
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
              One form. <em>Done</em>.
            </Headline>
            <Lede
              style={{
                marginTop: 16,
                color: "var(--lp-fg-faint)",
                fontFamily: "var(--lp-font-mono)",
                fontSize: 13,
              }}
            >
              {lp.checkoutNote || "Ships within two business days."}
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
                fontWeight: 700,
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