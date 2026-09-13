#!/usr/bin/env node
// Build-time artifacts for the fully static site (no server, no Lambda):
//   apps/web/public/downloads/<id>.zip        one zip per downloadable skill
//   apps/web/public/bundles/<name>.zip        stack bundles + per-category Superpower bundles
//   apps/web/public/search-index.json         slim index for instant client-side search
//   apps/web/public/catalog-stats.json        counts used by the UI
//
// Usage: node scripts/build-artifacts.mjs [--skip-zips]

import fs from "node:fs";
import path from "node:path";
import { zipSync, strToU8 } from "fflate";
import { ROOT, SKILLS_DIR, CATALOG_DIR, readJson, walk, toPosix } from "./lib/common.mjs";

const SKIP_ZIPS = process.argv.includes("--skip-zips");
const PUBLIC_DIR = path.join(ROOT, "apps", "web", "public");
const DOWNLOADS = path.join(PUBLIC_DIR, "downloads");
const BUNDLES = path.join(PUBLIC_DIR, "bundles");

const index = readJson(path.join(CATALOG_DIR, "index.json"), { skills: [] });
const picks = readJson(path.join(CATALOG_DIR, "top-picks.json"), {});
const stacks = readJson(path.join(CATALOG_DIR, "stacks.json"), []);
const taxonomy = readJson(path.join(CATALOG_DIR, "taxonomy.json"), []);
const skills = index.skills;
const byId = new Map(skills.map((s) => [s.id, s]));
const pickSet = new Set(Object.values(picks).flat());

const folderName = (s) => (s.name || s.id).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || s.id;

function installGuide(entries, title) {
  return `# ${title}

Downloaded from Skill Loadout (skillloadout.com). Each folder is an Agent Skill — a SKILL.md plus
optional scripts and references.

## Install

| Tool | Where to put each skill folder |
|------|--------------------------------|
| Claude Code | \`~/.claude/skills/<folder>/\` (personal) or \`.claude/skills/<folder>/\` (project) |
| Claude.ai / Desktop | Settings → Capabilities → Skills → upload the folder as a .zip |
| OpenAI Codex / ChatGPT | \`~/.codex/skills/<folder>/\` |
| Gemini CLI | \`~/.gemini/skills/<folder>/\` |
| GitHub Copilot | \`.github/skills/<folder>/\` |
| Cursor | \`.cursor/skills/<folder>/\` |

The agent reads each skill's name + description and loads the full instructions only when relevant.
Review any bundled scripts before running them — see ATTRIBUTION.md in each folder for source and license.

## Included
${entries.map((e) => `- ${e}`).join("\n")}
`;
}

function readSkillFiles(s, prefix) {
  const dir = path.join(SKILLS_DIR, s.id);
  if (!fs.existsSync(dir)) return null;
  const out = {};
  for (const abs of walk(dir)) {
    const rel = toPosix(path.relative(dir, abs));
    out[`${prefix}${rel}`] = new Uint8Array(fs.readFileSync(abs));
  }
  return out;
}

// ---------------------------------------------------------------------------------------------

function buildSkillZips() {
  fs.rmSync(DOWNLOADS, { recursive: true, force: true });
  fs.mkdirSync(DOWNLOADS, { recursive: true });
  let made = 0, bytes = 0, missing = 0;
  for (const s of skills) {
    if (!s.mirrored) continue;
    const files = readSkillFiles(s, `${folderName(s)}/`);
    if (!files) {
      missing++;
      continue;
    }
    const zip = zipSync(files, { level: 6 });
    fs.writeFileSync(path.join(DOWNLOADS, `${s.id}.zip`), zip);
    made++;
    bytes += zip.length;
    if (made % 1000 === 0) console.log(`  ${made} skill zips…`);
  }
  console.log(`skill zips: ${made} (${(bytes / 1048576).toFixed(1)} MB)${missing ? `, ${missing} missing on disk` : ""}`);
}

