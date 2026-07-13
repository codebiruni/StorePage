/**
 * YouTube / Vimeo URL helpers.
 *
 * `toEmbedUrl` converts a watch / share link into a safe `iframe` `src`
 * suitable for both the public landing page and the dashboard preview.
 * `getYouTubeId` returns just the video id (or null) — useful for
 * thumbnails or analytics.
 *
 * The parser is intentionally strict: only well-known hosts are accepted
 * so we never proxy an attacker-controlled origin through an embed.
 */
export type VideoProvider = "youtube" | "vimeo" | null;

/** Extract the raw 11-char YouTube id from any common URL shape. */
export function getYouTubeId(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.toLowerCase();
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\/+/, "").split("/")[0];
      return /^[A-Za-z0-9_-]{6,15}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      // /watch?v=ID, /embed/ID, /shorts/ID, /live/ID
      const v = u.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{6,15}$/.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) =>
        ["embed", "shorts", "live", "v"].includes(p),
      );
      if (idx >= 0 && parts[idx + 1] && /^[A-Za-z0-9_-]{6,15}$/.test(parts[idx + 1])) {
        return parts[idx + 1];
      }
    }
  } catch {
    // fall through
  }
  return null;
}

export function getVimeoId(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    if (!u.hostname.toLowerCase().includes("vimeo.com")) return null;
    const id = u.pathname.split("/").filter(Boolean).pop();
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function detectProvider(raw?: string | null): VideoProvider {
  if (!raw) return null;
  try {
    const host = new URL(raw.trim()).hostname.toLowerCase();
    if (host.includes("youtube") || host === "youtu.be") return "youtube";
    if (host.includes("vimeo.com")) return "vimeo";
  } catch {
    return null;
  }
  return null;
}

/**
 * Convert a watch / share URL to a safe `iframe` `src` for embedding.
 * Returns `null` if the URL is empty, malformed, or from an untrusted
 * host — callers should fall back to a placeholder in that case.
 */
export function toEmbedUrl(
  raw?: string | null,
  opts: { autoplay?: boolean; mute?: boolean } = {},
): string | null {
  const yt = getYouTubeId(raw);
  if (yt) {
    const params = new URLSearchParams();
    params.set("rel", "0");
    params.set("modestbranding", "1");
    if (opts.autoplay) params.set("autoplay", "1");
    if (opts.mute) params.set("mute", "1");
    params.set("playsinline", "1");
    return `https://www.youtube-nocookie.com/embed/${yt}?${params.toString()}`;
  }
  const vimeo = getVimeoId(raw);
  if (vimeo) {
    const params = new URLSearchParams();
    if (opts.autoplay) params.set("autoplay", "1");
    if (opts.mute) params.set("muted", "1");
    return `https://player.vimeo.com/video/${vimeo}?${params.toString()}`;
  }
  return null;
}

/**
 * High-resolution thumbnail for the given YouTube id. Used as the
 * preview thumbnail while no iframe is loaded.
 */
export function youtubeThumbnail(
  id: string | null,
  quality: "max" | "high" | "medium" | "default" = "high",
): string | null {
  if (!id) return null;
  return `https://i.ytimg.com/vi/${id}/${quality}default.jpg`;
}