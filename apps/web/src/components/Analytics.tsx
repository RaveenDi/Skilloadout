"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";

// Google Analytics 4 + AdSense loader with Google Consent Mode v2.
// Everything defaults to "denied" until the visitor accepts; the choice is remembered locally.
// GA still receives cookieless pings under denied consent (modeled data), ads are non-personalized.

type Props = { gaId?: string; adsenseClient?: string; plausibleDomain?: string };
type Choice = "granted" | "denied" | null;
const KEY = "ws-consent-v1";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function readChoice(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function applyConsent(choice: "granted" | "denied") {
  window.gtag?.("consent", "update", {
    analytics_storage: choice,
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  });
}

export default function Analytics({ gaId, adsenseClient, plausibleDomain }: Props) {
  const needsConsent = !!(gaId || adsenseClient);
  const [choice, setChoice] = useState<Choice>("denied");
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!needsConsent) return;
    const stored = readChoice();
    // Deferred so the banner renders after hydration (localStorage is client-only).
    const t = setTimeout(() => {
      setChoice(stored);
      setShowBanner(stored === null);
      if (stored) applyConsent(stored);
    }, 0);
    return () => clearTimeout(t);
  }, [needsConsent]);

  const decide = (c: "granted" | "denied") => {
    try {
      localStorage.setItem(KEY, c);
    } catch {}
    setChoice(c);
    setShowBanner(false);
    applyConsent(c);
  };

  return (
    <>
      {needsConsent && (
        <Script id="consent-default" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
            wait_for_update: 500
          });
          gtag('set', 'ads_data_redaction', true);
          gtag('js', new Date());
          ${gaId ? `gtag('config', '${gaId}', { anonymize_ip: true });` : ""}
        `}</Script>
      )}
      {gaId && <Script id="ga4" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />}
      {adsenseClient && (
        <Script
          id="adsense"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}
      {plausibleDomain && <Script id="plausible" src="https://plausible.io/js/script.js" data-domain={plausibleDomain} strategy="afterInteractive" />}

      {showBanner && choice === null && (
        <div role="dialog" aria-label="Cookie consent" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-border bg-[#0e0e18]/95 p-4 shadow-2xl backdrop-blur md:inset-x-auto md:right-4">
          <p className="text-sm text-muted">
            We use cookies for analytics{adsenseClient ? " and ads" : ""} to keep this library free. You can accept or decline — the site works either way.{" "}
            <Link href="/privacy" className="underline">Privacy</Link>
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => decide("denied")} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-white/30">Decline</button>
            <button onClick={() => decide("granted")} className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-black hover:bg-white/90">Accept</button>
          </div>
        </div>
      )}
    </>
  );
}

// Custom events (e.g. downloads, searches) — no-ops when GA isn't configured.
export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window !== "undefined") window.gtag?.("event", event, params);
}
