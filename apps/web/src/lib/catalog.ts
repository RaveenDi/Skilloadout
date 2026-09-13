import "server-only";
import type { Card } from "./card";
import fs from "node:fs";
import path from "node:path";

export type SafetyFlag = { id: string; severity: "low" | "medium" | "high"; label: string };

export type Skill = {
  id: string;
  kind: "skill" | "rule" | "extension";
  name: string;
  title: string;
  description: string;
  category: string;
  categories: string[];
  tags: string[];
  worksWith: string[];
  origin: string;
  source: {
    repo: string;
    owner?: string;
    path: string;
    url: string | null;
    branch?: string;
    sha?: string | null;
    stars: number;
    tier: number;
    official: boolean;
  };
  license: string;
  licenseVia?: string;
  mirrored: boolean;
  files: { path: string; size: number }[];
  sizeBytes: number;
  hash: string;
  excerpt?: string;
  flags: SafetyFlag[];
  updatedAt: string;
  score: number;
  alsoIn?: { repo: string; url: string }[];
};

export type Stack = {
  id: string;
  title: string;
  emoji: string;
  tagline: string;
  description: string;
  skills: string[];
  resolved?: Skill[];
};

// Monorepo root: apps/web -> ../..  (override with WORLD_SKILLS_ROOT when deployed elsewhere)
export const REPO_ROOT = process.env.WORLD_SKILLS_ROOT
  ? path.resolve(process.env.WORLD_SKILLS_ROOT)
  : path.resolve(process.cwd(), "..", "..");
export const SKILLS_DIR = path.join(REPO_ROOT, "skills");
const CATALOG_DIR = path.join(REPO_ROOT, "catalog");

type Loaded = { mtime: number; generatedAt: string; skills: Skill[]; byId: Map<string, Skill>; docs: Doc[]; df: Map<string, number>; avgLen: number };
let cache: Loaded | null = null;

export function loadCatalog(): Loaded {
  const file = path.join(CATALOG_DIR, "index.json");
  let mtime = 0;
  try {
    mtime = fs.statSync(file).mtimeMs;
  } catch {
    return (cache = { mtime: 0, generatedAt: "", skills: [], byId: new Map(), docs: [], df: new Map(), avgLen: 1 });
  }
  if (cache && cache.mtime === mtime) return cache;
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as { generatedAt: string; skills: Skill[] };
  const skills = data.skills;
  const { docs, df, avgLen } = buildSearchIndex(skills);
  cache = { mtime, generatedAt: data.generatedAt, skills, byId: new Map(skills.map((s) => [s.id, s])), docs, df, avgLen };
  return cache;
}

export const getSkill = (id: string) => loadCatalog().byId.get(id);

// Hand-curated "Superpower" picks per category (catalog/top-picks.json: { categoryId: [skillIds] }).
let picksCache: { mtime: number; byCategory: Record<string, string[]>; all: Set<string> } | null = null;
export function getTopPicks() {
  const file = path.join(CATALOG_DIR, "top-picks.json");
  let mtime = 0;
  try {
    mtime = fs.statSync(file).mtimeMs;
  } catch {}
  if (picksCache && picksCache.mtime === mtime) return picksCache;
  const byCategory = mtime ? (JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string[]>) : {};
  picksCache = { mtime, byCategory, all: new Set(Object.values(byCategory).flat()) };
  return picksCache;
}
export const isSuperpower = (id: string) => getTopPicks().all.has(id);

export function readJsonFile<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, name), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function getStacks(): Stack[] {
  const stacks = readJsonFile<Stack[]>("stacks.json", []);
  const { byId } = loadCatalog();
  return stacks.map((s) => ({ ...s, resolved: s.skills.map((id) => byId.get(id)).filter((x): x is Skill => !!x) }));
}

