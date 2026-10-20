"use client";

import { useEffect } from "react";
import Script from "next/script";

/** Public-site analytics: never tag preview deployments or non-production hosts. */
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const productionHosts = new Set(["michigandance.life", "www.michigandance.life"]);

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

/** Optional Plausible or GA4. Scripts are enabled only on the public production domain. */
export function ThirdPartyAnalytics() {
  useEffect(() => {
    if (!gaId || process.env.NODE_ENV !== "production") return;
    if (!productionHosts.has(window.location.hostname)) return;
    if (document.getElementById("michigan-dance-ga4")) return;

    const analyticsWindow = window as AnalyticsWindow;
    analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
    // gtag.js only processes dataLayer entries that are `arguments` objects.
    // A rest-parameter array is silently ignored, so config never runs and
    // no page_view is sent even though gtag.js loads.
    analyticsWindow.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      analyticsWindow.dataLayer?.push(arguments);
    };
    analyticsWindow.gtag("js", new Date());
    analyticsWindow.gtag("config", gaId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    const script = document.createElement("script");
    script.id = "michigan-dance-ga4";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);
  }, []);

  if (!plausibleDomain || process.env.NODE_ENV !== "production") return null;

  return (
    <Script
      defer
      data-domain={plausibleDomain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
