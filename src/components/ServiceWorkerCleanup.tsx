"use client";

import { useEffect } from "react";

/**
 * Force-unregisters any service worker on page load.
 *
 * Problem: a previous production `next build` registered a workbox service
 * worker (`/sw.js`) that caches `/_next/static/*` chunks. In development
 * (where next-pwa is disabled) the old SW keeps serving stale chunks,
 * causing "module factory is not available" errors after imports change.
 *
 * The self-unregistering `public/sw.js` stub only runs if the browser
 * fetches the new `/sw.js` — but the old SW can intercept that fetch and
 * serve itself. This component calls `navigator.serviceWorker.register()`
 * from the page context (not the SW context) to force the browser to
 * fetch the new `/sw.js`, which then self-unregisters. It also directly
 * unregisters any existing registration and clears all caches.
 *
 * This component renders nothing and is dev-only (no-op in production
 * where the real workbox SW should stay registered).
 */
export default function ServiceWorkerCleanup() {
    useEffect(() => {
        if (process.env.NODE_ENV === "production") return;
        if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

        (async () => {
            try {
                // Force the browser to fetch the latest /sw.js (bypassing the
                // old SW's cache by using `updateViaCache: "none"`).
                await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                    updateViaCache: "none",
                });

                // Also directly unregister any existing registrations.
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const reg of regs) {
                    await reg.unregister();
                }

                // Clear all caches that the old SW may have populated.
                if ("caches" in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                }
            } catch {
                // no-op — SW registration is best-effort
            }
        })();
    }, []);

    return null;
}
