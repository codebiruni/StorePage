"use client";

/**
 * ThemeProvider — sets ALL CSS variables that drive per-product theming.
 *
 * Every `--lp-*` token used in landing.css originates here so that
 * selecting a different preset or overriding a color in the editor
 * immediately repaints the whole page — no hardcoded colours survive.
 *
 * The outer `<div>` uses `class="contents"` so it adds no layout box,
 * but the CSS variables it declares cascade down into every descendant.
 */

import { type CSSProperties, type ReactNode } from "react";
import {
  resolveThemeTokens,
  type LandingTheme,
} from "../_lib/landing-config";

const FONT_STACKS: Record<string, string> = {
  inter:
    "var(--font-inter, ui-sans-serif), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  poppins:
    "'Poppins', var(--font-poppins, ui-sans-serif), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  hindSiliguri:
    "var(--font-bangla, 'Hind Siliguri'), 'Hind Siliguri', 'Noto Sans Bengali', 'Segoe UI', system-ui, sans-serif",
  roboto:
    "'Roboto', var(--font-inter, ui-sans-serif), system-ui, sans-serif",
  system:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};


interface Props {
  theme: LandingTheme;
  children: ReactNode;
}

export default function ThemeProvider({ theme, children }: Props) {
  const tokens = resolveThemeTokens(theme);

  const fontStack =
    FONT_STACKS[tokens.font] ?? tokens.font ?? FONT_STACKS.inter;

  // ── All --lp-* CSS variables ──────────────────────────────────────────
  // Every variable that appears anywhere in landing.css is set here so
  // picking a preset (or overriding one color) propagates everywhere.
  const style = {
    // Brand
    "--lp-primary": tokens.primary,
    "--lp-heading": tokens.heading,
    "--lp-accent": tokens.accent,
    "--lp-accent-soft": tokens.accentSoft,

    // Backgrounds
    "--lp-bg": tokens.background,
    "--lp-bg-raised": tokens.surface,
    "--lp-bg-sunken": tokens.sunken,
    "--lp-bg-ink": tokens.ink,
    "--lp-card-bg": tokens.surface,

    // Foregrounds
    "--lp-fg": tokens.text,
    "--lp-fg-muted": tokens.textMuted,
    "--lp-fg-faint": tokens.textMuted, // slight shortcut; can be refined per-preset
    "--lp-fg-on-ink": tokens.textOnInk,

    // Lines / borders
    "--lp-line": tokens.line,

    // Shape
    "--lp-radius": tokens.radius,
    "--lp-radius-lg": `calc(${tokens.radius} + 4px)`,
    "--lp-btn-radius": tokens.radius === "9999px" ? "9999px" : tokens.radius,

    // Typography — set both the old `font-family` shorthand AND the
    // `--lp-font-*` variables that landing.css uses in .lp-headline /
    // .lp-lede / .lp-eyebrow.
    fontFamily: fontStack,
    "--lp-font-display": fontStack,
    "--lp-font-body": fontStack,
  } as CSSProperties & Record<`--${string}`, string>;

  return (
    <div data-lp-theme={theme.presetId} style={style} className="contents">
      {theme.customCss ? (
        <style dangerouslySetInnerHTML={{ __html: theme.customCss }} />
      ) : null}
      {children}
    </div>
  );
}