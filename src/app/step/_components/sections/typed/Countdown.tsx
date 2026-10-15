"use client";

/**
 * Countdown section — urgency timer. Updates every second on the client.
 * When `endsAt` is in the past, shows an "Offer ended" state.
 */

import { useEffect, useState } from "react";
import type { CountdownSectionData, SectionStyle } from "@/app/step/_lib/landing-config";

function diff(target: number): {
  d: number;
  h: number;
  m: number;
  s: number;
  expired: boolean;
} {
  const now = Date.now();
  const ms = target - now;
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
  return {
    d: Math.floor(ms / 86400_000),
    h: Math.floor((ms % 86400_000) / 3600_000),
    m: Math.floor((ms % 3600_000) / 60_000),
    s: Math.floor((ms % 60_000) / 1000),
    expired: false,
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function CountdownSection({
  data,
  style,
}: {
  data: CountdownSectionData;
  style?: SectionStyle;
}) {
  const target = new Date(data.endsAt).getTime();
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState(() => diff(target));

  useEffect(() => {
    setMounted(true);
    setState(diff(target));
    const id = setInterval(() => setState(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const bg = style?.backgroundColor || "var(--lp-primary)";
  const textColor = style?.textColor || "#ffffff";

  return (
    <section
      className="lp-section"
      style={{
        padding: "32px 0",
        background: bg,
        color: textColor,
      }}
    >
      <div className="lp-container text-center" style={{ color: textColor }}>
        {data.label ? (
          <p
            className="mb-3 text-sm font-medium uppercase tracking-wide opacity-90"
            style={{ color: textColor }}
          >
            {data.label}
          </p>
        ) : null}
        {state.expired ? (
          <p className="text-lg font-semibold" style={{ color: textColor }} suppressHydrationWarning>
            অফার শেষ
          </p>
        ) : (
          <div
            className="flex items-center justify-center gap-3 text-2xl font-bold tabular-nums sm:text-3xl"
            style={{ color: textColor }}
            suppressHydrationWarning
          >
            <span suppressHydrationWarning>{state.d} দিন</span>
            <span>·</span>
            <span suppressHydrationWarning>
              {pad(state.h)}:{pad(state.m)}:{pad(state.s)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}