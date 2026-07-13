// ShowcaseVideo: optional product-showcase YouTube link. Accepts both the
// legacy { url, caption, variant } API (Classic/VideoHero etc.) and the
// modern-theme shortcut { product, variant } where the URL is read from
// `product.landingPage.youtubeUrl`. The new themes use variant names like
// "cinema" / "kinetic" — we map them to the dark variant supported here.
import YouTubePreview from "@/shired-component/YouTubePreview";
import type { SerializedLandingProduct } from "@/app/step/_lib/landing-data";

export type ShowcaseVideoProps = {
  product?: SerializedLandingProduct;
  url?: string;
  caption?: string;
  variant?: string;
};

export default function ShowcaseVideo({
  product,
  url,
  caption,
  variant,
}: ShowcaseVideoProps) {
  const resolvedUrl = url ?? product?.landingPage?.youtubeUrl ?? "";
  if (!resolvedUrl || !resolvedUrl.trim()) return null;
  // Map the rich theme variants onto the dark/light toggle this component
  // already understands. Any "ink" theme (midnight / kinetic / origin /
  // pillar) maps to dark. `cinema` is an explicit alias.
  const dark =
    variant === "cinema" ||
    variant === "kinetic" ||
    variant === "midnight" ||
    variant === "origin" ||
    variant === "pillar";
  return (
    <section
      className="step-section"
      data-variant={variant}
      style={dark ? { background: "#0f172a", color: "#f8fafc" } : undefined}
    >
      <div className="step-container step-container--narrow">
        <YouTubePreview
          url={resolvedUrl}
          caption={caption ?? "Product showcase video"}
          interactive={false}
          aspect="16/9"
        />
      </div>
    </section>
  );
}