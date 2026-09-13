# Parked dynamic API routes

These were `src/app/api/*` before the site was switched to a fully static build
(`output: "export"` in `next.config.ts`).

| Route | Replaced by |
|---|---|
| `search/route.ts` (Claude AI search) | client-side instant search (`src/lib/search-client.ts`) |
| `skills/route.ts` (filtered listing) | same client-side index |
| `download/[id]/route.ts` | pre-built `public/downloads/<id>.zip` |
| `bundle/route.ts` | pre-built `public/bundles/<name>.zip` |

To switch AI search back on: move `search/` back to `src/app/api/`, drop `output: "export"`,
and deploy the app to a Lambda/container instead of S3. Costs and caps are covered in
`docs/aws-plan.md`.
