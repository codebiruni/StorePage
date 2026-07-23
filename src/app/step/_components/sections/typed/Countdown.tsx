"use client";

/**
 * Countdown section — urgency timer. Updates every second on the client.
 * When `endsAt` is in the past, shows an "Offer ended" state.
 */

import { useEffect, useState } from "react";
import type { CountdownSectionData } from "@/app/step/_lib/landing-config";

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
}: {
  data: CountdownSectionData;
}) {
  const target = new Date(data.endsAt).getTime();
  const [state, setState] = useState(() => diff(target));

  useEffect(() => {
    setState(diff(target));
    const id = setInterval(() => setState(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <section className="lp-section" data-tone="ink" style={{ padding: "32px 0" }}>
      <div className="lp-container text-center text-white">
        {data.label ? (
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-white/80">
            {data.label}
          </p>
        ) : null}
        {state.expired ? (
          <p className="text-lg font-semibold">অফার শেষ</p>
        ) : (
          <div className="flex items-center justify-center gap-3 text-2xl font-bold tabular-nums sm:text-3xl">
            <span>{state.d} দিন</span>
            <span>·</span>
            <span>
              {pad(state.h)}:{pad(state.m)}:{pad(state.s)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}