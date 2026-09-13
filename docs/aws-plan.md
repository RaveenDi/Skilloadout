# Skill Loadout on AWS — architecture, hosting cost, AI cost

Planning document. Nothing is deployed. Numbers measured from the real catalog on 2026-09-12:

| Thing | Measured |
|---|---|
| Skills in catalog | **6,500** (5,796 downloadable, 704 link-only) |
| `skills/` folder on disk | **364 MB**, 40,153 files |
| `catalog/index.json` | **12.67 MB** |
| Ranking prompt sent to Claude today (90 candidates) | **~8,000 tokens** |

---

## 1. The one constraint that shapes everything

A Lambda deployment package is capped at **250 MB unzipped**. The skills alone are 364 MB, so
**the skill files cannot ship inside the app**. They live in **S3** and are served through CloudFront.

The second useful fact: this site is **almost entirely static**. The catalog only changes when the
3-day agent runs. So build the 6,500 skill pages as static HTML at deploy time, and keep exactly one
dynamic endpoint (AI search). That makes hosting nearly free and the site very fast.

---

## 2. Recommended architecture (static-first)

```
GitHub repo (source of truth: skills/, catalog/, apps/web)
      │
      │  every 3 days: GitHub Actions → discover → sync → validate → commit
      ▼
GitHub Actions build  ──────────────────────────────────────────────┐
  • next build (SSG: 6,500 skill pages, 36 categories, stacks)      │
  • pre-zip 5,796 skill bundles + stack bundles                     │
  • build slim search index (~1–2 MB gzipped)                       │
      │                                                             │
      ├── aws s3 sync  →  S3 bucket (static site, skill files, zips)│
      └── update Lambda (search API only)  ◄──────────────────────── ┘
      ▼
CloudFront (TLS via ACM, free) ── skillloadout.com (DNS stays at Porkbun, free)
      │
      ├── / , /browse, /categories/*, /skills/*  → static HTML from S3   ($0 per view)
      ├── /downloads/*.zip                        → pre-built zips from S3 ($0 per download)
      └── /api/search                             → Lambda (Claude) + DynamoDB cache
```

**Why each piece**

| Piece | Role | Why not something else |
|---|---|---|
| **S3** | skill files, pre-built zips, static HTML | EFS costs 10× more; Lambda can't hold 364 MB |
| **CloudFront** | CDN + TLS + the only public entry point | 1 TB egress/month is always free |
| **Lambda (1 function)** | `/api/search` only | No servers to patch; 1M requests/month always free |
| **DynamoDB (on-demand)** | AI answer cache, rate limits, daily spend counter | 25 GB storage free forever; pay-per-request is pennies |
| **SSM Parameter Store** | `ANTHROPIC_API_KEY` | Standard parameters are free; Secrets Manager is $0.40/secret/month |
| **GitHub Actions** | the 3-day updater + build + deploy | Free for public repos; CodeBuild would cost ~$1.25/month for the same thing |

**Security note:** deploys use a **GitHub OIDC role**, so no long-lived AWS keys are stored anywhere.

---

## 3. Hosting cost

### Recommended stack (S3 + CloudFront + 1 Lambda)

| Service | Launch (~5k views/mo) | Growing (~50k) | Popular (~500k) |
|---|---|---|---|
| S3 storage (~0.6 GB) | $0.01 | $0.01 | $0.02 |
| S3 requests (delta sync every 3 days) | $0.10 | $0.10 | $0.15 |
| CloudFront egress + requests | $0 (free tier) | $0 (free tier) | $0–8 |
| Lambda (search API) | $0 (free tier) | $0 (free tier) | $1–3 |
| DynamoDB (cache + counters) | $0 | $0–1 | $1–2 |
| CloudWatch logs (7-day retention) | $0–1 | $0–1 | $1–2 |
| Route 53 | $0 (DNS at Porkbun) | $0 | $0 |
| **AWS total** | **≈ $0.50–1 / month** | **≈ $1–3 / month** | **≈ $5–15 / month** |

CloudFront's always-free tier is **1 TB of egress and 10M requests every month, permanently**. A
text-and-markdown site at 500k pageviews is roughly 50–100 GB, so egress stays free for a long time.

### If you'd rather not build the static pipeline

| Option | Cost | Trade-off |
|---|---|---|
| **AWS Amplify Hosting** | $0–10/mo | Simplest: connect GitHub, it builds and deploys Next.js SSR. Free tier 1,000 build min + 15 GB/mo; then $0.01/build-min, **$0.15/GB served** (1.75× CloudFront) and $0.30/M SSR requests. Skills still need S3. |
| **Lightsail container** | $7–15/mo flat | Predictable, simple Docker, but fixed capacity and you patch it. |
| **ECS Fargate + ALB** | $20–40/mo | The ALB alone is ~$18/mo before any traffic. Not worth it here. |
| **EC2 t4g.small** | $10–14/mo | No advantage over Lightsail at this size. |

**Recommendation:** static-first (S3 + CloudFront + one Lambda). Amplify is the fallback if you want
it running this week and will trade ~$5–10/month for a few hours of setup.

**Region:** `us-east-1` — cheapest, and CloudFront serves Sri Lanka/global from edge locations anyway,
so the origin region barely affects visitors.

---

## 4. AI cost — the search bar (this is the real cost, not AWS)

### What a search costs today

Current design: two Claude calls per search (plan retrieval → rank 90 candidates), both on Opus 5.

| Call | Input | Output | Opus 5 ($5/$25 per MTok) |
|---|---|---|---|
| Planner | ~600 tok | ~150 tok | $0.0068 |
| Ranker (90 candidates ≈ 8,000 tok) | ~8,430 tok | ~1,200 tok | $0.0722 |
| **Per search** | | | **≈ $0.079 (about 8¢)** |

