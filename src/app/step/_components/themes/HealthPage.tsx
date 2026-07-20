"use client";

/**
 * HealthPage — single-file render of the Health theme.
 *
 * Layout mirrors the reference HTML exactly:
 *   1. Header          — logo placeholder + "Contact us" CTA
 *   2. Hero            — headline + sub + green CTA + product image
 *   3. Benefits        — image left + check-bullet list + CTA
 *   4. Video           — YouTube section (when configured)
 *   5. Comparison      — আমরা (dot bullets) | img | অন্যরা (cross bullets)
 *   6. Phone CTA       — full-bleed green-dark band with tel link
 *   7. Order form      — Billing details + order summary + confirm CTA
 *   8. Footer          — copyright + "designed by" line
 *   9. Sticky CTA      — bottom-pinned অর্ডার button
 *  10. Phone Whatsapp  — floating tel/WhatsApp shortcut
 *
 * All copy falls back to the product's own name/price/etc. so an empty
 * `landingPage` still renders a complete page. Colors come from the
 * `[data-theme="health"]` CSS tokens in `landing.css`.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";
import type { ILandingPage } from "@/app/step/_lib/landing-shared";
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider";
import StickyCTA from "@/app/step/_components/sections/StickyCTA";
import PhoneWhatsapp from "@/app/step/_components/sections/PhoneWhatsapp";

interface Props {
  product: SerializedLandingProduct;
  slug: string;
}

export default function HealthPage({ product, slug }: Props) {
  const lp = ((product.landingPage ?? {}) as unknown) as ILandingPage;
  const ctaLabel = lp.heroCtaLabel ?? "অর্ডার করুন";
  const orderId = `order-${slug}`;
  const main = product.images?.[0];
  const gallery = product.images?.slice(1, 4) ?? [];
  const { currentPrice } = product.generalPrice;

  const ourTitle = "আমাদের বিটরুট";
  const ourItems = [
    "কাচা বিটরুট এর রস থেকে পাউডার করা হয়েছে।",
    "প্রাকৃতিক গাঢ় লাল রঙ ও মিষ্টি-মাটির স্বাদ",
    "তাজা বিটরুটের মতো প্রাকৃতিক ঘ্রাণ",
    "সঠিকভাবে প্যাকেজিংয়ের ফলে দীর্ঘস্থায়ী",
  ];
  const otherTitle = "বাজারের অন্যান্য বিটরুট";
  const otherItems = [
    "কৃত্রিম রঙ বা প্রিজারভেটিভ মেশানো হয়",
    "কৃত্রিম রঙের কারণে অস্বাভাবিক উজ্জ্বল",
    "অনেক সময় কৃত্রিম ফ্লেভার থাকে",
    "অনেক সময় আর্দ্রতা ধরে রাখে, দ্রুত নষ্ট হয়",
  ];

  return (
    <>
      <div data-theme="health" className="health-page">
        <HeaderBar />
        <Hero
          product={product}
          ctaLabel={ctaLabel}
          orderId={orderId}
          mainImage={main}
        />
        <BenefitsSection
          product={product}
          ctaLabel={ctaLabel}
          orderId={orderId}
          image={main ?? gallery[0]}
        />
        {lp.youtubeUrl ? (
          <VideoSection url={lp.youtubeUrl} />
        ) : null}
        <ComparisonSection
          ourTitle={ourTitle}
          ourItems={ourItems}
          otherTitle={otherTitle}
          otherItems={otherItems}
          image={gallery[1]}
        />
        <PhoneCta note={lp.phoneStripNote ?? "ফোনে অর্ডার করুন অথবা প্রয়োজনে কল করুন"} />
        <OrderSection product={product} price={currentPrice} />
        <FooterBar />
      </div>
      <StickyCTA product={product} slug={slug} label={ctaLabel} variant="health" />
      <PhoneWhatsapp variant="health" />
    </>
  );
}

/* ─── 1. Header ─────────────────────────────────────────────────────── */

function HeaderBar() {
  const { config } = useSiteConfig();
  const phone = config?.contact?.phone ?? "+8801789525251";
  return (
    <header className="hp-header">
      <div className="hp-wrap hp-header__inner">
        <a href="#" className="hp-logo">
          <span className="hp-logo__placeholder">
            <span aria-hidden>🖼️</span>Logo image
            <br />160×52
          </span>
        </a>
        <a className="hp-btn hp-btn--outline" href={`tel:${phone}`}>
          Contact us
        </a>
      </div>
    </header>
  );
}

/* ─── 2. Hero ───────────────────────────────────────────────────────── */

