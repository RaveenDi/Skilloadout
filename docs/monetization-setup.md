# Monetization & analytics setup (step by step)

Everything below is already wired into the site. You only paste IDs into `apps/web/.env.local`
(copy `apps/web/.env.example` first). Nothing loads until an ID is present, so you can enable things
one at a time.

---

## 0. The order that actually works

| When | Do this | Why |
|---|---|---|
| **Day 1** | Deploy on a real domain, add Google Analytics, publish About / Privacy / Contact, add a donation button | Ads and sponsors all need a live domain, real content and traffic numbers. Donations work from visitor #1. |
| **Day 1–3** | Google Search Console + submit `/sitemap.xml`; share where developers hang out | Approval and revenue both track traffic. |
| **Week 2–4** (15–25 real pages, steady visitors) | Apply to **Google AdSense** | No traffic minimum, so it is the only network you can start with. |
| **~50k pageviews/month** | Apply to **EthicalAds** | Needs a developer audience at roughly that scale; pays better per view for this audience. |
| **~50k pageviews/month, if you want one premium network** | Apply to **Carbon Ads** | Best fit for dev/design sites, but **exclusive** — you must remove every other ad network. |
| **~10k visits/month** | Pitch direct sponsors (`/support#advertise`) | Usually the biggest earner for a niche developer site. |

**Do not run all three networks at once.** AdSense and EthicalAds can coexist, but Carbon requires
exclusivity: joining Carbon means removing AdSense and EthicalAds. Practical path:
**AdSense now → add or switch to EthicalAds at 50k → consider Carbon later.**

---

## 1. Google AdSense

**Requirements:** 18+, a live domain you own, original content, and Privacy + About + Contact pages
(all three exist on the site now). No official traffic minimum, but thin or brand-new sites get
rejected — apply once you have real content and steady visitors.

1. Deploy the site to your domain (Vercel is easiest for this app).
2. Set `NEXT_PUBLIC_SITE_URL=https://skillloadout.com` and `NEXT_PUBLIC_CONTACT_EMAIL=hello@skillloadout.com`.
3. Go to adsense.google.com → **Get started** → enter site URL, country and payment address.
   The payment address country **cannot be changed later**, so use where you will actually receive money.
4. AdSense gives you a verification snippet — you do not need to paste it by hand. Set
   `NEXT_PUBLIC_ADS_PROVIDER=adsense` and `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX`,
   redeploy, and the loader goes into every page. (Or verify with the Ads.txt / meta-tag option.)
5. Check `https://yourdomain.com/ads.txt` returns
   `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` — it is generated from that same env var.
6. Wait for review (a few days up to ~2 weeks). Keep the site online and stable during review.
7. Once approved: **Ads → By ad unit → Display ads**. Create two units and copy their slot IDs:
   - `rail-top` → `NEXT_PUBLIC_ADSENSE_SLOT_RAIL_TOP`
   - `rail-bottom` → `NEXT_PUBLIC_ADSENSE_SLOT_RAIL_BOTTOM`
8. Redeploy. Two units appear in the right rail on browse, category and skill pages.
9. **Payments:** add your method in **Payments → Payments info**, verify your address with the PIN
   Google mails you (triggered at $10 earned), and get paid after the **$100 threshold**, around the
   21st–26th of the following month. Methods depend on country: bank transfer/EFT, SEPA, cheque, or
   **PayPal via Hyperwallet** where offered.
