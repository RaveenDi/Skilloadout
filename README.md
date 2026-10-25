# Skill Loadout 🎒

**12,000+ AI agent skills — license-checked, safety-scanned, and refreshed every Friday.**

Plug the whole catalog into Claude Code, Cursor, Codex CLI or Gemini CLI as a **plugin marketplace**
or an **MCP server**. No website, no account, no backend: this repo is the product.

[![Skills](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FRaveenDi%2FSkilloadout%2Fmain%2Fcatalog%2Fstats.json&query=%24.total&label=skills&color=blue)](catalog/index.json)
[![Sources](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FRaveenDi%2FSkilloadout%2Fmain%2Fcatalog%2Fstats.json&query=%24.sources&label=sources&color=blue)](catalog/sources.json)
[![Auto-update](https://img.shields.io/github/actions/workflow/status/RaveenDi/Skilloadout/update-skills.yml?label=auto-update)](.github/workflows/update-skills.yml)
[![Last update](https://img.shields.io/github/last-commit/RaveenDi/Skilloadout?label=last%20sync)](https://github.com/RaveenDi/Skilloadout/commits/main)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## Get started in 30 seconds

**Claude Code** — add the curated top picks as plugins:

```bash
claude plugin marketplace add RaveenDi/Skilloadout
claude plugin install harness-engineering@skill-loadout
```

**Any MCP client** (Claude Code, Claude Desktop, Cursor, Codex CLI, Gemini CLI) — search and install
from all 12,000+ skills on demand:

```bash
git clone --depth 1 https://github.com/RaveenDi/Skilloadout && cd Skilloadout/mcp-server && npm install
claude mcp add --scope user skill-loadout -- node "$(pwd)/index.mjs"
```

Then just ask your agent: *"find me a skill for scroll-driven 3D camera moves and install it."*

## Why this one

- **Safety first.** Every skill is scanned for prompt injection, credential access, obfuscated
  code, miners and destructive commands. Flagged skills get a **reviewed verdict**, not just a regex
  match, so a YARA tutorial that mentions `xmrig` isn't treated like malware. Skills reviewed as
  malicious are refused at install. See [Safety](#safety).
- **License-respecting.** Only redistributable licenses are mirrored, each with an `ATTRIBUTION.md`
  and the upstream license. Everything else is a link to its source.
- **Always fresh.** A GitHub Actions agent finds new skill repos (Claude reviews each one), re-syncs
  every source, dedupes, scores, safety-reviews and commits, every Friday.
- **Works everywhere.** Skills follow the open **Agent Skills** format (`SKILL.md` + optional
  scripts/references) used by **Claude** (Code, Desktop, claude.ai), **OpenAI Codex**, **Gemini CLI**,
  **GitHub Copilot** and **Cursor**. Cursor rules are auto-converted to `SKILL.md`.

```
.
├── skills/                 # the library — one folder per skill (mirrored verbatim + ATTRIBUTION.md)
├── originals/              # Skill Loadout Originals (authored here): 3D, fly-throughs, walkthroughs, context/harness/AI engineering…
├── catalog/
│   ├── sources.json        # source registry (tiers, kinds); discovery agent appends to `discovered`
│   ├── index.json          # generated catalog (one skill per line)
│   ├── top-picks.json      # ⚡ curated picks — also what the plugin marketplace lists
│   ├── stacks.json         # curated multi-skill bundles
│   ├── safety-verdicts.json, safety-overrides.json   # reviewed safety verdicts (cached) + human overrides
│   ├── stats.json, changelog.json, discovery-log.json, state.json
├── scripts/
│   ├── sync.mjs            # clone → find → license check → mirror/link → classify → dedupe → score → index
│   ├── discover.mjs        # discovery agent (GitHub search + Claude review)
│   ├── verify-safety.mjs   # Claude review of scan-flagged skills → benign / caution / malicious
│   ├── validate.mjs        # catalog integrity checks
│   ├── build-marketplace.mjs  # generates .claude-plugin/marketplace.json from top-picks.json
│   └── lib/                # taxonomy, license detection, safety scan, helpers
├── .claude-plugin/marketplace.json   # Claude Code plugin marketplace (generated)
├── mcp-server/              # MCP server: search_skills, get_skill, install_skill, list_categories
└── .github/workflows/update-skills.yml   # weekly (Friday) update agent
```

## Quick start

```bash
npm install
npm run sync            # download/refresh all sources (~10–20 min first time; incremental after)
```

Useful flags: `node scripts/sync.mjs --only owner/repo`, `--force`, `--keep-cache`.
`npm run discover` runs the discovery agent, `npm run picks` re-points the ⚡ Superpower list,
`npm run validate` checks catalog integrity, `npm run marketplace` rebuilds the plugin marketplace,
`npm run verify-safety` reviews flagged skills (needs `ANTHROPIC_API_KEY`; `-- --evidence-only` dumps
the matched lines to `.cache/` without calling the API).

To actually use the skills from an agent, see
[Connecting an agent directly](#connecting-an-agent-directly-no-website) below.

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

### Update agent (every Friday)
`.github/workflows/update-skills.yml` runs Fridays at 00:23 UTC (`23 0 * * 5`) or manually:
1. **Discovery** — GitHub search across skill topics/keywords → filters known/aggregator repos →
   **Claude (claude-opus-5) reviews** each candidate's README + sample skills for quality, originality
   and safety (heuristic fallback without a key) → accepted repos are appended to `sources.json`.
2. **Sync** — incremental re-sync of every source.
3. **Safety review** — Claude reviews newly flagged or changed skills (cached; see [Safety](#safety)).
4. **Validate** — integrity checks (no non-redistributable content mirrored, no missing files).
5. **Marketplace** — regenerates `.claude-plugin/marketplace.json`.
6. **Commit** — pushes the refreshed catalog. Add an `ANTHROPIC_API_KEY` repository secret to enable
   both Claude reviews (without it, discovery uses a heuristic and flagged skills stay *unverified*).

## Categories & Superpowers

`catalog/taxonomy.json` defines 36 categories in 5 groups (Build, Create, Business, Work, Knowledge) —
the single source of truth for the sync classifier. `catalog/top-picks.json` holds the hand-curated
**⚡ Superpower** skills per category (the best few) — this is also exactly what the plugin
marketplace lists. Bulk/auto-generated collections are listed in `sources.json → exclude` so only
top skills make it in.

## Connecting an agent directly (no website)

Two ways to pull skills straight from this repo, both regenerated by the scheduler on every sync —
no server to run or host:

- **Claude Code plugin marketplace** — `.claude-plugin/marketplace.json` lists the ⚡ curated top
  picks (`catalog/top-picks.json`) as installable plugins; each is just its existing `skills/<id>/`
  folder (a root `SKILL.md` already loads as one skill, no wrapping needed):
  ```bash
  claude plugin marketplace add RaveenDi/Skilloadout
  claude plugin install <skill-id>@skill-loadout
  ```
  Regenerate manually with `node scripts/build-marketplace.mjs` (the scheduler does this every run).

- **MCP server** (`mcp-server/`) — `search_skills` / `get_skill` / `install_skill` /
  `list_categories` tools over the *entire* catalog (not just top picks), for Claude Code, Claude
  Desktop, Cursor, Codex CLI, or Gemini CLI. Reads `catalog/index.json` and `skills/` directly off
  disk — no network, no key. This repo's own `.mcp.json` wires it in for anyone who opens the repo
  in Claude Code; see [`mcp-server/README.md`](mcp-server/README.md) for other clients.

## Safety

Skills are instructions plus scripts that an agent will run, so a bad one is a real supply-chain risk.
Two passes protect you:

1. **Scan** (`scripts/lib/safety.mjs`) — on every sync, each skill's files are checked for
   prompt-injection text, credential-file access, obfuscated execution, crypto-miners, destructive
   commands, pipe-to-shell installs and disabled safety checks.
2. **Review** (`scripts/verify-safety.mjs`) — a regex can't tell a skill that *detects* an attack from
   one that *performs* it, so each flagged skill's matched lines go to Claude for a verdict:
   **benign**, **caution** (legitimate but read it before running) or **malicious**. Verdicts are
   cached in `catalog/safety-verdicts.json` by a hash of the matched content, so a skill is
   re-reviewed only when that content changes.

The MCP server shows only reviewed warnings. Unreviewed matches are labelled *unverified*, never as
findings. `install_skill` refuses anything reviewed as malicious, and the plugin marketplace leaves
it out.

**Maintainers:** if your skill got a wrong verdict, open an issue. Human verdicts live in
`catalog/safety-overrides.json` and take priority over the automated review while the matched
content stays unchanged.

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
