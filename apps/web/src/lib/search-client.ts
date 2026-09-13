// Client-side instant search over the slim index (public/search-index.json).
// No server, no API, no AI key: BM25-style scoring with synonym expansion, same shape as the
// server-side ranking we used before. Index is fetched once and cached in module scope.

export type Item = {
  i: string; // id
  t: string; // title
  d: string; // description
  c: string; // category
  g: string[]; // tags
  o: string; // origin
  r: string; // repo
  s: number; // stars
  l: string; // license
  m: 0 | 1; // mirrored (downloadable)
  f: 0 | 1; // official or original
  p: 0 | 1; // superpower pick
  k?: string; // kind, when not "skill"
  q: number; // quality score
  w?: 1; // has a high-severity safety flag
};

type Index = { generatedAt: string; count: number; items: Item[] };

let cache: Promise<Index> | null = null;
export function loadIndex(): Promise<Index> {
  if (!cache) {
    cache = fetch("/search-index.json")
      .then((r) => r.json() as Promise<Index>)
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

const STOP = new Set(
  "a an and the for to of in on with by or is are be it this that use when you your how what i me my we our from as at into via using build make create want need".split(" "),
);

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
  "3d": ["threejs", "webgl", "r3f", "webgpu", "shader", "3d"],
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
  mobile: ["mobile", "ios", "android", "expo", "swiftui", "flutter"],
  security: ["security", "vulnerability", "audit", "pentest", "owasp"],
  test: ["test", "testing", "playwright", "tdd", "jest"],
  docs: ["documentation", "docs", "readme", "writing"],
  ai: ["llm", "ai", "agent", "rag", "prompt", "claude", "mcp"],
  game: ["game", "phaser", "unity", "gamedev"],
  video: ["video", "remotion", "ffmpeg"],
  slides: ["pptx", "slides", "presentation", "powerpoint"],
  data: ["data", "sql", "analytics", "pandas", "database"],
  design: ["design", "ui", "ux", "brand", "typography", "frontend"],
  legal: ["legal", "contract", "compliance", "nda"],
  finance: ["finance", "financial", "accounting", "investing", "trading"],
  medical: ["medical", "clinical", "healthcare", "patient", "fhir"],
  teaching: ["education", "teaching", "lesson", "tutor", "curriculum"],
};

export type Filters = {
  category?: string;
  kind?: string;
  origin?: string;
  official?: boolean;
  downloadable?: boolean;
  superpower?: boolean;
};

const passes = (it: Item, f: Filters) =>
  (!f.category || it.c === f.category) &&
  (!f.kind || (it.k || "skill") === f.kind) &&
  (!f.origin || it.o === f.origin) &&
  (!f.official || it.f === 1) &&
  (!f.downloadable || it.m === 1) &&
  (!f.superpower || it.p === 1);

export type Sort = "score" | "stars" | "name";

export function search(items: Item[], query: string, filters: Filters = {}, sort: Sort = "score"): Item[] {
  const pool = items.filter((it) => passes(it, filters));
  const base = tokenize(query);
  if (!base.length) {
    if (sort === "stars") return [...pool].sort((a, b) => b.s - a.s);
    if (sort === "name") return [...pool].sort((a, b) => a.t.localeCompare(b.t));
    return pool; // index is pre-sorted by quality score
  }

  const terms = new Map<string, number>();
  for (const t of base) {
    terms.set(t, 1);
    for (const syn of SYNONYMS[t] || []) if (!terms.has(syn)) terms.set(syn, 0.45);
  }

  const scored: { it: Item; score: number }[] = [];
  for (const it of pool) {
    const hay = { title: it.t.toLowerCase(), tags: it.g.join(" ").toLowerCase(), desc: it.d.toLowerCase(), cat: it.c };
    let score = 0;
    let matched = 0;
    for (const [term, weight] of terms) {
      let hit = 0;
      if (hay.title.includes(term)) hit += 6;
      if (hay.tags.includes(term)) hit += 3;
      if (hay.cat.includes(term)) hit += 2;
      if (hay.desc.includes(term)) hit += 1.5;
      if (hit) {
        score += hit * weight;
        if (weight === 1) matched++;
      }
    }
    if (!score) continue;
    const coverage = matched / base.length;
    if (coverage === 0) continue;
    score *= 0.5 + coverage; // reward matching more of what the user typed
    score += Math.log10(1 + Math.max(it.q, 0)) * 1.5; // quality prior
    if (it.p) score += 2; // ⚡ Superpower picks rank above equals
    scored.push({ it, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.it);
}

// Stack suggestions: which curated bundle best matches what the user typed.
export function suggestStacks<T extends { title: string; tagline: string; keywords: string[] }>(query: string, stacks: T[]): T[] {
  const terms = tokenize(query);
  if (!terms.length) return [];
  return stacks
    .map((st) => {
      const hay = `${st.title} ${st.tagline} ${st.keywords.join(" ")}`.toLowerCase();
      const score = terms.reduce((a, t) => a + (hay.includes(t) ? 1 : 0), 0);
      return { stack: st, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((x) => x.stack);
}
