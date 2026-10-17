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

import { useEffect, useMemo, useRef, useState } from "react";

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

function isParentMobile(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.parent && window.parent !== window) {
      return window.parent.innerWidth < 1024;
    }
  } catch {
    /* ignore cross-origin */
  }
  return window.innerWidth < 768;
}

export default function StepPreviewBridge({
  productId,
  initialConfig,
  product,
}: Props) {
  const [draft, setDraft] = useState<FlatLandingPage | null>(null);
  const ignoreScrollSyncRef = useRef<number>(0);
  const lastReportedSectionRef = useRef<string | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent<unknown>) {
      // Only accept messages from our own window tree (the editor iframe
      // parent). Browsers don't allow restricting by origin across same-
      // origin frames reliably, but checking `event.source === window.parent`
      // is enough to reject unrelated tabs that might post messages here.
      if (typeof window === "undefined") return;
      if (event.source !== window.parent) return;

      const data = event.data as { type?: unknown; flat?: unknown; sectionId?: unknown } | null;
      if (!data) return;

      if (isDraftMessage(data)) {
        setDraft(data.flat);
        return;
      }

      if (data.type === "scroll-to-preview-section" && typeof data.sectionId === "string") {
        if (isParentMobile()) return;
        const sid = data.sectionId;
        const targetId = sid === "order" ? "section-order" : `section-${sid}`;
        const el = document.getElementById(targetId);
        if (el) {
          ignoreScrollSyncRef.current = Date.now() + 800;
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
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

  // When rendered in an iframe, sync preview scrolls and clicks back to the builder (desktop only)
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;

    let ticking = false;
    function handleScroll() {
      // On mobile view, preview scrolling should not trigger section sync back to builder
      if (isParentMobile()) return;
      if (Date.now() < ignoreScrollSyncRef.current) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (isParentMobile()) return;
        if (Date.now() < ignoreScrollSyncRef.current) return;

        const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section-id]"));
        if (sections.length === 0) return;

        const viewportAnchor = window.innerHeight * 0.35;
        let closestId: string | null = null;
        let minDistance = Infinity;

        for (const el of sections) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= viewportAnchor && rect.bottom >= viewportAnchor) {
            closestId = el.getAttribute("data-section-id");
            break;
          }
          const dist = Math.abs(rect.top - viewportAnchor);
          if (dist < minDistance) {
            minDistance = dist;
            closestId = el.getAttribute("data-section-id");
          }
        }

        if (closestId && closestId !== lastReportedSectionRef.current) {
          lastReportedSectionRef.current = closestId;
          try {
            window.parent?.postMessage(
              { type: "preview-section-in-view", sectionId: closestId },
              "*"
            );
          } catch {
            /* ignore */
          }
        }
      });
    }

    function handleClick(e: MouseEvent) {
      if (isParentMobile()) return;
      const target = (e.target as HTMLElement).closest("[data-section-id]");
      if (target) {
        const sectionId = target.getAttribute("data-section-id");
        if (sectionId) {
          try {
            window.parent?.postMessage(
              { type: "preview-section-clicked", sectionId },
              "*"
            );
          } catch {
            /* ignore */
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick, true);
    };
  }, []);

  const activeConfig = useMemo<LandingConfig>(() => {
    if (!draft) return initialConfig;
    return flatToConfig(productId, product.slug || productId, draft);
  }, [draft, initialConfig, productId, product.slug]);

  return <LandingPageRenderer config={activeConfig} product={product} />;
}
