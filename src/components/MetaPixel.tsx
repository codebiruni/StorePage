/* eslint-disable @next/next/no-img-element */
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// 1. Declare the type directly on the window object for this file
declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fbq: (...args: any[]) => void;
    }
}

interface MetaPixelProps {
    /**
     * Meta (Facebook) Pixel ID. Sourced from the dashboard site-info
     * document by the root layout — never from `process.env`. When this
     * string is empty/undefined the component renders nothing.
     */
    pixelId?: string;
}

export default function MetaPixel({ pixelId }: MetaPixelProps) {
    const trimmedId = pixelId?.trim() ?? "";
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [pixelReady, setPixelReady] = useState(false);

    const trackPageView = () => {
        if (!trimmedId || typeof window.fbq === "undefined") return;
        window.fbq("track", "PageView");
    };

    // Inject the Meta Pixel script imperatively. React 19 does not execute
    // <script> tags rendered in the component tree on the client, so we
    // create them via the DOM in an effect instead of using next/script.
    useEffect(() => {
        if (!trimmedId) return;

        const inline = document.createElement("script");
        inline.text = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${trimmedId}');
        `;
        document.head.appendChild(inline);

        // Poll for fbq availability, then flip the ready flag so the
        // route-change effect below fires the initial PageView.
        let cancelled = false;
        const waitForPixel = () => {
            if (cancelled) return;
            if (typeof window.fbq !== "undefined") {
                setPixelReady(true);
                return;
            }
            window.setTimeout(waitForPixel, 100);
        };
        waitForPixel();

        return () => {
            cancelled = true;
            inline.remove();
        };
    }, [trimmedId]);

    useEffect(() => {
        if (!pixelReady) return;
        trackPageView();
    }, [pathname, searchParams, pixelReady]);

    if (!trimmedId) return null;

    return (
        <noscript>
            <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${trimmedId}&ev=PageView&noscript=1`}
                alt=""
            />
        </noscript>
    );
}