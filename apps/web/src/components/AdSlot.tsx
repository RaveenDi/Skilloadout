"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

// Pluggable ad unit: Google AdSense, EthicalAds (privacy-first, developer audience) or Carbon Ads.
// Renders nothing when no provider is configured, so the site stays clean in development.

type Props = {
  provider: "adsense" | "ethicalads" | "carbon" | "none";
  adsenseClient?: string;
  adsenseSlot?: string;
  ethicalAdsPublisher?: string;
  carbonServe?: string;
  carbonPlacement?: string;
  inFeed?: boolean;
  variant?: "card" | "banner";
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    ethicalads?: { load: () => void };
  }
}

export default function AdSlot(p: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (p.provider === "adsense" && p.adsenseClient && p.adsenseSlot && !pushed.current) {
      pushed.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {}
    }
    if (p.provider === "ethicalads" && p.ethicalAdsPublisher) {
      const s = document.querySelector<HTMLScriptElement>("script[data-ea-loader]");
      if (!s) {
        const el = document.createElement("script");
        el.src = "https://media.ethicalads.io/media/client/ethicalads.min.js";
        el.async = true;
        el.dataset.eaLoader = "1";
        document.body.appendChild(el);
      } else window.ethicalads?.load();
    }
    if (p.provider === "carbon" && p.carbonServe && ref.current && !ref.current.querySelector("#_carbonads_js")) {
      const el = document.createElement("script");
      el.src = `https://cdn.carbonads.com/carbon.js?serve=${p.carbonServe}&placement=${p.carbonPlacement || ""}`;
      el.id = "_carbonads_js";
      el.async = true;
      ref.current.appendChild(el);
    }
  }, [p.provider, p.adsenseClient, p.adsenseSlot, p.ethicalAdsPublisher, p.carbonServe, p.carbonPlacement]);

  if (p.provider === "none") return null;
  const frame = p.variant === "banner" ? "min-h-[100px]" : "min-h-[250px]";

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-3 ${frame}`} aria-label="Advertisement">
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-muted">
        <span>Sponsored</span>
        <Link href="/support#advertise" className="hover:text-foreground">Advertise here</Link>
      </div>
      <div ref={ref} className="flex flex-1 items-center justify-center">
        {p.provider === "adsense" && p.adsenseClient && p.adsenseSlot && (
          <ins
            className="adsbygoogle block w-full"
            style={{ display: "block" }}
            data-ad-client={p.adsenseClient}
            data-ad-slot={p.adsenseSlot}
            data-ad-format={p.variant === "banner" ? "horizontal" : "auto"}
            data-full-width-responsive="true"
          />
        )}
        {p.provider === "ethicalads" && p.ethicalAdsPublisher && (
          <div data-ea-publisher={p.ethicalAdsPublisher} data-ea-type={p.variant === "banner" ? "text" : "image"} className="dark" />
        )}
      </div>
    </div>
  );
}
