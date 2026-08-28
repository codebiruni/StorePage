"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Declare the gtag function for TypeScript safety
declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gtag: (command: string, targetId: string, config?: Record<string, any>) => void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataLayer: any[];
    }
}

interface GoogleAnalyticsProps {
    /**
     * GA4 Measurement ID (looks like `G-XXXXXXXXXX`). Sourced from the
     * dashboard site-info document by the root layout — never from
     * `process.env`. When this string is empty/undefined the component
     * renders nothing.
     */
    gaId?: string;
}

const GA_SRC = (id: string) => `https://www.googletagmanager.com/gtag/js?id=${id}`;

export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
    const trimmedId = gaId?.trim() ?? "";
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Inject the GA scripts imperatively. React 19 does not execute <script>
    // tags rendered in the component tree on the client, so we create them
    // via the DOM in an effect instead of using next/script's <Script>.
    useEffect(() => {
        if (!trimmedId) return;

        // Core gtag loader
        const core = document.createElement("script");
        core.async = true;
        core.src = GA_SRC(trimmedId);
        document.head.appendChild(core);

        // Inline bootstrap
        const inline = document.createElement("script");
        inline.text = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${trimmedId}', { page_path: window.location.pathname });
        `;
        document.head.appendChild(inline);

        return () => {
            core.remove();
            inline.remove();
        };
    }, [trimmedId]);

    // Track dynamic route changes automatically
    useEffect(() => {
        if (!trimmedId || typeof window.gtag === "undefined") return;

        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

        window.gtag("config", trimmedId, {
            page_path: url,
        });
    }, [pathname, searchParams, trimmedId]);

    return null;
}