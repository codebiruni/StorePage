"use client";

/**
 * Origin — minimal monochrome.
 *
 * The "moment": a museum wall. White space, single accent, a single line
 * of copy, a single product photo as the entire page. Built around the
 * idea that restraint is the moment: every section earns its place or
 * doesn't exist.
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
import { Reveal } from "@/app/step/_components/primitives/Reveal";

import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";
import type { ILandingPage } from "@/app/step/_lib/landing-shared";

interface Props {
  product: SerializedLandingProduct;
  slug: string;
}

export default function Origin({ product, slug }: Props) {
  const lp = (product.landingPage ?? {}) as ILandingPage;

  return (
    <div data-theme="origin">
      {/* ── Hero: museum wall ────────────────────────────────────────── */}
      <Section data-tone="canvas" style={{ paddingTop: 96 }}>
        <Container data-width="narrow">
          <Reveal>
            <Eyebrow
              style={{
                justifyContent: "center",
                display: "flex",
                borderTop: "1px solid var(--lp-line)",
                borderBottom: "1px solid var(--lp-line)",
                padding: "12px 0",
              }}
            >
              {product.name}
            </Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <Headline
              as="h1"
              data-size="display"
              style={{
                marginTop: 48,
                textAlign: "center",
                maxWidth: "18ch",
                marginInline: "auto",
                fontWeight: 400,
                letterSpacing: "-0.02em",
              }}
            >
              {lp.heroSubtitle ||
                product.details ||
                "One product. Made well."}
            </Headline>
          </Reveal>
          <Reveal delay={0.2}>
            <div
              style={{
                marginTop: 48,
                display: "flex",
                justifyContent: "center",
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
                {lp.heroCtaLabel || `Buy ${product.name}`}
              </Button>
              <Button as="a" href="#details" data-tone="outline" data-size="lg">
                Details
              </Button>
            </div>
          </Reveal>
        </Container>

        <Container data-width="wide" style={{ marginTop: 80 }}>
          <Reveal delay={0.3} y={40}>
            <Hero product={product} variant="origin" />
          </Reveal>
        </Container>
      </Section>

      {/* ── One sentence on its own ──────────────────────────────────── */}
      <Section data-tone="sunken">
        <Container data-width="narrow">
          <Reveal>
            <Headline
              as="h2"
              data-size="lg"
              style={{
                textAlign: "center",
                fontWeight: 400,
                fontStyle: "italic",
              }}
            >
              {lp.heroSubtitle
                ? lp.heroSubtitle
                : "If we couldn&apos;t make this one well, we wouldn&apos;t make it at all."}
            </Headline>
          </Reveal>
        </Container>
      </Section>

      {/* ── Pain points: minimal list ────────────────────────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
              gap: 64,
              alignItems: "start",
            }}
            className="lp-origin-split"
          >
            <Reveal>
              <Eyebrow>The question</Eyebrow>
              <Headline
                as="h2"
                data-size="lg"
                style={{
                  marginTop: 16,
                  fontWeight: 400,
                }}
              >
                Why does this <em>thing</em> matter?
              </Headline>
            </Reveal>
            <Reveal delay={0.1}>
              <PainPoints product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Benefits: single column, generous space ──────────────────── */}
      <Section data-tone="canvas" id="details">
        <Container data-width="wide">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
              gap: 64,
              alignItems: "start",
            }}
            className="lp-origin-split"
          >
            <Reveal>
              <Eyebrow>The answer</Eyebrow>
              <Headline
                as="h2"
                data-size="lg"
                style={{
                  marginTop: 16,
                  fontWeight: 400,
                }}
              >
                What it <em>does</em>.
              </Headline>
            </Reveal>
            <Reveal delay={0.1}>
              <Benefits product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── How to use ───────────────────────────────────────────────── */}
      <Section data-tone="sunken">
        <Container data-width="wide">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
              gap: 64,
              alignItems: "start",
            }}
            className="lp-origin-split"
          >
            <Reveal>
              <Eyebrow>The flow</Eyebrow>
              <Headline
                as="h2"
                data-size="lg"
                style={{
                  marginTop: 16,
                  fontWeight: 400,
                }}
              >
                How to <em>use</em> it.
              </Headline>
            </Reveal>
            <Reveal delay={0.1}>
              <HowToUse product={product} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Video: full-bleed, dark for contrast ─────────────────────── */}
      {(lp.youtubeUrl || lp.vslUrl) && (
        <Section data-tone="ink">
          <Container data-width="wide">
            <Reveal>
              <Eyebrow
                style={{
                  color: "var(--lp-fg-faint)",
                  justifyContent: "center",
                  display: "flex",
                }}
              >
                Watch
              </Eyebrow>
            </Reveal>
            <div style={{ marginTop: 32 }}>
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
          <Reveal>
            <Eyebrow
              style={{
                justifyContent: "center",
                display: "flex",
              }}
            >
              The object
            </Eyebrow>
          </Reveal>
          <div style={{ marginTop: 40 }}>
            <Reveal>
              <Gallery product={product} variant="origin" />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Trust + Social proof (combined, calm) ────────────────────── */}
      <Section data-tone="sunken">
        <Container data-width="wide">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 48,
              alignItems: "start",
            }}
            className="lp-origin-split"
          >
            <Reveal>
              <Eyebrow>Receipts</Eyebrow>
              <div style={{ marginTop: 24 }}>
                <TrustBadges product={product} />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <Eyebrow>Words</Eyebrow>
              <div style={{ marginTop: 24 }}>
                <SocialProof product={product} />
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Pricing + Guarantee (museum-card style) ──────────────────── */}
      <Section data-tone="canvas">
        <Container data-width="wide">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 48,
              alignItems: "start",
            }}
            className="lp-origin-split"
          >
            <Reveal>
              <Eyebrow>Price</Eyebrow>
              <div style={{ marginTop: 24 }}>
                <Pricing product={product} />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <Eyebrow>Promise</Eyebrow>
              <div style={{ marginTop: 24 }}>
                <Guarantee product={product} />
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Checkout finale ──────────────────────────────────────────── */}
      <Section id={`order-${slug}`} data-tone="ink">
        <Container data-width="narrow">
          <Reveal>
            <Eyebrow
              style={{
                color: "var(--lp-fg-faint)",
                justifyContent: "center",
                display: "flex",
              }}
            >
              Order
            </Eyebrow>
            <Headline
              as="h2"
              data-size="xl"
              style={{
                marginTop: 24,
                textAlign: "center",
                color: "var(--lp-fg-on-ink)",
                maxWidth: "16ch",
                marginInline: "auto",
                fontWeight: 400,
              }}
            >
              Take one <em>home</em>.
            </Headline>
            <p
              style={{
                marginTop: 16,
                textAlign: "center",
                color: "var(--lp-fg-faint)",
                fontSize: 14,
              }}
            >
              {lp.checkoutNote || "Ships in 2 business days."}
            </p>
          </Reveal>
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
                fontSize: 16,
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