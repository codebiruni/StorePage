"use client";

/* eslint-disable @next/next/no-img-element */

/**
 * `YouTubePreview` — single component used both inside the dashboard's
 * Landing Page Builder (live preview while typing) and on the public
 * `/step/[id]` landing page (final embedded video).
 *
 * Behavior:
 *  - If `interactive` is true (dashboard), the component shows a
 *    thumbnail with a play button overlay on first render and only
 *    mounts the iframe on click. This keeps the dashboard lightweight
 *    and avoids loading YouTube's heavy player until the user wants it.
 *  - If `interactive` is false (public landing), the iframe is mounted
 *    immediately so the customer sees motion on first paint.
 *  - If the URL is invalid, a small "Invalid URL" hint is rendered so
 *    the admin knows to fix it.
 *
 * All sizing is controlled via the `className` prop on the outer
 * wrapper so callers can drop it into any layout.
 */

import { useState, useMemo } from "react";
import { Play, AlertCircle } from "lucide-react";
import { toEmbedUrl, youtubeThumbnail } from "@/lib/youtube";

export interface YouTubePreviewProps {
  /** YouTube or Vimeo URL. Falsy → component renders nothing. */
  url?: string | null;

  /** Optional caption rendered below the player (landing page only). */
  caption?: string;

  /** Dashboard mode = click-to-play. Public mode = autoload iframe. */
  interactive?: boolean;

  /** Aspect ratio of the player. Default `16/9`. */
  aspect?: "16/9" | "4/3" | "1/1";

  /** Extra classes for the outer wrapper. */
  className?: string;

  /** Title for the iframe (a11y). Defaults to "Product video". */
  title?: string;
}

const ASPECT_CLASS: Record<NonNullable<YouTubePreviewProps["aspect"]>, string> = {
  "16/9": "aspect-video",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
};

export default function YouTubePreview({
  url,
  caption,
  interactive = false,
  aspect = "16/9",
  className = "",
  title = "Product video",
}: YouTubePreviewProps) {
  const [activated, setActivated] = useState(false);
  const [hadError, setHadError] = useState(false);

  const embed = useMemo(() => toEmbedUrl(url), [url]);
  const thumb = useMemo(() => {
    if (!url) return null;
    const ytMatch = url.match(
      /(?:v=|\/)([A-Za-z0-9_-]{11})(?:[?&/]|$)/,
    );
    return ytMatch ? youtubeThumbnail(ytMatch[1], "high") : null;
  }, [url]);

  // Nothing to show.
  if (!url) return null;

  // Invalid / untrusted URL — show a soft warning so the admin notices.
  if (!embed) {
    return (
      <div
        className={`flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 ${className}`}
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Invalid YouTube / video URL</p>
          <p className="mt-0.5 opacity-80">
            Use a link like{" "}
            <code className="rounded bg-amber-100 px-1">
              https://www.youtube.com/watch?v=…
            </code>{" "}
            or{" "}
            <code className="rounded bg-amber-100 px-1">
              https://youtu.be/…
            </code>
            .
          </p>
        </div>
      </div>
    );
  }

  const showIframe = !interactive || activated;

  return (
    <div className={className}>
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm ${ASPECT_CLASS[aspect]}`}
      >
        {showIframe ? (
          <iframe
            src={embed}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading={interactive ? "lazy" : "eager"}
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setHadError(true)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setActivated(true)}
            className="group absolute inset-0 flex h-full w-full items-center justify-center bg-black text-white"
            aria-label={`Play ${title}`}
          >
            {thumb ? (
              // Background thumbnail with dark overlay.
              <img
                src={thumb}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:opacity-60"
                onError={(e) => {
                  // Hide broken thumbnail — fall back to solid bg.
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null}
            <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg transition group-hover:scale-110">
              <Play className="h-7 w-7 fill-current" />
            </span>
          </button>
        )}
      </div>

      {caption ? (
        <p className="mt-2 text-center text-xs text-slate-500">{caption}</p>
      ) : null}

      {hadError ? (
        <p className="mt-2 text-center text-xs text-rose-500">
          Video failed to load — please check the URL.
        </p>
      ) : null}
    </div>
  );
}