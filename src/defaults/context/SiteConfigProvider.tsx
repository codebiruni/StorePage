"use client";

/**
 * SiteConfigProvider
 *
 * Hydrates a React context with the merged site config (env defaults ⨯
 * siteInfo DB overrides) by fetching `/api/site-info` on mount. Components
 * read brand text via `useSiteConfig()` so the same codebase serves any
 * deployment.
 *
 * While the fetch is in flight, `loading` is true and `config` is `null` —
 * render guards in consuming components should fall back to the env defaults
 * passed at SSR so there's no layout shift or unstyled flash.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SiteConfig } from "@/lib/siteConfig";

interface SiteConfigContextValue {
  config: SiteConfig;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextValue | undefined>(
  undefined,
);

interface SiteConfigProviderProps {
  children: ReactNode;
  /** Passed from the server layout via `generateMetadata` so the first paint matches. */
  initialConfig: SiteConfig;
}

export default function SiteConfigProvider({
  children,
  initialConfig,
}: SiteConfigProviderProps) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [loading, setLoading] = useState(false);

  const refresh = useMemo(
    () =>
      async function refresh() {
        setLoading(true);
        try {
          const res = await fetch("/api/site-info", { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (json?.success && json.data) {
            setConfig(json.data as SiteConfig);
          }
        } catch (err) {
          // Silent failure — we already have the SSR-enriched `initialConfig`.
          console.warn("SiteConfigProvider: failed to refresh siteInfo", err);
        } finally {
          setLoading(false);
        }
      },
    [],
  );

  // Re-fetch on mount so an updated siteInfo (after an admin edit) is picked
  // up without a full page reload.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Synchronize CSS custom properties on document root so buttons and primary
  // accents across the frontend ecommerce respond instantly to branding edits.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (config.buttonColor) {
      root.style.setProperty("--primary", config.buttonColor, "important");
      root.style.setProperty("--color-primary", config.buttonColor, "important");
      root.style.setProperty("--ring", config.buttonColor, "important");
      root.style.setProperty("--theme-button-bg", config.buttonColor, "important");
      root.style.setProperty("--lp-accent", config.buttonColor, "important");
    }
    if (config.buttonTextColor) {
      root.style.setProperty("--primary-foreground", config.buttonTextColor, "important");
      root.style.setProperty("--color-primary-foreground", config.buttonTextColor, "important");
      root.style.setProperty("--theme-button-fg", config.buttonTextColor, "important");
    }

    // Also update the dynamic <style id="site-button-colors"> tag in <head>
    let styleTag = document.getElementById("site-button-colors") as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "site-button-colors";
      document.head.appendChild(styleTag);
    }
    if (config.buttonColor) {
      styleTag.textContent = `:root, .dark, [data-theme], body {
  --primary: ${config.buttonColor} !important;
  --color-primary: ${config.buttonColor} !important;
  --theme-button-bg: ${config.buttonColor} !important;
  --ring: ${config.buttonColor} !important;
  --lp-accent: ${config.buttonColor} !important;
  ${config.buttonTextColor ? `--primary-foreground: ${config.buttonTextColor} !important;
  --color-primary-foreground: ${config.buttonTextColor} !important;
  --theme-button-fg: ${config.buttonTextColor} !important;` : ""}
}`;
    }
  }, [config.buttonColor, config.buttonTextColor]);

  const value = useMemo(
    () => ({ config, loading, refresh }),
    [config, loading, refresh],
  );

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
}

/**
 * Client-safe env-only fallback. We intentionally read `process.env` here
 * (NOT the typed `env`/`publicEnv` modules) so importing this hook from a
 * client component does NOT pull `connectdb` → `requireString('MONGODB_URI')`
 * into the client bundle. The `NEXT_PUBLIC_` keys are safe to read inline.
 */
function getClientEnvDefaults(): SiteConfig {
  const env = (k: string, fallback = ""): string =>
    typeof process !== "undefined" && process.env && process.env[k]
      ? (process.env[k] as string)
      : fallback;

  return {
    name: env("NEXT_PUBLIC_BRAND_NAME", "My Store"),
    tagline: env(
      "NEXT_PUBLIC_BRAND_TAGLINE",
      "Quality products, fast delivery",
    ),
    logo: env("NEXT_PUBLIC_DEFAULT_LOGO", "/logo.png"),
    themeColor: env("NEXT_PUBLIC_THEME_COLOR", "#0f172a"),
    buttonColor: env(
      "NEXT_PUBLIC_BUTTON_COLOR",
      env("NEXT_PUBLIC_THEME_COLOR", "#0f172a"),
    ),
    buttonTextColor: env("NEXT_PUBLIC_BUTTON_TEXT_COLOR", "#ffffff"),
    contact: {
      email: env("NEXT_PUBLIC_CONTACT_EMAIL"),
      phone: env("NEXT_PUBLIC_CONTACT_PHONE"),
    },
    social: {
      facebook: env("NEXT_PUBLIC_FACEBOOK_URL"),
      youtube: env("NEXT_PUBLIC_YOUTUBE_URL"),
      instagram: env("NEXT_PUBLIC_INSTAGRAM_URL"),
      linkedIn: env("NEXT_PUBLIC_LINKEDIN_URL"),
      whatsApp: env("NEXT_PUBLIC_WHATSAPP_NUMBER"),
      twitter: env("NEXT_PUBLIC_TWITTER_URL"),
    },
    marqueeText: "",
    addresses: [],
    mapLink: "",
    footerLinks: [],
    banner: {
      carousel: [],
      firstImage: {},
      secondImage: {},
    },
    siteUrl: env("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
    metaPixelId: "",
    gaMeasurementId: "",
    deliveryCharge: {
      insideDhaka: 70,
      outsideDhaka: 90,
    },
  };
}

export function useSiteConfig(): SiteConfigContextValue {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) {
    // Outside the provider (e.g., test render) — return env defaults so the
    // app still renders rather than throwing. This preserves the server-side
    // promise of "never crash on missing branding".
    return {
      config: getClientEnvDefaults(),
      loading: false,
      refresh: async () => {},
    };
  }
  return ctx;
}