function buildBundle(name, title, list) {
  const downloadable = list.filter((s) => s && s.mirrored);
  if (!downloadable.length) return null;
  const entries = {};
  const names = [];
  for (const s of downloadable) {
    const files = readSkillFiles(s, `${name}/${folderName(s)}/`);
    if (!files) continue;
    Object.assign(entries, files);
    names.push(`${folderName(s)} — ${s.title} (${s.source.repo}, ${s.license})`);
  }
  const linkOnly = list.filter((s) => s && !s.mirrored);
  let guide = installGuide(names, title);
  if (linkOnly.length) {
    guide += `\n## Link-only (license does not allow redistribution — install from source)\n${linkOnly
      .map((s) => `- ${s.title}: ${s.source.url}`)
      .join("\n")}\n`;
  }
  entries[`${name}/INSTALL.md`] = strToU8(guide);
  const zip = zipSync(entries, { level: 6 });
  fs.writeFileSync(path.join(BUNDLES, `${name}.zip`), zip);
  return { name, skills: downloadable.length, bytes: zip.length };
}

function buildBundles() {
  fs.rmSync(BUNDLES, { recursive: true, force: true });
  fs.mkdirSync(BUNDLES, { recursive: true });
  const made = [];
  for (const st of stacks) {
    const r = buildBundle(st.id, st.title, st.skills.map((id) => byId.get(id)));
    if (r) made.push(r);
  }
  for (const c of taxonomy) {
    const ids = picks[c.id] || [];
    if (!ids.length) continue;
    const r = buildBundle(`${c.id}-superpowers`, `${c.label} — Superpowers`, ids.map((id) => byId.get(id)));
    if (r) made.push(r);
  }
  console.log(`bundles: ${made.length} (${(made.reduce((a, b) => a + b.bytes, 0) / 1048576).toFixed(1)} MB)`);
}

// ---------------------------------------------------------------------------------------------
// Slim index for instant client-side search (no API, no server).

function buildSearchIndex() {
  const items = skills.map((s) => ({
    i: s.id,
    t: s.title,
    d: s.description.length > 180 ? s.description.slice(0, 177) + "…" : s.description,
    c: s.category,
    g: s.tags.slice(0, 6),
    o: s.origin,
    r: s.source.repo,
    s: s.source.stars,
    l: s.license,
    m: s.mirrored ? 1 : 0,
    f: s.source.official || s.source.tier === 0 ? 1 : 0,
    p: pickSet.has(s.id) ? 1 : 0,
    k: s.kind === "skill" ? undefined : s.kind,
    q: Math.round(s.score),
    w: s.flags.some((x) => x.severity === "high") ? 1 : undefined,
  }));
  items.sort((a, b) => b.q - a.q);
  const file = path.join(PUBLIC_DIR, "search-index.json");
  fs.writeFileSync(file, JSON.stringify({ generatedAt: index.generatedAt, count: items.length, items }));
  console.log(`search-index.json: ${items.length} items (${(fs.statSync(file).size / 1048576).toFixed(2)} MB)`);
}

function buildAdsTxt() {
  const client = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "").trim();
  const pub = client.replace(/^ca-/, "");
  const line = pub ? "google.com, " + pub + ", DIRECT, f08c47fec0942fa0" : "# No ad sellers configured yet";
  fs.writeFileSync(path.join(PUBLIC_DIR, "ads.txt"), line + "\n");
}

function buildStats() {
  const stats = readJson(path.join(CATALOG_DIR, "stats.json"), {});
  fs.writeFileSync(path.join(PUBLIC_DIR, "catalog-stats.json"), JSON.stringify(stats));
}

// ---------------------------------------------------------------------------------------------

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (!SKIP_ZIPS) {
  buildSkillZips();
  buildBundles();
} else {
  console.log("(skipping zips)");
}
buildSearchIndex();
buildStats();
buildAdsTxt();
console.log("artifacts ready in apps/web/public/");