10. **EEA/UK traffic:** Google requires a certified consent management platform for personalized ads.
    The built-in banner sets Consent Mode v2 and serves non-personalized ads until a visitor accepts,
    which is enough to run; add a certified CMP (Google's Funding Choices is free) if much of your
    traffic is European.

---

## 2. EthicalAds (privacy-first, developer audience)

**Requirements:** developer/technical audience, roughly **50,000 monthly pageviews**, no tracking
cookies. Revenue share is 70% to you, typically around **$2.50 CPM**, **$50 minimum payout**.

1. Grow to ~50k monthly pageviews (Google Analytics shows this).
2. Apply at ethicalads.io/publishers → "Become a publisher". Give the site URL, traffic numbers and
   audience description (AI agent skills library for developers).
3. On approval you get a **publisher ID**.
4. Set `NEXT_PUBLIC_ADS_PROVIDER=ethicalads` and `NEXT_PUBLIC_ETHICALADS_PUBLISHER=your-id`, redeploy.
5. Ads render in the same two right-rail slots. No extra scripts, no consent changes needed.
6. Payouts are monthly once you pass $50.

---

## 3. Carbon Ads (premium, exclusive)

**Requirements:** developer/designer audience, roughly **50,000 monthly pageviews**, hand-reviewed in
about 5–7 business days. **Exclusive** — no other ad networks while you are in Carbon.

1. Apply at carbonads.net/join with your URL and traffic stats.
2. If accepted you receive a **serve code** and **placement code**.
3. Remove AdSense/EthicalAds and set `NEXT_PUBLIC_ADS_PROVIDER=carbon`,
   `NEXT_PUBLIC_CARBON_SERVE=XXXX`, `NEXT_PUBLIC_CARBON_PLACEMENT=YYYY`, redeploy.
4. Carbon serves one ad per pageview by design: it fills the top rail slot. Use the second slot for
   your own sponsor promo, or leave it empty.

---

## 4. Buy Me a Coffee

**Important:** Buy Me a Coffee pays creators **through Stripe only**. If Stripe does not support
payouts in your country, you cannot withdraw — use **Ko-fi** instead (below), which supports PayPal.

1. Sign up at buymeacoffee.com and choose your page name (for example `skillloadout`).
2. Fill in the page: title, one-line description ("Keeps the Skill Loadout library free and updated
   every 3 days"), image, and price per coffee ($3–$5 is typical).
3. **Payments → connect Stripe (Stripe Express)**. Provide ID and bank details for payouts.
   Supporters can still pay by card **or PayPal**, even though payouts run through Stripe.
4. Set `NEXT_PUBLIC_BMC_USERNAME=skillloadout`, redeploy. The header button and the `/support` card now
   point at your page.
5. Optional: add a thank-you note and a one-time extra (for example "I will add your requested skill source").

## 4b. Ko-fi — use this if you want the money in PayPal

1. Sign up at ko-fi.com and pick your page name.
2. **Settings → Payments → connect PayPal** (and/or Stripe). Tips go straight to your PayPal and Ko-fi
   takes **0% on tips** on the free plan.
3. Set `NEXT_PUBLIC_KOFI_USERNAME=yourname`, redeploy.

> **PayPal caveat:** in some countries (Sri Lanka among them) PayPal can *send* but not *receive* money.
> If that applies to you, the realistic options are Ko-fi/BMC via Stripe where available,
> **Payoneer or Wise** as the receiving account for sponsors and invoices, or **GitHub Sponsors**
> if your region is supported.

## 4c. GitHub Sponsors (0% fees, natural fit for this project)

1. github.com/sponsors → get sponsored with your GitHub account (`RaveenDi`).
2. Complete the profile: who you are, what the project is, tiers ($5 / $25 / $100 monthly).
3. Set up **Stripe Connect** payouts (or bank, depending on region) and tax details.
4. Set `NEXT_PUBLIC_GITHUB_SPONSORS=RaveenDi`, redeploy.

---

## 5. Direct sponsorships (usually the biggest earner)

1. Set `NEXT_PUBLIC_SPONSOR_EMAIL=sponsors@skillloadout.com` so the "Get in touch" button works.
2. Wait until you can show real numbers (monthly visits, downloads, top categories from Analytics).
3. Pitch companies whose tools appear in your stacks: 3D/graphics tools, hosting platforms, auth and
   database vendors, AI tooling. Offer "presented by" on a category page plus the stack download, for
   one month.
4. Invoice through **Wise, Payoneer or Stripe Invoicing** — all work internationally, including where
   PayPal receiving does not.

---

## 6. Environment variables summary

```bash
# apps/web/.env.local
NEXT_PUBLIC_SITE_URL=https://skillloadout.com
NEXT_PUBLIC_CONTACT_EMAIL=hello@skillloadout.com

NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

NEXT_PUBLIC_ADS_PROVIDER=adsense           # adsense | ethicalads | carbon | none
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_RAIL_TOP=1234567890
NEXT_PUBLIC_ADSENSE_SLOT_RAIL_BOTTOM=0987654321
# NEXT_PUBLIC_ADS_INFEED=1                 # optional third ad inside the results grid (off by default)

NEXT_PUBLIC_BMC_USERNAME=skillloadout
NEXT_PUBLIC_KOFI_USERNAME=skillloadout
NEXT_PUBLIC_GITHUB_SPONSORS=RaveenDi
NEXT_PUBLIC_SPONSOR_EMAIL=sponsors@skillloadout.com
```

---

## 7. Ad layout in this site

- **Two units, right rail only** (the top one sticks while scrolling), on browse, category and skill pages.
- The rail is hidden below 1280px, so phones and tablets see **no ads** by default. If you later want
  mobile revenue, set `NEXT_PUBLIC_ADS_INFEED=1` to add one responsive banner inside the results grid.
- The home page stays ad-free on purpose: it is the page that converts visitors into users and sponsors.
- Every unit is labeled "Sponsored" with an "Advertise here" link to your own sponsorship page.