At 1,000 searches/day that is **$2,370/month**. Unacceptable for a free site — so the plan below
cuts it by ~6× and caps what's left.

### Optimized design (what to build)

1. **Smaller candidate pool:** 90 → 45, and trim each description 220 → 140 chars. Ranker input drops
   from ~8,000 to ~2,500 tokens. Quality barely moves — the BM25 prefilter already ranks well.
2. **Smaller output:** 8 results instead of 14, shorter "why" lines, idea sparks only for build
   requests. Output drops ~1,200 → ~600 tokens.
3. **Model tiering:**
   - Planner → **Haiku 4.5** ($1/$5). It only writes 3–8 keyword queries.
   - Ranker → **Sonnet 5** ($2/$10) as the default.
   - **Opus 5** behind an explicit "Deep search" button, plus for the curation job.
4. **Cache answers** in DynamoDB keyed by the normalized query, 30-day TTL. A directory site gets the
   same questions constantly ("3d website", "seo audit") — expect **50–80% hit rate**.
5. **Pre-compute the top ~300 intents** during the 3-day build ("skills for a 3D website", one per
   category and stack). They become **static pages** — free to serve, and they rank in Google.
6. **Guardrails:** per-IP rate limit (10 AI searches/hour), a daily spend counter in DynamoDB, and a
   hard daily cap. When the cap is hit, search silently falls back to keyword results (already built).

| Design | Per search |
|---|---|
| Today (Opus + Opus, 90 candidates) | $0.079 |
| **Optimized (Haiku plan + Sonnet rank, 45 candidates)** | **$0.013** |
| Optimized + Opus ranker ("Deep search") | $0.030 |

### Monthly AI spend (1 search per 4 pageviews, 60% cache hit)

| Pageviews/mo | Searches | Billable (40%) | Optimized @1.3¢ | Today's design @7.9¢ |
|---|---|---|---|---|
| 5,000 | 1,250 | 500 | **$7** | $40 |
| 50,000 | 12,500 | 5,000 | **$65** | $395 |
| 200,000 | 50,000 | 20,000 | **$260** | $1,580 |

With pre-computed pages absorbing the most common intents, expect the real bill to land **30–50%
below** the optimized column. Set the daily cap so the worst case is a number you're happy with:
**$1/day ≈ $30/month ceiling** is a sensible start.

---

## 5. AI cost — the 3-day update agent

Per run the discovery agent reviews up to 40 candidate repositories (README + 3 sample skills ≈
3,200 input tokens, ~250 output each).

| Model | Per run | Per month (10 runs) |
|---|---|---|
| Opus 5 | $0.89 | $8.90 |
| Sonnet 5 | $0.36 | $3.60 |
| Haiku 4.5 | $0.18 | $1.80 |
| **Recommended: Haiku screens all 40 → Sonnet reviews the ~10 that pass** | **$0.25** | **≈ $2.50** |

Optional monthly job: re-rank the ⚡ Superpowers in all 36 categories with Opus — about **$1.30/month**.

**Compute for the sync itself is free**: GitHub Actions is unlimited for public repos, and a run takes
about 25 minutes (10 runs ≈ 250 minutes/month, inside the 2,000-minute free allowance even if private).

---

## 6. Total cost of ownership

| Item | Launch | At 50k pageviews/mo |
|---|---|---|
| Domain (skillloadout.com) | $11/year ≈ $1/mo | $1 |
| AWS hosting | $0.50–1 | $1–3 |
| Claude — search bar | $5–10 (with caps) | $30–65 |
| Claude — update agent | $2.50 | $2.50 |
| GitHub Actions | $0 | $0 |
| **Total** | **≈ $9–15 / month** | **≈ $35–70 / month** |

Set **AWS Budgets** to alert at $10/month and an **Anthropic spend limit** on the API key. Those two
alarms make a runaway bill impossible.

---

## 7. What to build, in order

| Phase | Work | Effort |
|---|---|---|
| **1. Static pipeline** | `generateStaticParams` for `/skills/[id]` and `/categories/[id]`; script to pre-zip all bundles; slim client index; `aws s3 sync` script | ~3 h |
| **2. Search Lambda** | Split `/api/search` into its own Lambda; DynamoDB answer cache + rate limit + daily budget counter; Haiku/Sonnet tiering + "Deep search" toggle | ~2 h |
| **3. Infrastructure as code** | CDK or Terraform: S3, CloudFront, ACM, Lambda, DynamoDB, SSM, GitHub OIDC role | ~2 h |
| **4. Deploy + DNS** | First deploy, point Porkbun ALIAS/CNAME at CloudFront, verify HTTPS | ~1 h |
| **5. Guardrails** | AWS Budgets alarm, CloudWatch log retention, Anthropic spend limit, uptime check | ~1 h |
| **6. Pre-computed intent pages** | Generate ~300 answer pages during the 3-day build (cost + SEO win) | ~2 h |

Phases 1–4 get you live. Phase 6 is what makes the AI bill small and brings in search traffic.

---

## 8. Open decisions

1. **Monthly ceiling for AI spend** — sets the daily cap (suggested: $30/month).
2. **Opus at all?** Recommended: Sonnet by default, Opus only behind "Deep search".
3. **Static-first or Amplify?** Static-first is ~10× cheaper at scale; Amplify is faster to stand up.
4. **Repo public or private?** Public = free unlimited Actions minutes, and it is good marketing for a
   skills library. Private = 2,000 free minutes/month, still enough.