function Hero({
  product,
  ctaLabel,
  orderId,
  mainImage,
}: {
  product: SerializedLandingProduct;
  ctaLabel: string;
  orderId: string;
  mainImage?: string;
}) {
  return (
    <section className="hp-hero">
      <div className="hp-wrap hp-hero__grid">
        <div>
          <h1 className="hp-hero__title">
            {product.landingPage?.heroTitle ?? product.name}
          </h1>
          {product.landingPage?.heroSubtitle ? (
            <p className="hp-hero__lede">{product.landingPage.heroSubtitle}</p>
          ) : (
            <p className="hp-hero__lede">
              বিটরুটে পর্যাপ্ত পরিমাণে ভিটামিন এ, ভিটামিন কে, আয়রন,
              পটাশিয়াম, ম্যাগনেশিয়াম, ক্যালসিয়াম, কপার এবং অন্যান্য প্রয়োজনীয়
              পুষ্টি উপাদান পাওয়া যায়।
            </p>
          )}
          <a className="hp-btn hp-btn--solid" href={`#${orderId}`}>
            {ctaLabel}
          </a>
        </div>
        <div className="hp-placeholder hp-placeholder--square">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainImage} alt={product.name} className="hp-img" />
          ) : (
            <span>
              <span className="hp-placeholder__icon" aria-hidden>🖼️</span>
              Product image
              <br />1024×1024
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── 3. Benefits ───────────────────────────────────────────────────── */

function BenefitsSection({
  product,
  ctaLabel,
  orderId,
  image,
}: {
  product: SerializedLandingProduct;
  ctaLabel: string;
  orderId: string;
  image?: string;
}) {
  const lp = product.landingPage;
  const title = "বিটরুটের উপকারিতা";
  const lead = "বিটরুট জুস নিয়মিত খেলে আমরা যে সব রোগ থেকে মুক্তি পাবো:";
  const benefits = (lp?.benefits ?? []).filter(Boolean);
  const items =
    benefits.length > 0
      ? benefits
      : [
          "ফ্যাটি লিভার ভালো করে।",
          "উচ্চ রক্তচাপ এবং রক্তে শর্করার মাত্রা নিয়ন্ত্রণ",
          "স্মৃতি শক্তি বাড়াতে সাহায্য করে",
          "উচ্চ রক্তচাপ নিয়ন্ত্রণে রাখে",
          "হৃদরোগের সমস্যা কমায়",
          "ডায়াবেটিস নিয়ন্ত্রণে রাখে",
          "কিডনি ও লিভার ভালো রাখে",
          "রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি করে",
        ];
  return (
    <section className="hp-section hp-benefits">
      <div className="hp-wrap hp-benefits__grid">
        <h2 className="hp-benefits__heading">{title}</h2>
        <p className="hp-benefits__lead">{lead}</p>

        <div className="hp-placeholder hp-placeholder--square">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.name} className="hp-img" />
          ) : (
            <span>
              <span className="hp-placeholder__icon" aria-hidden>🖼️</span>
              Image
              <br />1024×1024
            </span>
          )}
        </div>

        <div>
          <ul className="hp-list hp-list--check">
            {items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
          <a
            className="hp-btn hp-btn--solid hp-benefits__cta"
            href={`#${orderId}`}
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── 4. Video ──────────────────────────────────────────────────────── */

function VideoSection({ url }: { url: string }) {
  // Light wrapper — the YouTube iframe comes from ShowcaseVideo in the
  // shared section library; here we just paste the URL into an iframe so
  // the page stays self-contained and matches the reference HTML.
  const id = extractYoutubeId(url);
  const src = id
    ? `https://www.youtube.com/embed/${id}`
    : url;
  return (
    <section className="hp-section hp-video">
      <div className="hp-wrap">
        <h2 className="hp-video__heading">প্রোডাক্ট ভিডিও দেখুন</h2>
        <div className="hp-placeholder hp-placeholder--video">
          {id ? (
            <iframe
              src={src}
              title="Product video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="hp-iframe"
            />
          ) : (
            <span>
              <span className="hp-placeholder__icon" aria-hidden>▶️</span>
              Video placeholder
              <br />16:9
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function extractYoutubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  );
  return m ? m[1] : null;
}

/* ─── 5. Comparison ─────────────────────────────────────────────────── */

function ComparisonSection({
  ourTitle,
  ourItems,
  otherTitle,
  otherItems,
  image,
}: {
  ourTitle: string;
  ourItems: string[];
  otherTitle: string;
  otherItems: string[];
  image?: string;
}) {
  return (
    <section className="hp-section hp-compare">
      <div className="hp-wrap">
        <h2 className="hp-compare__heading">আমরা VS অন্যরা</h2>
        <p className="hp-compare__sub">
          চলুন জেনে নেওয়া যাক বাজারের বিটরুট আর আমাদের বিটরুটের মধ্যেকার
          পার্থক্য
        </p>

        <div className="hp-compare__grid">
          <div className="hp-compare__col hp-compare__col--ours">
            <h3 className="hp-compare__col-title hp-compare__col-title--ours">
              {ourTitle}
            </h3>
            <ul className="hp-list hp-list--dot">
              {ourItems.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ul>
          </div>

          <div className="hp-placeholder hp-placeholder--square hp-compare__img">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="hp-img" />
            ) : (
              <span>
                <span className="hp-placeholder__icon" aria-hidden>🖼️</span>
                Image
                <br />1600×1600
              </span>
            )}
          </div>

          <div className="hp-compare__col hp-compare__col--theirs">
            <h3 className="hp-compare__col-title hp-compare__col-title--theirs">
              {otherTitle}
            </h3>
            <ul className="hp-list hp-list--cross">
              {otherItems.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 6. Phone CTA ──────────────────────────────────────────────────── */

function PhoneCta({ note }: { note: string }) {
  const { config } = useSiteConfig();
  const phone = config?.contact?.phone ?? "+8801789525251";
  return (
    <section className="hp-phone-cta">
      <div className="hp-wrap hp-phone-cta__inner">
        <h2>{note}</h2>
        <a className="hp-btn hp-btn--ghost" href={`tel:${phone}`}>
          <Phone size={16} />
          <span>ফোন করুন</span>
        </a>
      </div>
    </section>
  );
}

/* ─── 7. Order form ─────────────────────────────────────────────────── */

function OrderSection({
  product,
  price,
}: {
  product: SerializedLandingProduct;
  price: number;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { config: siteConfig } = useSiteConfig();
  const deliveryCharge = siteConfig?.deliveryCharge?.outsideDhaka ?? 0;
  const grandTotal = price + deliveryCharge;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          number,
          address,
          products: [product._id],
          totalAmount: price,
          deliveryCharge,
          grandTotal,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message ?? "Order could not be placed");
      }
      const createdOrderId: string | undefined =
        json?.data?.orderId ?? json?.orderId ?? json?.data?._id;
      const target = createdOrderId
        ? `/step/thanks?orderId=${encodeURIComponent(createdOrderId)}`
        : "/step/thanks";
      router.push(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <section className="hp-section hp-order" id={`order-${product._id}`}>
      <div className="hp-wrap">
        <h2 className="hp-order__heading">অর্ডার করতে নিচের ফর্মটি পূরণ করুন</h2>
        <form onSubmit={submit} className="hp-order__box">
          <h3 className="hp-order__sub">Billing details</h3>

          <label className="hp-field">
            <span>আপনার নাম</span>
            <input
              type="text"
              placeholder="আপনার নাম লিখুন"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="hp-field">
            <span>আপনার মোবাইল নাম্বার</span>
            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
          </label>
          <label className="hp-field">
            <span>আপনার সম্পূর্ণ ঠিকানা</span>
            <textarea
              placeholder="বাসা/হোল্ডিং, রোড, থানা, জেলা"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </label>

          <h3 className="hp-order__sub">Your order</h3>
          <div className="hp-order__summary">
            <div className="hp-order__row">
              <span>{product.name} × 1</span>
              <span>৳{price}</span>
            </div>
            <div className="hp-order__row hp-order__row--total">
              <span>Total</span>
              <span>৳{grandTotal}</span>
            </div>
          </div>

          {error ? <div className="hp-order__error">{error}</div> : null}
          <button type="submit" disabled={loading} className="hp-btn hp-btn--solid hp-btn--block">
            {loading ? "অপেক্ষা করুন…" : "অর্ডার কনফার্ম করুন"}
          </button>
        </form>
      </div>
    </section>
  );
}

/* ─── 8. Footer ─────────────────────────────────────────────────────── */

function FooterBar() {
  return (
    <footer className="hp-footer">
      <div className="hp-wrap">
        <p>Copyright by © 2026 {process.env.NEXT_PUBLIC_BRAND ?? "STORE"}</p>
        <p className="hp-footer__powered">
          Website Designed by
          <span className="hp-logo__placeholder hp-logo__placeholder--mini">
            logo
          </span>
        </p>
      </div>
    </footer>
  );
}
