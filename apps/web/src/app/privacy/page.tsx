import { site } from "@/lib/site";

export const metadata = { title: `Privacy — ${site.name}` };

export default function PrivacyPage() {
  const { analytics, ads } = site;
  return (
    <div className="prose-skill mx-auto max-w-3xl px-5 py-12">
      <h1>Privacy policy</h1>
      <p>This page explains what {site.name} collects and why. Last updated: {new Date().toISOString().slice(0, 10)}.</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Search queries</strong> you type into the AI search are sent to our server and to Anthropic&apos;s Claude API to find matching skills. Don&apos;t include personal or confidential information in searches.</li>
        {analytics.gaId && <li><strong>Analytics</strong> — Google Analytics 4 measures page views and feature usage (e.g. downloads). Cookies are only set if you accept; otherwise Google receives cookieless, aggregated signals (Consent Mode).</li>}
        {analytics.plausibleDomain && <li><strong>Plausible Analytics</strong> — cookie-less, aggregated visitor statistics; no personal data.</li>}
        {ads.provider === "adsense" && <li><strong>Advertising</strong> — Google AdSense shows ads. With consent, Google may use cookies to personalize ads; without consent, ads are non-personalized. See <a href="https://policies.google.com/technologies/partner-sites">how Google uses information from sites that use its services</a>.</li>}
        {ads.provider === "ethicalads" && <li><strong>Advertising</strong> — EthicalAds serves contextual ads without tracking cookies.</li>}
        {ads.provider === "carbon" && <li><strong>Advertising</strong> — Carbon Ads serves contextual ads.</li>}
        <li><strong>Your consent choice</strong> is stored in your browser&apos;s local storage.</li>
      </ul>
      <h2>Your choices</h2>
      <p>You can decline cookies in the banner, clear your browser storage to be asked again, and use the site fully either way.</p>
      <h2>Third-party skills</h2>
      <p>Skills are published by third parties. Mirrored skills keep their original license and attribution; review any scripts before running them.</p>
      {site.contactEmail && (
        <>
          <h2>Contact</h2>
          <p><a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></p>
        </>
      )}
    </div>
  );
}
