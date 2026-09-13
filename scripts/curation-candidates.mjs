#!/usr/bin/env node
// Prints the strongest candidates per category to help curate catalog/top-picks.json (⚡ Superpowers).
// Usage: node scripts/curation-candidates.mjs [--per 20] [--category id] > .cache/candidates.txt
import path from "node:path";
import { CATALOG_DIR, readJson } from "./lib/common.mjs";
import { CATEGORIES } from "./lib/taxonomy.mjs";

const argv = process.argv.slice(2);
const PER = Number(argv[argv.indexOf("--per") + 1]) || 20;
const ONLY = argv.includes("--category") ? argv[argv.indexOf("--category") + 1] : null;

const { skills } = readJson(path.join(CATALOG_DIR, "index.json"), { skills: [] });
const picks = readJson(path.join(CATALOG_DIR, "top-picks.json"), {});

for (const c of CATEGORIES) {
  if (ONLY && c.id !== ONLY) continue;
  const inCat = skills.filter((s) => s.category === c.id || (s.categories || []).slice(0, 2).includes(c.id));
  // Rank: primary-category match first, then score; drop flagged-high items.
  const ranked = inCat
    .filter((s) => !(s.flags || []).some((f) => f.severity === "high"))
    .sort((a, b) => (b.category === c.id) - (a.category === c.id) || b.score - a.score)
    .slice(0, PER);
  console.log(`\n### ${c.id} — ${c.label} (${inCat.length} skills; current picks: ${(picks[c.id] || []).length})`);
  for (const s of ranked) {
    const tier = s.source.tier === 0 ? "ORIG" : s.source.official ? "OFF" : `t${s.source.tier}`;
    console.log(`${s.id} | ${tier} ${s.source.repo} ★${s.source.stars} | ${s.mirrored ? "M" : "L"} | ${s.score} | ${s.description.slice(0, 110)}`);
  }
}
