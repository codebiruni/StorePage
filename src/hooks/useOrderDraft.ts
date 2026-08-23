"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseOrderDraftOptions {
  /** Source tag written to the order, e.g. "landing" or "buy-product". */
  source: "landing" | "buy-product";
  /** Minimum interval between auto-saves (ms). Default 1500. */
  debounceMs?: number;
}

export interface DraftBody {
  productId?: string;
  productIds?: string[];
  name?: string;
  number?: string;
  address?: string;
  note?: string;
  variantSku?: string;
  deliveryCharge?: number;
  totalAmount?: number;
  discount?: number;
}

/**
 * useOrderDraft
 *
 * Saves partial order data as a `draft` so leads aren't lost when the user
 * closes the tab. Returns the current `draftId` (set after the first save)
 * and a `saveDraft` function you call on every form change.
 *
 * Important: this hook does NOT mark the order as completed. Call
 * `/api/order-draft` PATCH (or pass `draftId` to your real submit endpoint)
 * after a successful final submit.
 */
export function useOrderDraft({ source, debounceMs = 1500 }: UseOrderDraftOptions) {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<DraftBody | null>(null);
  const latest = useRef<DraftBody | null>(null);

  const flush = useCallback(async () => {
    const body = pending.current;
    pending.current = null;
    if (!body) return;
    // Require at least one of: phone, name, or address to avoid spamming
    // empty docs. The backend also re-validates.
    if (!body.name && !body.number && !body.address) return;

    setSaving(true);
    try {
      const res = await fetch("/api/order-draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, source, draftId }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.draftId) {
        setDraftId(json.draftId);
      }
    } catch (err) {
      // Draft saves are best-effort — log and move on. Don't block the UI.
      console.warn("[useOrderDraft] save failed", err);
    } finally {
      setSaving(false);
    }
  }, [draftId, source]);

  const saveDraft = useCallback(
    (body: DraftBody) => {
      latest.current = body;
      pending.current = body;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush();
      }, debounceMs);
    },
    [flush, debounceMs],
  );

  /** Flush any pending debounced save synchronously (e.g. before unmount). */
  const flushNow = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    return flush();
  }, [flush]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { draftId, saving, saveDraft, flushNow };
}