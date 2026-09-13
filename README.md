# Skill Loadout 🎒

> Live at **skillloadout.com** (repo folder name stays `Skills`; the internal source id
> `world-skills` is only used for the originals we author).

**A curated library of the best AI agent skills in the world**, plus a website with a
Claude-powered search bar that assembles the right *skill stack* for whatever you want to build,
and an update agent that refreshes everything every 3 days.

Skills follow the open **Agent Skills** format (`SKILL.md` + optional scripts/references), which
works across **Claude** (Code, Desktop, claude.ai), **OpenAI Codex / ChatGPT**, **Gemini CLI**,
**GitHub Copilot** and **Cursor**. The library also includes Cursor rules (auto-converted to
SKILL.md) and Gemini CLI extensions.

```
.
├── skills/                 # the library — one folder per skill (mirrored verbatim + ATTRIBUTION.md)
├── originals/              # Skill Loadout Originals (authored here): 3D, fly-throughs, walkthroughs, scroll storytelling…
├── catalog/
│   ├── sources.json        # source registry (tiers, kinds); discovery agent appends to `discovered`
│   ├── index.json          # generated catalog (one skill per line)
│   ├── stacks.json         # curated multi-skill bundles
│   ├── stats.json, changelog.json, discovery-log.json, state.json
├── scripts/
│   ├── sync.mjs            # clone → find → license check → mirror/link → classify → dedupe → score → index
│   ├── discover.mjs        # discovery agent (GitHub search + Claude review)
│   ├── validate.mjs        # catalog integrity checks
│   └── lib/                # taxonomy, license detection, safety scan, helpers
├── apps/web/               # Next.js 16 site: AI search, browse, skill pages, zip downloads, stacks
└── .github/workflows/update-skills.yml   # every-3-days update agent
```

## Quick start

```bash
npm install
npm run sync            # download/refresh all sources (~10–20 min first time; incremental after)
npm run artifacts       # pre-build 5.6k skill zips, bundles, and the client search index
npm run dev             # http://localhost:3000
```

Ship a production build (fully static, no server):

```bash
npm run build           # artifacts + static export -> apps/web/out/
npm run preview         # serve apps/web/out locally
```

Useful flags: `node scripts/sync.mjs --only owner/repo`, `--force`, `--keep-cache`.
`npm run discover` runs the discovery agent, `npm run picks` re-points the ⚡ Superpower list,
`npm run validate` checks catalog integrity.

**Deployment:** static site on S3 + CloudFront — costs, architecture and AI-cost model in
[docs/aws-plan.md](docs/aws-plan.md); the 30-day launch/teardown plan in
[docs/launch-trial.md](docs/launch-trial.md).

## How the pieces work

### Sync engine (`scripts/sync.mjs`)
1. Expands `catalog/sources.json` (repos + whole orgs such as `gemini-cli-extensions`).
2. For each repo: `git ls-remote` → skip if unchanged since the last run; else a **blob-less, sparse,
   shallow clone** that only downloads the skill folders (binary assets are skipped).
3. Finds `SKILL.md` skills, Cursor `.cursorrules`/`.mdc` rules and Gemini `gemini-extension.json`.
4. **License resolution** per item: skill-folder LICENSE → `license:` frontmatter → nearest parent
   LICENSE → repo metadata. Only redistributable licenses (MIT, Apache-2.0, BSD, ISC, CC0, CC-BY(-SA),
   MPL, GPL family…) are **mirrored** into `skills/<id>/` with an `ATTRIBUTION.md` and the upstream
   license; everything else (proprietary, unknown, no license) is **link-only** — metadata + source link.
5. Classifies into 36 categories, runs a **safety scan** (prompt-injection text, credential access,
   obfuscated exec, destructive commands, pipe-to-shell), dedupes forks/mirrors by content hash and
   name+description, and scores quality (tier, stars, richness, freshness, safety).
6. Writes `catalog/index.json`, `stats.json`, and a `changelog.json` entry.

### Update agent (every 3 days)
`.github/workflows/update-skills.yml` runs on a cron (`23 5 */3 * *`) or manually:
1. **Discovery** — GitHub search across skill topics/keywords → filters known/aggregator repos →
   **Claude (claude-opus-5) reviews** each candidate's README + sample skills for quality, originality
   and safety (heuristic fallback without a key) → accepted repos are appended to `sources.json`.
2. **Sync** — incremental re-sync of every source.
3. **Validate** — integrity checks (no non-redistributable content mirrored, no missing files).
4. **Commit** — pushes the refreshed catalog. Add an `ANTHROPIC_API_KEY` repository secret to enable
   Claude reviews.

