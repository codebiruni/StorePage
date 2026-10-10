import { describe, expect, it } from "vitest";
import {
    detectProvider,
    getVimeoId,
    getYouTubeId,
    toEmbedUrl,
    youtubeThumbnail,
} from "@/lib/youtube";

describe("lib/youtube › getYouTubeId", () => {
    it("returns null for empty / nullish input", () => {
        expect(getYouTubeId()).toBeNull();
        expect(getYouTubeId(null)).toBeNull();
        expect(getYouTubeId("")).toBeNull();
        expect(getYouTubeId("   ")).toBeNull();
    });

    it("parses a standard watch URL", () => {
        expect(getYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
            "dQw4w9WgXcQ",
        );
    });

    it("parses a youtu.be short URL", () => {
        expect(getYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("parses youtu.be with extra path segments", () => {
        expect(getYouTubeId("https://youtu.be/dQw4w9WgXcQ?t=42")).toBe(
            "dQw4w9WgXcQ",
        );
    });

    it("parses /embed/ and /shorts/ and /live/ URLs", () => {
        expect(getYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
            "dQw4w9WgXcQ",
        );
        expect(getYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
            "dQw4w9WgXcQ",
        );
        expect(getYouTubeId("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe(
            "dQw4w9WgXcQ",
        );
    });

    it("parses youtube-nocookie.com hosts", () => {
        expect(
            getYouTubeId("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
        ).toBe("dQw4w9WgXcQ");
    });

    it("trims surrounding whitespace before parsing", () => {
        expect(getYouTubeId("  https://youtu.be/dQw4w9WgXcQ  ")).toBe(
            "dQw4w9WgXcQ",
        );
    });

    it("rejects untrusted hosts (SSRF guard)", () => {
        expect(getYouTubeId("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
        expect(getYouTubeId("https://notyoutube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
        expect(getYouTubeId("https://evilyoutube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
        expect(
            getYouTubeId("https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ"),
        ).toBeNull();
    });

    it("rejects malformed / non-id values", () => {
        expect(getYouTubeId("not a url")).toBeNull();
        expect(getYouTubeId("https://www.youtube.com/watch?v=ab")).toBeNull();
        expect(getYouTubeId("https://www.youtube.com/watch")).toBeNull();
    });

    it("rejects ids containing invalid characters", () => {
        expect(
            getYouTubeId("https://www.youtube.com/watch?v=../../etc/passwd"),
        ).toBeNull();
    });
});

describe("lib/youtube › getVimeoId", () => {
    it("returns null for nullish input", () => {
        expect(getVimeoId()).toBeNull();
        expect(getVimeoId(null)).toBeNull();
    });

    it("parses a plain vimeo URL", () => {
        expect(getVimeoId("https://vimeo.com/123456789")).toBe("123456789");
    });

    it("parses a channel-style vimeo URL", () => {
        expect(getVimeoId("https://vimeo.com/channels/staffpicks/123456789")).toBe(
            "123456789",
        );
    });

    it("rejects non-numeric ids", () => {
        expect(getVimeoId("https://vimeo.com/abc")).toBeNull();
    });

    it("rejects non-vimeo hosts and malformed urls", () => {
        expect(getVimeoId("https://youtube.com/1234")).toBeNull();
        expect(getVimeoId("nonsense")).toBeNull();
    });
});

describe("lib/youtube › detectProvider", () => {
    it("returns null for empty input", () => {
        expect(detectProvider()).toBeNull();
        expect(detectProvider("")).toBeNull();
    });

    it("detects youtube including youtu.be", () => {
        expect(detectProvider("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
            "youtube",
        );
        expect(detectProvider("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
    });

    it("detects vimeo", () => {
        expect(detectProvider("https://vimeo.com/123456789")).toBe("vimeo");
    });

    it("returns null for unknown hosts and malformed urls", () => {
        expect(detectProvider("https://example.com/video.mp4")).toBeNull();
        expect(detectProvider("not a url")).toBeNull();
    });
});

describe("lib/youtube › toEmbedUrl", () => {
    it("builds a privacy-enhanced youtube embed with defaults", () => {
        const url = toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        expect(url).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?");
        expect(url).toContain("rel=0");
        expect(url).toContain("modestbranding=1");
        expect(url).toContain("playsinline=1");
        expect(url).not.toContain("autoplay=1");
        expect(url).not.toContain("mute=1");
    });

    it("adds autoplay and mute flags when requested", () => {
        const url = toEmbedUrl("https://youtu.be/dQw4w9WgXcQ", {
            autoplay: true,
            mute: true,
        });
        expect(url).toContain("autoplay=1");
        expect(url).toContain("mute=1");
    });

    it("builds a vimeo embed and omits flags by default", () => {
        const url = toEmbedUrl("https://vimeo.com/123456789");
        expect(url).toBe("https://player.vimeo.com/video/123456789?");
    });

    it("builds a vimeo embed with flags", () => {
        const url = toEmbedUrl("https://vimeo.com/123456789", {
            autoplay: true,
            mute: true,
        });
        expect(url).toContain("https://player.vimeo.com/video/123456789?");
        expect(url).toContain("autoplay=1");
        expect(url).toContain("muted=1");
    });

    it("returns null for unsafe or unrecognised input", () => {
        expect(toEmbedUrl()).toBeNull();
        expect(toEmbedUrl(null)).toBeNull();
        expect(toEmbedUrl("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
        expect(toEmbedUrl("https://notyoutube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
        expect(toEmbedUrl("garbage")).toBeNull();
    });
});

describe("lib/youtube › youtubeThumbnail", () => {
    it("returns null for a null id", () => {
        expect(youtubeThumbnail(null)).toBeNull();
    });

    it("defaults to the high-quality thumbnail", () => {
        expect(youtubeThumbnail("dQw4w9WgXcQ")).toBe(
            "https://i.ytimg.com/vi/dQw4w9WgXcQ/highdefault.jpg",
        );
    });

    it("honours the requested quality", () => {
        expect(youtubeThumbnail("abc123", "max")).toBe(
            "https://i.ytimg.com/vi/abc123/maxdefault.jpg",
        );
        expect(youtubeThumbnail("abc123", "default")).toBe(
            "https://i.ytimg.com/vi/abc123/defaultdefault.jpg",
        );
    });
});
