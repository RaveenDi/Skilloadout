#!/usr/bin/env node
// Catalog integrity checks (run in CI after sync). Exits non-zero on hard failures.
import fs from "node:fs";
import path from "node:path";
import { CATALOG_DIR, SKILLS_DIR, readJson } from "./lib/common.mjs";
import { isRedistributable } from "./lib/license.mjs";

const index = readJson(path.join(CATALOG_DIR, "index.json"), null);
const errors = [];
const warnings = [];
if (!index?.skills?.length) errors.push("catalog/index.json missing or empty");

const ids = new Set();
for (const s of index?.skills || []) {
  if (ids.has(s.id)) errors.push(`duplicate id ${s.id}`);
  ids.add(s.id);
  if (!s.name || !s.description) warnings.push(`${s.id}: missing name/description`);
  if (s.mirrored) {
    if (!isRedistributable(s.license) && s.origin !== "world-skills") errors.push(`${s.id}: mirrored but license ${s.license} is not redistributable`);
    const dir = path.join(SKILLS_DIR, s.id);
    if (!fs.existsSync(dir)) errors.push(`${s.id}: mirrored folder missing`);
    else if (s.kind !== "extension" && !fs.existsSync(path.join(dir, "SKILL.md"))) errors.push(`${s.id}: SKILL.md missing`);
  }
}
const stacks = readJson(path.join(CATALOG_DIR, "stacks.json"), []);
for (const st of stacks) for (const id of st.skills) if (!ids.has(id)) warnings.push(`stack ${st.id}: unknown skill ${id}`);

// A sync must never quietly shrink the catalog: a failed source used to wipe its skills.
const changelog = readJson(path.join(CATALOG_DIR, "changelog.json"), []);
const previousTotal = changelog[1]?.total ?? changelog[0]?.total ?? 0;
const currentTotal = index?.skills?.length || 0;
if (previousTotal && currentTotal < previousTotal * 0.9) {
  errors.push(
    `catalog shrank from ${previousTotal} to ${currentTotal} skills (>10%) — a source probably failed to sync; re-run before deploying`,
  );
}

const taxonomyIds = new Set(readJson(path.join(CATALOG_DIR, "taxonomy.json"), []).map((c) => c.id));
const picks = readJson(path.join(CATALOG_DIR, "top-picks.json"), {});
for (const [cat, list] of Object.entries(picks)) {
  if (!taxonomyIds.has(cat)) errors.push(`top-picks: unknown category ${cat}`);
  for (const id of list) if (!ids.has(id)) warnings.push(`top-picks ${cat}: unknown skill ${id}`);
}

for (const w of warnings.slice(0, 50)) console.log(`warn: ${w}`);
if (warnings.length > 50) console.log(`… ${warnings.length - 50} more warnings`);
for (const e of errors.slice(0, 100)) console.error(`ERROR: ${e}`);
console.log(`validate: ${index?.skills?.length || 0} skills, ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
