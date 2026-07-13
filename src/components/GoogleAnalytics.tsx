"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
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

export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
    const trimmedId = gaId?.trim() ?? "";
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Track dynamic route changes automatically
    useEffect(() => {
        if (!trimmedId || typeof window.gtag === "undefined") return;

        // Combine pathname and search parameters for the complete path string
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

        window.gtag("config", trimmedId, {
            page_path: url,
        });
    }, [pathname, searchParams, trimmedId]);

    if (!trimmedId) return null;

    return (
        <>
            {/* Load the core Google Analytics script tag asynchronously */}
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${trimmedId}`}
            />

            {/* Initialize dataLayer and the default pageview tracking sequence */}
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${trimmedId}', {
                page_path: window.location.pathname,
              });
            `,
                }}
            />
        </>
    );
}