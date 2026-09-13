// Category taxonomy + keyword classifier. Source of truth: catalog/taxonomy.json (shared with the web app).
// Each item gets a primary category (best score), up to 3 categories, and tags (matched keywords).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TAXONOMY_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "catalog", "taxonomy.json");
export const CATEGORIES = JSON.parse(fs.readFileSync(TAXONOMY_PATH, "utf8"));
export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
export const FALLBACK_CATEGORY = "workflow-agents";

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const compiled = CATEGORIES.map((c) => ({
  id: c.id,
  matchers: c.keywords.map((k) => ({ k, re: new RegExp(`(^|[^a-z0-9])${escapeRe(k)}([^a-z0-9]|$)`, "i") })),
}));

export function classify({ name = "", description = "", path: p = "", body = "" }) {
  const fields = [
    [name.replace(/[-_]/g, " "), 4],
    [description, 2],
    [p.replace(/[\/_-]/g, " "), 1],
    [body.slice(0, 3000), 0.5],
  ];
  const scores = [];
  const tags = new Map();
  for (const c of compiled) {
    let score = 0;
    for (const { k, re } of c.matchers) {
      let hit = 0;
      for (const [text, w] of fields) if (text && re.test(text)) hit += w;
      if (hit) {
        score += hit;
        tags.set(k, (tags.get(k) || 0) + hit);
      }
    }
    if (score) scores.push({ id: c.id, score });
  }
  scores.sort((a, b) => b.score - a.score);
  const top = scores[0]?.score || 0;
  const categories = scores.filter((s) => s.score >= Math.max(2, top * 0.45)).slice(0, 3).map((s) => s.id);
  return {
    category: categories[0] || FALLBACK_CATEGORY,
    categories: categories.length ? categories : [FALLBACK_CATEGORY],
    tags: [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => k),
  };
}
