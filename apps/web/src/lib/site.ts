// Site identity + monetization config. Everything is driven by NEXT_PUBLIC_* env vars so the
// site can be renamed and monetized without code changes (see apps/web/.env.example).
const env = (k: string) => (process.env[k] || "").trim();

export type AdsProvider = "adsense" | "ethicalads" | "carbon" | "none";

export const site = {
  name: env("NEXT_PUBLIC_SITE_NAME") || "Skill Loadout",
  tagline: env("NEXT_PUBLIC_SITE_TAGLINE") || "Gear up your AI",
  url: env("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000",
  contactEmail: env("NEXT_PUBLIC_CONTACT_EMAIL"),

  analytics: {
    gaId: env("NEXT_PUBLIC_GA_ID"), // Google Analytics 4 measurement id, e.g. G-XXXXXXX
    plausibleDomain: env("NEXT_PUBLIC_PLAUSIBLE_DOMAIN"), // optional cookie-less alternative
  },

  ads: {
    provider: (env("NEXT_PUBLIC_ADS_PROVIDER") || "none") as AdsProvider,
    adsenseClient: env("NEXT_PUBLIC_ADSENSE_CLIENT"), // ca-pub-XXXXXXXXXXXXXXXX
    adsenseSlotRailTop: env("NEXT_PUBLIC_ADSENSE_SLOT_RAIL_TOP"),
    adsenseSlotRailBottom: env("NEXT_PUBLIC_ADSENSE_SLOT_RAIL_BOTTOM"),
    adsenseSlotInFeed: env("NEXT_PUBLIC_ADSENSE_SLOT_INFEED"),
    adsenseSlotSidebar: env("NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR"),
    // Default layout: two units in the right rail only. Set NEXT_PUBLIC_ADS_INFEED=1 to also
    // drop a banner inside the results grid.
    inFeed: env("NEXT_PUBLIC_ADS_INFEED") === "1",
    ethicalAdsPublisher: env("NEXT_PUBLIC_ETHICALADS_PUBLISHER"),
    carbonServe: env("NEXT_PUBLIC_CARBON_SERVE"),
    carbonPlacement: env("NEXT_PUBLIC_CARBON_PLACEMENT"),
  },

  support: {
    buyMeACoffee: env("NEXT_PUBLIC_BMC_USERNAME"), // buymeacoffee.com/<username>
    githubSponsors: env("NEXT_PUBLIC_GITHUB_SPONSORS"), // github.com/sponsors/<username>
    kofi: env("NEXT_PUBLIC_KOFI_USERNAME"), // ko-fi.com/<username>
    stripeLink: env("NEXT_PUBLIC_STRIPE_PAYMENT_LINK"), // https://buy.stripe.com/...
    sponsorEmail: env("NEXT_PUBLIC_SPONSOR_EMAIL"),
  },
};

export const adsEnabled = () =>
  (site.ads.provider === "adsense" && !!site.ads.adsenseClient) ||
  (site.ads.provider === "ethicalads" && !!site.ads.ethicalAdsPublisher) ||
  (site.ads.provider === "carbon" && !!site.ads.carbonServe);

export const hasSupportLinks = () => Object.values(site.support).some(Boolean);

// Props for <AdSlot/> computed on the server (NEXT_PUBLIC_* read dynamically aren't inlined client-side).
export type AdPlacement = "rail-top" | "rail-bottom" | "infeed" | "sidebar";
const slotId = (p: AdPlacement) => {
  const a = site.ads;
  if (p === "rail-top") return a.adsenseSlotRailTop || a.adsenseSlotSidebar;
  if (p === "rail-bottom") return a.adsenseSlotRailBottom || a.adsenseSlotInFeed;
  if (p === "infeed") return a.adsenseSlotInFeed;
  return a.adsenseSlotSidebar;
};

export function adProps(slot: AdPlacement) {
  const a = site.ads;
  return {
    provider: (adsEnabled() ? a.provider : "none") as AdsProvider,
    inFeed: a.inFeed,
    adsenseClient: a.adsenseClient,
    adsenseSlot: slotId(slot),
    ethicalAdsPublisher: a.ethicalAdsPublisher,
    carbonServe: a.carbonServe,
    carbonPlacement: a.carbonPlacement,
  };
}
export type AdProps = ReturnType<typeof adProps>;