### Website (`apps/web`) — static by default
- **Instant search**: the whole catalog is searched in the browser over `public/search-index.json`
  (2.5 MB), with synonym expansion and the ⚡ picks ranked first. No API, no key, no per-search cost.
- **Downloads**: every skill zip and bundle is pre-built at deploy time into `public/downloads/` and
  `public/bundles/`, so a download is a plain file from the CDN.
- **Pages**: home, `/browse`, 36 category pages, `/stacks`, 6.3k skill pages, `/about`, `/support`,
  `/privacy`, `/updates` — all pre-rendered (`output: "export"`).
- **AI search is parked**, not deleted: `apps/web/src/_dynamic-api/` holds the Claude search route and
  its UI. Switching it on means dropping `output: "export"` and deploying to Lambda — see
  [docs/aws-plan.md](docs/aws-plan.md) §4 for the cost model and caps.

## Categories & Superpowers

`catalog/taxonomy.json` defines 36 categories in 5 groups (Build, Create, Business, Work, Knowledge) —
the single source of truth for the sync classifier and the website. `catalog/top-picks.json` holds the
hand-curated **⚡ Superpower** skills per category (the best few); they're badged across the site, lead
each `/categories/<id>` page, and download as one bundle. Bulk/auto-generated collections are listed in
`sources.json → exclude` so only top skills make it in.

## Analytics, ads & donations

All configured with env vars in `apps/web/.env.local` (see `.env.example`) — nothing loads until set:

| Feature | Env vars | Notes |
|---|---|---|
| Google Analytics 4 | `NEXT_PUBLIC_GA_ID` | Consent Mode v2: cookies only after the visitor accepts the banner |
| Plausible (optional) | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | cookie-less alternative |
| Google AdSense | `NEXT_PUBLIC_ADS_PROVIDER=adsense`, `NEXT_PUBLIC_ADSENSE_CLIENT`, `…_SLOT_RAIL_TOP`, `…_SLOT_RAIL_BOTTOM` | `/ads.txt` is generated automatically; EEA/UK traffic needs a Google-certified CMP |
| EthicalAds / Carbon | `NEXT_PUBLIC_ADS_PROVIDER=ethicalads` + publisher id, or `carbon` + serve/placement | developer-audience networks, no tracking cookies |
| Donations | `NEXT_PUBLIC_BMC_USERNAME`, `NEXT_PUBLIC_GITHUB_SPONSORS`, `NEXT_PUBLIC_KOFI_USERNAME`, `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` | shown on `/support` + header ☕ button |
| Sponsorships | `NEXT_PUBLIC_SPONSOR_EMAIL` | category / stack / featured-skill sponsor tiers on `/support#advertise` |
| Branding | `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_TAGLINE`, `NEXT_PUBLIC_SITE_URL` | rename the site without code changes |

Ads render as **two units in a right-hand rail** (sticky top + second below) on browse, category and
skill pages - hidden under 1280px, so mobile stays ad-free unless you set `NEXT_PUBLIC_ADS_INFEED=1`.
Everything is labeled "Sponsored"; `/privacy` updates itself based on which services are enabled.

**Step-by-step setup for AdSense, EthicalAds, Carbon Ads, Buy Me a Coffee, Ko-fi and GitHub Sponsors,
including what to do on day one, is in [docs/monetization-setup.md](docs/monetization-setup.md).**

## Installing downloaded skills

| Tool | Location |
|------|----------|
| Claude Code | `~/.claude/skills/<name>/` or `.claude/skills/<name>/` in a repo |
| Claude.ai / Desktop | Settings → Capabilities → Skills → upload the zip |
| Codex / ChatGPT | `~/.codex/skills/<name>/` |
| Gemini CLI | `~/.gemini/skills/<name>/` or `.gemini/skills/<name>/` |
| GitHub Copilot | `.github/skills/<name>/` |
| Cursor | `.cursor/skills/<name>/` (rules → `.cursor/rules/`) |

## Adding sources

Edit `catalog/sources.json` → `sources` (`{ "repo": "owner/name", "tier": 1|2|3, "origin": "…" }`,
optional `include` path prefixes, `exclude` regexes, `kind: "rules" | "gemini-extension"`) and run
`npm run sync -- --only owner/name`. Put known mirrors/aggregators in `exclude`.

## Licensing

Skill Loadout's own code and `originals/` are MIT. Mirrored skills keep their upstream licenses — see
each folder's `ATTRIBUTION.md` and LICENSE. Link-only skills are not redistributed.
