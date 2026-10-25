#!/usr/bin/env node
// Generates .claude-plugin/marketplace.json so `claude plugin marketplace add RaveenDi/Skilloadout`
// exposes the curated ⚡ top picks as installable Claude Code plugins — no server, no build step,
// just the git repo. Each skill already IS a valid plugin as-is (a root-level SKILL.md with no
// skills/ subfolder loads as one skill — see https://code.claude.com/docs/en/plugins/components),
// so a plugin entry just points straight at its existing skills/<id>/ directory.
//
// Re-run after every sync so the marketplace tracks catalog/top-picks.json automatically.
// Usage: node scripts/build-marketplace.mjs
import fs from "node:fs";
import path from "node:path";
import { ROOT, CATALOG_DIR, readJson, writeJson } from "./lib/common.mjs";

const index = readJson(path.join(CATALOG_DIR, "index.json"), { skills: [] });
const topPicks = readJson(path.join(CATALOG_DIR, "top-picks.json"), {});
const byId = new Map(index.skills.map((s) => [s.id, s]));

const pickedIds = [...new Set(Object.values(topPicks).flat())].sort();
const plugins = [];
const missing = [];
for (const id of pickedIds) {
  const s = byId.get(id);
  if (!s) {
    missing.push(id);
    continue;
  }
  if (!fs.existsSync(path.join(ROOT, "skills", id, "SKILL.md"))) {
    missing.push(id);
    continue;
  }
  if (s.safety?.verdict === "malicious") {
    missing.push(`${id} (reviewed malicious)`);
    continue;
  }
  plugins.push({
    name: id,
    source: `./skills/${id}`,
    description: (s.description || s.title || id).replace(/\s+/g, " ").trim().slice(0, 300),
  });
}

const marketplace = {
  name: "skill-loadout",
  description: "Skill Loadout — curated, license-checked, safety-scanned AI agent skills (the ⚡ top picks across 36 categories), auto-updated every 3 days.",
  owner: { name: "Skill Loadout", url: "https://github.com/RaveenDi/Skilloadout" },
  plugins,
};

writeJson(path.join(ROOT, ".claude-plugin", "marketplace.json"), marketplace);
console.log(`marketplace: ${plugins.length} plugins written to .claude-plugin/marketplace.json`);
if (missing.length) console.log(`  skipped (not in catalog, not mirrored, or reviewed malicious): ${missing.join(", ")}`);
