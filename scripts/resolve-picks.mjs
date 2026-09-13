#!/usr/bin/env node
// Keeps catalog/top-picks.json and catalog/stacks.json valid across syncs: when a referenced id no
// longer exists (e.g. the winning copy of a skill changed after dedupe, or a repo was renamed),
// re-point it to the current skill with the same name — preferring the original (non-redistributor)
// publisher, then the highest score.
// Usage: node scripts/resolve-picks.mjs [--dry-run]
import path from "node:path";
import { CATALOG_DIR, readJson, writeJson } from "./lib/common.mjs";

const DRY = process.argv.includes("--dry-run");
const { skills } = readJson(path.join(CATALOG_DIR, "index.json"), { skills: [] });
const picksPath = path.join(CATALOG_DIR, "top-picks.json");
const picks = readJson(picksPath, {});
const ids = new Set(skills.map((s) => s.id));
const byName = new Map();
for (const s of skills) {
  const key = s.id.split("--")[0];
  if (!byName.has(key)) byName.set(key, []);
  byName.get(key).push(s);
}

const changes = [];
const unresolved = [];

// name (the part before "--owner") -> best current skill for it
function bestMatch(id) {
  const [name, owner] = id.split("--");
  const cands = (byName.get(name) || []).sort(
    (a, b) =>
      (b.source.owner?.toLowerCase() === owner) - (a.source.owner?.toLowerCase() === owner) ||
      (a.source.redistributor ? 1 : 0) - (b.source.redistributor ? 1 : 0) ||
      b.score - a.score,
  );
  return cands[0] || null;
}
for (const [cat, list] of Object.entries(picks)) {
  const next = [];
  for (const id of list) {
    if (ids.has(id)) {
      next.push(id);
      continue;
    }
    const best = bestMatch(id);
    if (best) {
      changes.push(`${cat}: ${id} -> ${best.id}`);
      next.push(best.id);
    } else unresolved.push(`${cat}: ${id}`);
  }
  picks[cat] = [...new Set(next)];
}

// --- stacks ---
const stacksPath = path.join(CATALOG_DIR, "stacks.json");
const stacks = readJson(stacksPath, []);
for (const st of stacks) {
  const next = [];
  for (const id of st.skills) {
    if (ids.has(id)) {
      next.push(id);
      continue;
    }
    const best = bestMatch(id);
    if (best) {
      changes.push(`stack ${st.id}: ${id} -> ${best.id}`);
      next.push(best.id);
    } else unresolved.push(`stack ${st.id}: ${id}`);
  }
  st.skills = [...new Set(next)];
}
if (!DRY) writeJson(stacksPath, stacks);

for (const c of changes) console.log(`~ ${c}`);
for (const u of unresolved) console.log(`? unresolved ${u}`);
if (!DRY) writeJson(picksPath, picks);
console.log(`resolve-picks: ${changes.length} re-pointed, ${unresolved.length} unresolved${DRY ? " (dry run)" : ""}`);
