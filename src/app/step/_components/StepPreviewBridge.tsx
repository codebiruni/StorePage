"use client";

/**
 * StepPreviewBridge — client-side overlay that listens for `landing-draft`
 * postMessage events from a parent window (the dashboard landing-page editor)
 * and re-renders the page using the supplied draft flat value.
 *
 * The server-rendered `LandingPageRenderer` below already shows the last
 * *saved* state. While the admin types in the editor, the parent sends
 * `{ type: "landing-draft", flat }` on every change; we replace the saved
 * config with the draft so the iframe mirrors the editor pixel-for-pixel.
 *
 * Production visitors don't post messages, so they keep seeing the saved
 * state with zero behavioural change.
 */

import { useEffect, useMemo, useState } from "react";

import LandingPageRenderer from "./LandingPageRenderer";
import { flatToConfig, type FlatLandingPage } from "../_lib/landing-adapter";
import type { LandingConfig } from "../_lib/landing-config";
import type { SerializedLandingProduct } from "../_lib/landing-shared";

interface Props {
  productId: string;
  /** Server-rendered fallback config — used until a draft arrives. */
  initialConfig: LandingConfig;
  /** Server-rendered product — passed through to the renderer. */
  product: SerializedLandingProduct;
}

type DraftMessage = {
  type: "landing-draft";
  flat: FlatLandingPage;
};

function isDraftMessage(value: unknown): value is DraftMessage {
  if (!value || typeof value !== "object") return false;
  const v = value as { type?: unknown; flat?: unknown };
  return v.type === "landing-draft" && typeof v.flat === "object" && v.flat !== null;
}

export default function StepPreviewBridge({
  productId,
  initialConfig,
  product,
}: Props) {
  const [draft, setDraft] = useState<FlatLandingPage | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent<unknown>) {
      // Only accept messages from our own window tree (the editor iframe
      // parent). Browsers don't allow restricting by origin across same-
      // origin frames reliably, but checking `event.source === window.parent`
      // is enough to reject unrelated tabs that might post messages here.
      if (typeof window === "undefined") return;
      if (event.source !== window.parent) return;
      if (!isDraftMessage(event.data)) return;
      setDraft(event.data.flat);
    }
    window.addEventListener("message", onMessage);
    // Announce readiness so the parent can flush its latest draft if one
    // was already prepared before this listener attached.
    try {
      window.parent?.postMessage({ type: "landing-preview-ready", productId }, "*");
    } catch {
      /* ignore — parent may be cross-origin in dev preview setups */
    }
    return () => window.removeEventListener("message", onMessage);
  }, [productId]);

  const activeConfig = useMemo<LandingConfig>(() => {
    if (!draft) return initialConfig;
    return flatToConfig(productId, product.slug || productId, draft);
  }, [draft, initialConfig, productId, product.slug]);

  return <LandingPageRenderer config={activeConfig} product={product} />;
}