// Safe file access inside skills/<id>/ (no path traversal).
export function readSkillFile(id: string, rel: string): string | null {
  const base = path.join(SKILLS_DIR, id);
  const target = path.resolve(base, rel);
  if (!target.startsWith(base + path.sep)) return null;
  try {
    return fs.readFileSync(target, "utf8");
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------------------------------
// Keyword retrieval (BM25 over weighted fields + synonym expansion + quality prior).
// Used for browsing and as the candidate generator for Claude-powered search.

type Doc = { skill: Skill; tf: Map<string, number>; len: number };

const STOP = new Set("a an and the for to of in on with by or is are be it this that use when you your how what i me my we our from as at into via using build make create want need".split(" "));

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/three\.js/g, "threejs")
    .replace(/next\.js/g, "nextjs")
    .replace(/node\.js/g, "nodejs")
    .replace(/[^a-z0-9+#]+/g, " ")
    .split(" ")
    .filter((t) => t.length > 1 && !STOP.has(t));
}

const SYNONYMS: Record<string, string[]> = {
  "3d": ["threejs", "webgl", "r3f", "three", "webgpu", "shader", "3d"],
  threejs: ["threejs", "webgl", "r3f", "3d"],
  scroll: ["scroll", "scrolltrigger", "lenis", "parallax", "scrollytelling", "storytelling"],
  animation: ["animation", "gsap", "motion", "framer", "animate"],
  animated: ["animation", "gsap", "motion"],
  flythrough: ["camera", "flythrough", "fly", "path", "spline"],
  walkthrough: ["walkthrough", "room", "interior", "tour", "camera"],
  website: ["website", "web", "frontend", "landing"],
  site: ["website", "web", "frontend", "landing"],
  immersive: ["immersive", "3d", "webgl", "cinematic"],
  saas: ["saas", "stripe", "auth", "nextjs", "supabase", "postgres"],
  payments: ["stripe", "payments", "billing"],
  auth: ["auth", "authentication", "oauth", "login"],
  mobile: ["mobile", "ios", "android", "expo", "reactnative", "swiftui", "flutter"],
  app: ["app", "application"],
  security: ["security", "vulnerability", "audit", "pentest", "owasp"],
  test: ["test", "testing", "playwright", "tdd", "jest"],
  docs: ["documentation", "docs", "readme", "writing"],
  ai: ["llm", "ai", "agent", "rag", "prompt", "claude", "mcp"],
  game: ["game", "phaser", "threejs", "gamedev"],
  video: ["video", "remotion", "ffmpeg"],
  slides: ["pptx", "slides", "presentation", "powerpoint"],
  data: ["data", "sql", "analytics", "pandas", "database"],
  design: ["design", "ui", "ux", "brand", "typography", "frontend"],
};

function docText(s: Skill) {
  return {
    name: tokenize(`${s.name} ${s.title}`),
    tags: tokenize(s.tags.join(" ") + " " + s.categories.join(" ")),
    desc: tokenize(s.description),
    body: tokenize((s.excerpt || "").slice(0, 600) + " " + s.source.repo.replace("/", " ")),
  };
}

function buildSearchIndex(skills: Skill[]) {
  const df = new Map<string, number>();
  const docs: Doc[] = skills.map((skill) => {
    const t = docText(skill);
    const tf = new Map<string, number>();
    const add = (arr: string[], w: number) => arr.forEach((tok) => tf.set(tok, (tf.get(tok) || 0) + w));
    add(t.name, 4);
    add(t.tags, 2.5);
    add(t.desc, 1.5);
    add(t.body, 0.4);
    for (const k of tf.keys()) df.set(k, (df.get(k) || 0) + 1);
    const len = [...tf.values()].reduce((a, b) => a + b, 0);
    return { skill, tf, len };
  });
  const avgLen = docs.reduce((a, d) => a + d.len, 0) / Math.max(docs.length, 1);
  return { docs, df, avgLen };
}

export type Filters = {
  category?: string;
  kind?: string;
  origin?: string;
  worksWith?: string;
  official?: boolean;
  downloadable?: boolean;
};

function passes(s: Skill, f: Filters) {
  if (f.category && !s.categories.includes(f.category)) return false;
  if (f.kind && s.kind !== f.kind) return false;
  if (f.origin && s.origin !== f.origin) return false;
  if (f.worksWith && !s.worksWith.includes(f.worksWith)) return false;
  if (f.official && !(s.source.official || s.source.tier === 0)) return false;
  if (f.downloadable && !s.mirrored) return false;
  return true;
}

export function keywordSearch(query: string, filters: Filters = {}, limit = 60): { skill: Skill; score: number }[] {
  const { docs, df, avgLen, skills } = loadCatalog();
  const base = tokenize(query);
  if (!base.length) {
    return skills.filter((s) => passes(s, filters)).slice(0, limit).map((skill) => ({ skill, score: skill.score }));
  }
  const qTerms = new Map<string, number>();
  for (const t of base) {
    qTerms.set(t, Math.max(qTerms.get(t) || 0, 1));
    for (const syn of SYNONYMS[t] || []) if (!qTerms.has(syn)) qTerms.set(syn, 0.45);
  }
  const N = docs.length, k1 = 1.3, b = 0.7;
  const results: { skill: Skill; score: number }[] = [];
  for (const d of docs) {
    if (!passes(d.skill, filters)) continue;
    let s = 0, matched = 0;
    for (const [term, qw] of qTerms) {
      const tf = d.tf.get(term);
      if (!tf) continue;
      const n = df.get(term) || 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      s += qw * idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * d.len) / avgLen)));
      if (qw === 1) matched++;
    }
    if (!s) continue;
    const coverage = matched / base.length;
    const prior = Math.log10(1 + Math.max(d.skill.score, 0)) * 1.2;
    results.push({ skill: d.skill, score: s * (0.6 + coverage) + prior });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function listSkills(filters: Filters, sort: "score" | "stars" | "recent" | "name", offset = 0, limit = 48) {
  const { skills } = loadCatalog();
  const list = skills.filter((s) => passes(s, filters));
  const sorted =
    sort === "stars" ? [...list].sort((a, b) => b.source.stars - a.source.stars)
    : sort === "recent" ? [...list].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    : sort === "name" ? [...list].sort((a, b) => a.title.localeCompare(b.title))
    : list;
  return { total: list.length, items: sorted.slice(offset, offset + limit) };
}

// Compact representation sent to the client / to Claude.
export function toCard(s: Skill): Card {
  return {
    id: s.id,
    title: s.title,
    name: s.name,
    description: s.description.length > 320 ? s.description.slice(0, 317) + "…" : s.description,
    category: s.category,
    tags: s.tags.slice(0, 5),
    kind: s.kind,
    origin: s.origin,
    repo: s.source.repo,
    stars: s.source.stars,
    tier: s.source.tier,
    official: s.source.official,
    license: s.license,
    mirrored: s.mirrored,
    flags: s.flags.map((f) => f.severity),
    score: s.score,
    superpower: isSuperpower(s.id),
  };
}
export type SkillCard = Card;
