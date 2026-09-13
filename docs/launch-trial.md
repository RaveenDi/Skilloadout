# Skill Loadout — 30-day trial plan

Ship it cheap, measure honestly, decide at day 30. Nothing here needs an AI key or a server.

---

## What the trial version is

| | |
|---|---|
| **Site** | 100% static HTML — every page pre-rendered at build time |
| **Search** | instant, in the browser, over a 2.5 MB index (no API, no AI key, no cost) |
| **Downloads** | 5,635 pre-built skill zips (107 MB) + 47 bundles (9.7 MB) served straight from S3 |
| **Updates** | GitHub Actions every 3 days → rebuild → redeploy (free) |
| **AI search** | **off.** Code is parked in `apps/web/src/_dynamic-api/` and can be switched on later |
| **Running cost** | **domain (~$11/yr) + ~$1/month of AWS** |

Why no AI search for the trial: at developer-audience ad rates it costs roughly what it earns. The
full reasoning and the switch-on plan are in [aws-plan.md](aws-plan.md).

---

## One-time AWS setup (~30 minutes)

Region: `us-east-1` (the ACM certificate for CloudFront must live there).

```bash
# 1. Bucket to hold the built site (private; CloudFront reads it via OAC)
aws s3api create-bucket --bucket skillloadout-site --region us-east-1

# 2. TLS certificate (validate by adding the CNAME it prints to Porkbun DNS)
aws acm request-certificate --domain-name skillloadout.com \
  --subject-alternative-names www.skillloadout.com --validation-method DNS --region us-east-1

# 3. CloudFront distribution
#    - origin: the S3 bucket, access via Origin Access Control (not public bucket)
#    - default root object: index.html
#    - custom error 403/404 -> /404.html (200 for SPA-ish routes is not needed; pages are real files)
#    - alternate domain names: skillloadout.com, www.skillloadout.com + the ACM cert
#    Easiest in the console the first time; note the distribution ID and *.cloudfront.net domain.

# 4. DNS at Porkbun
#    ALIAS  @    -> dxxxxxxxxxxxxx.cloudfront.net
#    CNAME  www  -> dxxxxxxxxxxxxx.cloudfront.net

# 5. GitHub OIDC role so Actions can deploy without storing AWS keys
#    Trust policy: token.actions.githubusercontent.com, sub = repo:RaveenDi/<repo>:ref:refs/heads/main
#    Permissions: s3:ListBucket/PutObject/DeleteObject on the bucket,
#                 cloudfront:CreateInvalidation on the distribution.
```

Then set the repository variables used by `.github/workflows/deploy.yml`:
`AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION`, `SITE_URL`, and the secret `AWS_DEPLOY_ROLE_ARN`.

**Guardrails to set on day 1:** AWS Budgets alert at **$10/month**, and CloudWatch log retention 7 days.

---

## Launch week checklist

- [ ] Buy `skillloadout.com` at Porkbun, turn auto-renew on
- [ ] AWS setup above; first deploy via **Actions → Build & deploy → Run workflow**
- [ ] Verify: home, `/browse`, a skill page, a zip download, `/sitemap.xml`, `/robots.txt`
- [ ] Google Analytics property → set `GA_ID` repo variable → redeploy
- [ ] Google Search Console → verify domain → submit `https://skillloadout.com/sitemap.xml`
- [ ] Donations: Ko-fi (PayPal) or Buy Me a Coffee (Stripe) → set the repo variable
- [ ] Grab the `skillloadout` handle on GitHub, X, Ko-fi/BMC
- [ ] Launch posts: Show HN, r/ClaudeAI, r/ChatGPTCoding, r/LocalLLaMA, X, dev.to, Product Hunt

Do **not** apply to AdSense in week 1 — a brand-new site with no traffic usually gets rejected, and a
rejection makes reapplying slower. Apply in week 3–4 if traffic is real.

---

## What to measure (weekly, 10 minutes)

| Metric | Where | Healthy at day 30 |
|---|---|---|
| Unique visitors | GA4 | **> 1,000/month** |
| Pageviews | GA4 | > 3,000/month |
| Zip downloads | GA4 event on `/downloads/*` | > 150 |
| Google impressions | Search Console | > 3,000 and rising |
| Indexed pages | Search Console | > 500 of 6,338 |
| Returning visitors | GA4 | > 10% |
| Inbound links / mentions | Search Console, X search | ≥ 3 organic mentions |

---

## Day-30 decision

**Keep going** if at least three of these are true:
- 1,000+ unique visitors in month 1
- Search Console impressions growing week over week
- 150+ downloads (people take the thing, not just look)
- Any unsolicited mention, star, or email
- You still enjoy it

Then: add the newsletter, pitch one sponsor, apply to AdSense, and consider turning AI search on with
a daily cap.

**Tear it down** if it's clearly flat: under ~300 visitors, no downloads, no mentions. That's the
market answering. Total sunk cost: about $12.

---

## Teardown (15 minutes, ~$0 left behind)

```bash
# 1. Stop the schedules
#    Disable both workflows: Actions → Update skills / Build & deploy → ⋯ → Disable workflow

# 2. Empty and delete the bucket
aws s3 rm s3://skillloadout-site --recursive
aws s3api delete-bucket --bucket skillloadout-site --region us-east-1

# 3. Disable, then delete the CloudFront distribution (disable first; deletion needs it disabled)
aws cloudfront get-distribution-config --id EXXXXXXXXXXXXX > dist.json   # edit Enabled -> false
aws cloudfront update-distribution --id EXXXXXXXXXXXXX --if-match <ETag> --distribution-config file://dist.json
aws cloudfront delete-distribution --id EXXXXXXXXXXXXX --if-match <ETag>

# 4. Delete the ACM certificate and the OIDC IAM role
aws acm delete-certificate --certificate-arn <arn> --region us-east-1
aws iam delete-role --role-name skillloadout-deploy   # detach policies first

# 5. Domain: turn OFF auto-renew at Porkbun (it just expires; no refund)
# 6. Keep the GitHub repo — it costs nothing and the 6,500-skill catalog is the portfolio piece
```

**Keep regardless of the outcome:** the repo, the 17 original skills, and the sync engine. Those stay
useful whether or not the site does.

---

## If it works: what to add, in order

1. **Newsletter** — "new skills every 3 days". The list is worth more than the ads.
2. **One sponsor** — a category page + its bundle, $100–300/month.
3. **AdSense** — two right-rail units, already wired.
4. **AI search** — Haiku plan + Sonnet rank, DynamoDB cache, $1/day cap (see `aws-plan.md` §4).
5. **A paid product** — e.g. a 3D scroll-site starter built from the loadout, $29–49.
