// Shared section primitives used by every theme. Each component renders a
// semantic structure (section / container / eyebrow / headline) but inherits
// all colors, type and motion from the theme via CSS custom properties.
//
// Themes set their tokens on `[data-theme]` elements; everything below is
// theme-agnostic.

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * <Section> — themed section with consistent vertical rhythm.
 * `tone` swaps the background between theme-controlled surfaces so themes
 * can express pacing without each theme needing its own background class.
 */
type SectionProps = React.HTMLAttributes<HTMLElement> & {
  as?: keyof React.JSX.IntrinsicElements;
  tone?: "canvas" | "raised" | "sunken" | "ink";
  width?: "default" | "narrow" | "wide" | "full";
};

export function Section({
  as,
  tone = "canvas",
  width,
  className,
  children,
  ...rest
}: SectionProps) {
  const Tag = (as ?? "section") as React.ElementType;
  return (
    <Tag
      data-tone={tone}
      data-width={width}
      className={cn("lp-section", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** <Container> — max-width gutter that respects the theme's reading width. */
type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  width?: "default" | "narrow" | "wide";
};

export function Container({
  width,
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <div
      data-width={width}
      className={cn("lp-container", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/** <Eyebrow> — small uppercase label above a headline. */
type EyebrowProps = React.HTMLAttributes<HTMLSpanElement>;

export function Eyebrow({ className, children, ...rest }: EyebrowProps) {
  return (
    <span className={cn("lp-eyebrow", className)} {...rest}>
      {children}
    </span>
  );
}

/** <Headline> — themed display heading. `as` defaults to h2; size is themed. */
type HeadlineProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2" | "h3";
  size?: "sm" | "md" | "lg" | "xl" | "display";
};

export function Headline({
  as: Tag = "h2",
  size = "lg",
  className,
  children,
  ...rest
}: HeadlineProps) {
  return (
    <Tag data-size={size} className={cn("lp-headline", className)} {...rest}>
      {children}
    </Tag>
  );
}

/** <Lede> — slightly larger subhead body text used under a hero headline. */
type LedeProps = React.HTMLAttributes<HTMLParagraphElement>;

export function Lede({ className, children, ...rest }: LedeProps) {
  return (
    <p className={cn("lp-lede", className)} {...rest}>
      {children}
    </p>
  );
}

/** <Marquee> — horizontally scrolling text strip; loops via duplicated items. */
type MarqueeProps = {
  items: React.ReactNode[];
  /** Per-item React key seed; defaults to index. */
  itemKey?: (item: React.ReactNode, i: number) => React.Key;
  duration?: number;
  className?: string;
};

export function Marquee({
  items,
  itemKey,
  duration = 36,
  className,
}: MarqueeProps) {
  const keyFn = itemKey ?? ((_, i) => i);
  return (
    <div className={cn("lp-marquee", className)}>
      <div
        className="lp-marquee__track"
        style={{ animationDuration: `${duration}s` }}
      >
        {items.map((it, i) => (
          <span key={`a-${keyFn(it, i)}`} className="lp-marquee__item">
            {it}
          </span>
        ))}
        {items.map((it, i) => (
          <span
            key={`b-${keyFn(it, i)}`}
            className="lp-marquee__item"
            aria-hidden
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * <Button> — themed call-to-action. Renders as <button> by default; pass
 * `as="a"` to render an <a> (with `href`, `target`, etc).
 */
type ButtonProps = (
  | (React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" })
  | (React.AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a" })
) & {
  tone?: "primary" | "ghost" | "ink" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button(props: ButtonProps) {
  const {
    as = "button",
    tone = "primary",
    size = "md",
    className,
    children,
    ...rest
  } = props;

  if (as === "a") {
    const anchorRest = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        data-tone={tone}
        data-size={size}
        className={cn("lp-btn", className)}
        {...anchorRest}
      >
        {children}
      </a>
    );
  }

  const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      data-tone={tone}
      data-size={size}
      className={cn("lp-btn", className)}
      {...buttonRest}
    >
      {children}
    </button>
  );
}