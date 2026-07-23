"use client";

/**
 * ThemeProvider — sets the CSS variables that drive per-product theming.
 *
 * Sections read their colors from `var(--lp-primary)` / `var(--lp-accent)`
 * (and the existing `--lp-*` tokens from landing.css), so swapping a theme
 * is purely a variable update — no JSX branching needed.
 *
 * The `<div>` wrapper exists so a single page can host multiple themes
 * (e.g. an editor live preview vs. the public page) without leaking
 * variables globally. The `font-family` is also written here so admin
 * can pick a per-product font stack.
 */

import { type CSSProperties, type ReactNode } from "react";
import {
  resolveThemeTokens,
  type LandingTheme,
} from "../_lib/landing-config";

const FONT_STACKS: Record<string, string> = {
  inter:
    "var(--font-inter, ui-sans-serif), system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  poppins:
    "var(--font-poppins, ui-sans-serif), system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
};

interface Props {
  theme: LandingTheme;
  children: ReactNode;
}

export default function ThemeProvider({ theme, children }: Props) {
  const tokens = resolveThemeTokens(theme);
  // Cast through CSSProperties & Record to allow arbitrary `--*` custom
  // properties. The CSSProperties type doesn't model CSS variables natively.
  const style = {
    "--lp-primary": tokens.primary,
    "--lp-accent": tokens.accent,
    fontFamily: FONT_STACKS[tokens.font] ?? FONT_STACKS.inter,
  } as CSSProperties & Record<`--${string}`, string>;
  return (
    <div data-lp-theme={theme.presetId} style={style} className="contents">
      {children}
    </div>
  );
}