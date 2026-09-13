#!/usr/bin/env node
// Skill Loadout sync engine.
//
// For every source in catalog/sources.json: sparse, blob-less shallow clone -> find skills
// (SKILL.md), Cursor rules, and Gemini CLI extensions -> resolve each item's license ->
// mirror redistributable items into skills/<id>/ (verbatim + ATTRIBUTION.md) or record
// metadata + link only -> classify, safety-scan, dedupe, score -> write catalog/index.json.
//
// Usage: node scripts/sync.mjs [--force] [--only owner/repo[,owner/repo]] [--keep-cache]

import fs from "node:fs";
import path from "node:path";
import {
  ROOT, SKILLS_DIR, CATALOG_DIR, ORIGINALS_DIR, CACHE_DIR,
  readJson, writeJson, sha1, slugify, humanize, git, gh, parseFrontmatter, asText,
  firstParagraph, walk, toPosix, pool,
} from "./lib/common.mjs";
import { detectLicenseText, normalizeLicense, isRedistributable } from "./lib/license.mjs";
import { classify, CATEGORY_BY_ID } from "./lib/taxonomy.mjs";
import { scanSafety } from "./lib/safety.mjs";

const PIPELINE_VERSION = 4;
const argv = process.argv.slice(2);
const FORCE = argv.includes("--force");
const KEEP_CACHE = argv.includes("--keep-cache");
const ONLY = (() => {
  const i = argv.indexOf("--only");
  return i >= 0 ? new Set(argv[i + 1].split(",").map((s) => s.toLowerCase())) : null;
})();

const TEXT_EXT = new Set([
  ".md", ".mdx", ".mdc", ".txt", ".py", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".jsonc",
  ".yaml", ".yml", ".toml", ".ini", ".cfg", ".sh", ".bash", ".zsh", ".ps1", ".bat", ".html", ".htm", ".css",
  ".scss", ".glsl", ".frag", ".vert", ".wgsl", ".xml", ".svg", ".csv", ".tsv", ".sql", ".rb", ".go", ".rs",
  ".java", ".kt", ".swift", ".php", ".cs", ".c", ".h", ".cpp", ".hpp", ".lua", ".r", ".jl", ".dart", ".vue",
  ".svelte", ".astro", ".graphql", ".gql", ".prisma", ".tf", ".hcl", ".env.example", ".template", ".j2",
  ".jinja", ".liquid", ".hbs", ".ejs", ".dockerfile", ".gitignore", ".cursorrules", ".xsd", ".rst",
]);
const TEXT_NAMES = new Set(["Dockerfile", "Makefile", "LICENSE", "LICENCE", "COPYING", "NOTICE", ".cursorrules"]);
const MAX_FILE = 256 * 1024;
const MAX_ITEM = 1.5 * 1024 * 1024;
const MAX_FILES = 80;
const DEFAULT_EXCLUDE = /(^|\/)(node_modules|__tests__|tests?|fixtures|test-data|testdata|__snapshots__|\.git)(\/|$)/i;
const WIN_INVALID = /[<>:"|?*\\]|[. ]$/;
const BINARY_NEG = [
  "!*.png", "!*.jpg", "!*.jpeg", "!*.gif", "!*.webp", "!*.avif", "!*.ico", "!*.mp4", "!*.mov", "!*.webm",
  "!*.mp3", "!*.wav", "!*.ogg", "!*.pdf", "!*.zip", "!*.gz", "!*.tgz", "!*.ttf", "!*.otf", "!*.woff",
  "!*.woff2", "!*.glb", "!*.gltf", "!*.bin", "!*.hdr", "!*.exr", "!*.ktx2", "!*.psd", "!*.docx", "!*.pptx",
  "!*.xlsx", "!*.jar", "!*.exe", "!*.dll", "!*.so", "!*.dylib", "!*.wasm", "!*.onnx", "!*.pt", "!*.npz",
];
const LICENSE_RE = /^(licen[cs]e|copying)([.-][\w.-]*)?$/i;

const isText = (rel) => {
  const base = path.posix.basename(rel);
  if (TEXT_NAMES.has(base) || LICENSE_RE.test(base)) return true;
  const ext = path.posix.extname(base).toLowerCase();
  return TEXT_EXT.has(ext);
};

const log = (...a) => console.log(...a);

// ---------------------------------------------------------------------------------------------
// Source expansion (orgs -> repos)

async function expandSources(cfg) {
  const excluded = new Set((cfg.exclude || []).map((r) => r.toLowerCase()));
  const list = [...(cfg.sources || []), ...(cfg.discovered || []).filter((d) => d.status !== "rejected")];
  for (const o of cfg.orgs || []) {
    try {
      const repos = [];
      for (let page = 1; page <= 5; page++) {
        const batch = await gh(`/orgs/${o.org}/repos?per_page=100&page=${page}&type=public`);
        repos.push(...batch);
        if (batch.length < 100) break;
      }
      for (const r of repos) {
        if (r.archived || r.fork || (r.stargazers_count || 0) < (o.minStars || 0)) continue;
        list.push({ repo: r.full_name, tier: o.tier, origin: o.origin, kind: o.kind, fromOrg: o.org });
      }
    } catch (e) {
      log(`! org ${o.org}: ${e.message}`);
    }
  }
  const seen = new Set();
  return list.filter((s) => {
    const k = s.repo.toLowerCase();
    if (excluded.has(k) || seen.has(k)) return false;
    seen.add(k);
    return !ONLY || ONLY.has(k);
  });
}

// ---------------------------------------------------------------------------------------------
// Item discovery inside one repo's file list

function findItems(files, src) {
  const include = src.include || null;
  const exclude = (src.exclude || []).map((p) => new RegExp(p, "i"));
  const inScope = (p) =>
    (!include || include.some((pre) => p.startsWith(pre))) &&
    !DEFAULT_EXCLUDE.test(p) &&
    !exclude.some((re) => re.test(p));
  const items = [];

  if (src.manual) {
    for (const m of src.manual) items.push({ kind: "skill", file: m.path, dir: path.posix.dirname(m.path) === "." ? "" : path.posix.dirname(m.path), manual: m });
    return items;
  }

  const kind = src.kind || "skills";
  if (kind === "rules") {
    for (const f of files) {
      const base = path.posix.basename(f);
      if ((base === ".cursorrules" || base.endsWith(".mdc")) && inScope(f)) {
        items.push({ kind: "rule", file: f, dir: path.posix.dirname(f) });
      }
    }
    return items;
  }

  for (const f of files) {
    if (path.posix.basename(f).toLowerCase() !== "skill.md") continue;
    if (!inScope(f)) continue;
    const dir = path.posix.dirname(f) === "." ? "" : path.posix.dirname(f);
    items.push({ kind: "skill", file: f, dir });
  }
  if (kind === "gemini-extension" && files.includes("gemini-extension.json")) {
    items.push({ kind: "extension", file: "gemini-extension.json", dir: "" });
  }
  return items;
}

function buildSparsePatterns(items) {
  const pats = new Set(["/LICENSE*", "/LICENCE*", "/COPYING*", "/license*", "LICENSE*", "LICENCE*"]);
  for (const it of items) {
    if (it.kind === "rule" || it.manual) {
      pats.add(`/${it.file}`);
      if (it.manual) for (const d of ["references", "scripts", "assets", "templates"]) pats.add(`/${it.dir ? it.dir + "/" : ""}${d}/`);
    } else if (it.kind === "extension") {
      for (const p of ["/gemini-extension.json", "/GEMINI.md", "/*.md", "/commands/", "/skills/"]) pats.add(p);
    } else if (it.dir === "") {
      for (const p of ["/SKILL.md", "/skill.md", "/references/", "/scripts/", "/assets/", "/templates/", "/resources/", "/examples/", "/reference/", "/docs/"]) pats.add(p);
    } else {
      pats.add(`/${it.dir}/`);
    }
  }
  return [...pats, ...BINARY_NEG];
}

// ---------------------------------------------------------------------------------------------
// License resolution: skill-local LICENSE file > frontmatter license > nearest ancestor LICENSE > repo metadata

function resolveLicense({ repoDir, files, dir, fm, meta }) {
  const readLic = (rel) => {
    try {
      return detectLicenseText(fs.readFileSync(path.join(repoDir, rel), "utf8"));
    } catch {
      return "Unknown";
    }
  };
  const localLic = files.find((f) => path.posix.dirname(f) === (dir || ".") && LICENSE_RE.test(path.posix.basename(f)));
  if (localLic) {
    const id = readLic(localLic);
    if (id !== "Unknown") return { id, file: localLic, local: true };
  }
  const fmLic = normalizeLicense(asText(fm?.license));
  if (fmLic && fmLic !== "Unknown") return { id: fmLic, file: null, local: false, via: "frontmatter" };
  let d = dir;
  while (true) {
    d = d ? path.posix.dirname(d) : null;
    if (d === null) break;
    const cur = d === "." ? "" : d;
    const lic = files.find((f) => (path.posix.dirname(f) === (cur || ".")) && LICENSE_RE.test(path.posix.basename(f)));
    if (lic) {
      const id = readLic(lic);
      if (id !== "Unknown") return { id, file: lic, local: false };
    }
    if (!cur) break;
    d = cur;
  }
  const spdx = normalizeLicense(meta?.license?.spdx_id);
  return { id: spdx || "Unknown", file: null, local: false, via: "repo" };
}

// ---------------------------------------------------------------------------------------------

function listItemFiles(repoDir, files, item, nestedDirs) {
  let rels;
  if (item.kind === "rule") rels = [item.file];
  else if (item.manual) {
    const pre = item.dir ? item.dir + "/" : "";
    rels = [item.file, ...files.filter((f) => /^(references|scripts|assets|templates)\//.test(f.slice(pre.length)) && f.startsWith(pre))];
  } else if (item.kind === "extension") {
    rels = files.filter((f) => f === "gemini-extension.json" || (!f.includes("/") && /\.md$/i.test(f) && !/^readme/i.test(f)) || f.startsWith("commands/"));
  } else if (item.dir === "") {
    rels = files.filter((f) => /^skill\.md$/i.test(f) || /^(references|scripts|assets|templates|resources|examples|reference|docs)\//.test(f));
  } else {
    const pre = item.dir + "/";
    rels = files.filter((f) => f.startsWith(pre));
  }
  const out = [];
  let total = 0;
  // The main file always comes first and is exempt from the per-file/total budget (up to 1 MB),
  // and a lowercase skill.md is normalized to SKILL.md so every agent recognizes it.
  const mainWithin = item.dir ? item.file.slice(item.dir.length + 1) : item.file;
  try {
    const size = fs.statSync(path.join(repoDir, item.file)).size;
    if (size <= 1024 * 1024) {
      const mainPath = item.kind === "rule" ? path.posix.basename(item.file) : /^skill\.md$/i.test(mainWithin) ? "SKILL.md" : mainWithin;
      out.push({ rel: item.file, path: mainPath, size, main: true });
      total += size;
    }
  } catch {}
  for (const rel of rels) {
    if (rel === item.file) continue;
    const within = item.dir ? rel.slice(item.dir.length + 1) : rel;
    if (item.kind === "skill" && nestedDirs.some((nd) => rel.startsWith(nd + "/"))) continue;
    if (!isText(rel) || DEFAULT_EXCLUDE.test(within)) continue;
    let size;
    try {
      size = fs.statSync(path.join(repoDir, rel)).size;
    } catch {
      continue;
    }
    if (size > MAX_FILE || total + size > MAX_ITEM || out.length >= MAX_FILES) continue;
    total += size;
    out.push({ rel, path: item.kind === "rule" ? path.posix.basename(rel) : within, size });
  }
  return out;
}

function ruleName(item) {
  const base = path.posix.basename(item.file);
  const raw = base === ".cursorrules" ? path.posix.basename(item.dir) : base.replace(/\.mdc$/i, "");
  return raw.replace(/-?cursor-?rules?(-prom(pt)?)?(-?file)?-?$/i, "").replace(/-+$/, "") || raw;
}

async function syncRepo(src, state, prevByRepo) {
  const [owner, repoName] = src.repo.split("/");
  const meta = await gh(`/repos/${src.repo}`, { allow404: true });
  if (!meta) throw new Error("repository not found");
  if (meta.archived) log(`  (archived) ${src.repo}`);
  const url = `https://github.com/${meta.full_name}.git`;
  const remoteSha = git(["ls-remote", url, "HEAD"]).split(/\s/)[0];
  const prev = prevByRepo.get(src.repo.toLowerCase()) || [];
  const st = state.repos[src.repo.toLowerCase()];

  if (!FORCE && st?.sha === remoteSha && state.pipelineVersion === PIPELINE_VERSION && prev.length &&
      prev.every((e) => !e.mirrored || fs.existsSync(path.join(SKILLS_DIR, e.id)))) {
    return {
      meta, sha: remoteSha, reused: true,
      items: prev.map((e) => ({ ...e, source: { ...e.source, stars: meta.stargazers_count, tier: src.tier ?? e.source.tier, official: (src.tier ?? e.source.tier) === 1, redistributor: src.redistributor || undefined } })),
    };
  }

  const repoDir = path.join(CACHE_DIR, `${owner}__${repoName}`);
  fs.rmSync(repoDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(repoDir), { recursive: true });
  git(["-c", "core.longpaths=true", "clone", "--depth", "1", "--filter=blob:none", "--no-checkout", "--quiet", url, repoDir]);
  git(["config", "core.longpaths", "true"], repoDir);
  const allFiles = git(["ls-tree", "-r", "--name-only", "-z", "HEAD"], repoDir).split("\0").filter(Boolean);
  let items = findItems(allFiles, src);
  if (process.platform === "win32") {
    const bad = allFiles.filter((f) => f.split("/").some((c) => WIN_INVALID.test(c)));
    items = items.filter((it) => !bad.some((b) => (it.dir ? b.startsWith(it.dir + "/") : b === it.file)));
  }
  if (!items.length) return { meta, sha: remoteSha, items: [] };

  git(["sparse-checkout", "set", "--no-cone", "--stdin"], repoDir, buildSparsePatterns(items).join("\n") + "\n");
  git(["-c", "core.longpaths=true", "checkout", "--quiet", meta.default_branch], repoDir);
  const files = allFiles.filter((f) => fs.existsSync(path.join(repoDir, f)));

  const skillDirs = items.filter((i) => i.kind === "skill" && i.dir).map((i) => i.dir);
  const out = [];
  for (const item of items) {
    try {
      const rec = buildRecord({ src, meta, sha: remoteSha, repoDir, files, item, skillDirs });
      if (rec) out.push(rec);
    } catch (e) {
      log(`  ! ${src.repo}/${item.file}: ${e.message}`);
    }
  }
  return { meta, sha: remoteSha, items: out, repoDir };
}

function buildRecord({ src, meta, sha, repoDir, files, item, skillDirs }) {
  const mainPath = path.join(repoDir, item.file);
  if (!fs.existsSync(mainPath)) return null;
  const raw = fs.readFileSync(mainPath, "utf8");
  let fm = {}, body = raw, name, description, extJson = null;

  if (item.kind === "extension") {
    extJson = JSON.parse(raw);
    name = extJson.name || meta.name;
    description = extJson.description || meta.description || "";
    const ctx = extJson.contextFileName || "GEMINI.md";
    const ctxPath = path.join(repoDir, Array.isArray(ctx) ? ctx[0] : ctx);
    body = fs.existsSync(ctxPath) ? fs.readFileSync(ctxPath, "utf8") : "";
  } else {
    ({ data: fm, body } = parseFrontmatter(raw));
    if (item.kind === "rule") {
      name = ruleName(item);
      description = asText(fm.description) || firstParagraph(body) || `Cursor rules for ${humanize(name)}`;
    } else {
      name = asText(fm.name) || item.manual?.name || path.posix.basename(item.dir || meta.name);
      description = asText(fm.description) || item.manual?.description || firstParagraph(body);
    }
  }
  name = String(name).trim();
  description = String(description || "").replace(/\s+/g, " ").trim();
  if (item.manual?.description && !description) description = item.manual.description;
  if (body.trim().length < 60 && description.length < 20) return null;
  if (/^(template|template-skill|example|example-skill|my-skill|skill-name|your-skill-name|hello-world)$/i.test(name)) return null;

  const nested = item.kind === "skill" ? skillDirs.filter((d) => d !== item.dir && (item.dir === "" || d.startsWith(item.dir + "/"))) : [];
  const itemFiles = listItemFiles(repoDir, files, item, nested);
  const lic = resolveLicense({ repoDir, files, dir: item.dir, fm, meta });
  // Only mirror when the license allows it AND the main file made it into the copy.
  const mirrored = isRedistributable(lic.id) && itemFiles.some((f) => f.main);

  let scanText = raw;
  for (const f of itemFiles.slice(0, 40)) {
    if (f.rel === item.file) continue;
    try {
      scanText += "\n" + fs.readFileSync(path.join(repoDir, f.rel), "utf8").slice(0, 60_000);
    } catch {}
  }
  const flags = scanSafety(scanText);
  const cls = classify({ name, description, path: `${src.repo}/${item.dir}`, body });
  const branch = meta.default_branch;
  const webPath = item.kind === "rule" || item.manual ? `blob/${branch}/${item.file}` : `tree/${branch}/${item.dir}`;

  return {
    kind: item.kind,
    name,
    title: humanize(name),
    description: description.slice(0, 1200),
    ...cls,
    worksWith: item.kind === "extension" ? ["gemini"] : item.kind === "rule" ? ["cursor", "claude", "codex", "gemini", "copilot"] : ["claude", "codex", "gemini", "copilot", "cursor"],
    origin: src.origin || "community",
    source: {
      repo: meta.full_name,
      owner: meta.owner?.login,
      path: item.kind === "rule" || item.manual ? item.file : item.dir,
      url: `https://github.com/${meta.full_name}/${webPath}`.replace(/\/$/, ""),
      branch,
      sha,
      stars: meta.stargazers_count,
      tier: src.tier ?? 3,
      official: (src.tier ?? 3) === 1,
      ...(src.redistributor ? { redistributor: true } : {}),
    },
    license: lic.id,
    licenseVia: lic.via || (lic.local ? "skill" : "repo-file"),
    mirrored,
    files: mirrored ? itemFiles.map((f) => ({ path: f.path, size: f.size })) : [],
    sizeBytes: itemFiles.reduce((a, f) => a + f.size, 0),
    hash: sha1(body.replace(/\s+/g, " ").trim()),
    excerpt: mirrored ? body.replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`|-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 600) : "",
    flags,
    updatedAt: meta.pushed_at,
    _copy: mirrored ? { repoDir, files: itemFiles, licenseFile: lic.local ? null : lic.file, rule: item.kind === "rule", fm, body, extension: !!extJson } : null,
  };
}

// ---------------------------------------------------------------------------------------------
// Originals (authored in this repo)

function syncOriginals() {
  if (!fs.existsSync(ORIGINALS_DIR)) return [];
  const out = [];
  for (const d of fs.readdirSync(ORIGINALS_DIR, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const dir = path.join(ORIGINALS_DIR, d.name);
    const skillPath = path.join(dir, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;
    const raw = fs.readFileSync(skillPath, "utf8");
    const { data: fm, body } = parseFrontmatter(raw);
    const files = walk(dir).map((abs) => ({ rel: toPosix(path.relative(ORIGINALS_DIR, abs)), path: toPosix(path.relative(dir, abs)), size: fs.statSync(abs).size }));
    const name = asText(fm.name) || d.name;
    const description = asText(fm.description).replace(/\s+/g, " ").trim();
    const cls = classify({ name, description, path: d.name, body });
    // Originals may pin their primary category in frontmatter (`category: 3d-webgl`).
    if (CATEGORY_BY_ID[fm.category]) {
      cls.category = fm.category;
      cls.categories = [fm.category, ...cls.categories.filter((c) => c !== fm.category)].slice(0, 3);
    }
    out.push({
      id: slugify(name),
      kind: "skill",
      name,
      title: asText(fm.title) || humanize(name),
      description,
      ...cls,
      worksWith: ["claude", "codex", "gemini", "copilot", "cursor"],
      origin: "world-skills",
      source: { repo: "world-skills/originals", owner: "world-skills", path: `originals/${d.name}`, url: null, branch: "main", sha: null, stars: 0, tier: 0, official: false },
      license: "MIT",
      licenseVia: "world-skills",
      mirrored: true,
      files: files.map((f) => ({ path: f.path, size: f.size })),
      sizeBytes: files.reduce((a, f) => a + f.size, 0),
      hash: sha1(body.replace(/\s+/g, " ").trim()),
      excerpt: body.replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`|-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 600),
      flags: scanSafety(raw),
      updatedAt: new Date(Math.max(...files.map((f) => fs.statSync(path.join(ORIGINALS_DIR, f.rel)).mtimeMs))).toISOString(),
      _copy: { repoDir: ORIGINALS_DIR, files, licenseFile: null, original: true },
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------

function score(e) {
  const tierW = { 0: 100, 1: 40, 2: 26, 3: 10 }[e.source.tier] ?? 10;
  const stars = 7 * Math.log10((e.source.stars || 0) + 1);
  const rich = (e.files.length > 1 ? 4 : 0) + (e.files.some((f) => /^(references|scripts|assets|templates)\//.test(f.path)) ? 4 : 0);
  const desc = Math.min((e.description || "").length / 40, 5);
  const days = (Date.now() - Date.parse(e.updatedAt || 0)) / 864e5;
  const fresh = days < 90 ? 4 : days < 365 ? 2 : 0;
  const flagPenalty = e.flags.some((f) => f.severity === "high") ? -20 : e.flags.some((f) => f.severity === "medium") ? -5 : 0;
  const kindAdj = e.kind === "rule" ? -6 : 0;
  return Math.round((tierW + stars + rich + desc + fresh + flagPenalty + kindAdj + (e.mirrored ? 4 : 0)) * 10) / 10;
}

function assignIds(entries) {
  const used = new Set(entries.filter((e) => e.id).map((e) => e.id));
  for (const e of entries) {
    if (e.id && e.source.tier === 0) continue;
    if (e.id && e._reused) continue;
    const base = slugify(e.name) || "skill";
    const owner = slugify(e.source.owner || e.source.repo.split("/")[0]);
    let id = `${base}--${owner}`;
    if (used.has(id) && e.id !== id) id = `${base}--${owner}-${sha1(e.source.repo + e.source.path).slice(0, 6)}`;
    e.id = id;
    used.add(id);
  }
}

const wordSet = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 2));
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

// Duplicate detection, best-scored copy wins:
//  1. identical body hash            2. same name + same description
//  3. same repo + same name           4. same name + ≥60% similar description/excerpt text
// License taint: if any copy is Proprietary, the winner is demoted to link-only (a re-published
// copy of a proprietary skill must not be mirrored just because the re-publisher's repo is MIT).
function dedupe(entries) {
  // Originals beat redistributors: a repo flagged `redistributor` (bundles other people's skills)
  // only wins a duplicate group when no original publisher's copy exists. Then best score wins.
  entries.sort((a, b) => (a.source.redistributor ? 1 : 0) - (b.source.redistributor ? 1 : 0) || b.score - a.score);
  const byKey = new Map();
  const byName = new Map();
  const kept = [];
  for (const e of entries) {
    const name = slugify(e.name);
    const words = wordSet(`${e.description} ${e.excerpt || ""}`);
    const k1 = `h:${e.hash}`;
    const k2 = `n:${name}|${sha1(e.description.toLowerCase().slice(0, 300))}`;
    const k3 = `r:${e.source.repo.toLowerCase()}|${name}`;
    let winner = byKey.get(k1) || byKey.get(k2) || byKey.get(k3);
    if (!winner) winner = (byName.get(name) || []).find((w) => jaccard(w._words, words) >= 0.6);
    if (winner && e.description) {
      if (e.license === "Proprietary" && winner.mirrored) {
        winner.mirrored = false;
        winner.license = "Proprietary (upstream)";
        winner.licenseVia = `duplicate of ${e.source.repo}`;
        winner._copy = null;
        winner.files = [];
        winner.excerpt = "";
      }
      if (e.source.repo !== winner.source.repo) {
        winner.alsoIn = winner.alsoIn || [];
        if (winner.alsoIn.length < 12 && !winner.alsoIn.some((a) => a.repo === e.source.repo)) winner.alsoIn.push({ repo: e.source.repo, url: e.source.url });
      }
      continue;
    }
    e._words = words;
    byKey.set(k1, e);
    byKey.set(k2, e);
    byKey.set(k3, e);
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(e);
    kept.push(e);
  }
  for (const e of kept) delete e._words;
  return kept;
}

function writeMirror(e) {
  const dest = path.join(SKILLS_DIR, e.id);
  const c = e._copy;
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const f of c.files) {
    const target = path.join(dest, f.path === ".cursorrules" ? ".cursorrules" : f.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(c.repoDir, f.rel), target);
  }
  if (c.rule) {
    const fmLines = ["---", `name: ${JSON.stringify(slugify(e.name))}`, `description: ${JSON.stringify(`${e.description}`.slice(0, 900))}`, `license: ${e.license}`, "---", ""];
    fs.writeFileSync(path.join(dest, "SKILL.md"), fmLines.join("\n") + `# ${e.title}\n\n> Converted from a Cursor rule so it also works as an Agent Skill (Claude, Codex, Gemini CLI, Copilot). Original file kept alongside.\n\n${c.body.trim()}\n`);
    e.files = [{ path: "SKILL.md", size: fs.statSync(path.join(dest, "SKILL.md")).size }, ...e.files];
  }
  if (c.licenseFile && !c.files.some((f) => LICENSE_RE.test(path.posix.basename(f.path)))) {
    const name = fs.existsSync(path.join(dest, "LICENSE")) ? "LICENSE.upstream" : "LICENSE";
    try {
      fs.copyFileSync(path.join(c.repoDir, c.licenseFile), path.join(dest, name));
      e.files.push({ path: name, size: fs.statSync(path.join(dest, name)).size });
    } catch {}
  }
  if (!c.original) {
    const attr = [
      `# Attribution`,
      ``,
      `- **Item:** ${e.title} (\`${e.name}\`)`,
      `- **Original source:** ${e.source.url}`,
      `- **Repository:** https://github.com/${e.source.repo} @ \`${(e.source.sha || "").slice(0, 12)}\``,
      `- **License:** ${e.license} (resolved via ${e.licenseVia})`,
      ``,
      `Mirrored verbatim by Skill Loadout (skillloadout.com); all credit belongs to the original authors.`,
      e.kind === "rule" ? `SKILL.md was generated from the original Cursor rule so it installs as an Agent Skill.` : ``,
    ].join("\n");
    fs.writeFileSync(path.join(dest, "ATTRIBUTION.md"), attr + "\n");
    e.files.push({ path: "ATTRIBUTION.md", size: Buffer.byteLength(attr) + 1 });
  }
}

function writeIndexFile(p, skills, extra) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const head = JSON.stringify({ ...extra, count: skills.length }).slice(0, -1);
  fs.writeFileSync(p, `${head},"skills":[\n${skills.map((s) => JSON.stringify(s)).join(",\n")}\n]}\n`);
}

// ---------------------------------------------------------------------------------------------

async function main() {
  const t0 = Date.now();
  const cfg = readJson(path.join(CATALOG_DIR, "sources.json"));
  const indexPath = path.join(CATALOG_DIR, "index.json");
  const prevIndex = readJson(indexPath, { skills: [] });
  const statePath = path.join(CATALOG_DIR, "state.json");
  const state = readJson(statePath, { repos: {} });
  const prevByRepo = new Map();
  for (const s of prevIndex.skills) {
    const k = s.source.repo.toLowerCase();
    if (!prevByRepo.has(k)) prevByRepo.set(k, []);
    prevByRepo.get(k).push(s);
  }

  const sources = await expandSources(cfg);
  log(`Syncing ${sources.length} sources${FORCE ? " (forced)" : ""}...`);
  const all = [];
  const report = [];
  const repoDirs = [];

  await pool(sources, 4, async (src) => {
    const key = src.repo.toLowerCase();
    try {
      // Transient network failures used to drop a whole source from the catalog, so retry first.
      let res, lastErr;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          res = await syncRepo(src, state, prevByRepo);
          break;
        } catch (e) {
          lastErr = e;
          if (attempt < 2) await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
        }
      }
      if (!res) throw lastErr;
      const items = res.items.map((e) => (res.reused ? { ...e, _reused: true } : e));
      all.push(...items);
      if (res.repoDir) repoDirs.push(res.repoDir);
      state.repos[key] = { sha: res.sha, stars: res.meta.stargazers_count, syncedAt: new Date().toISOString(), items: items.length };
      report.push({ repo: src.repo, items: items.length, reused: !!res.reused });
      log(`  ${res.reused ? "=" : "+"} ${src.repo}: ${items.length}${res.reused ? " (unchanged)" : ""}`);
    } catch (e) {
      const prev = ONLY ? [] : prevByRepo.get(key) || [];
      all.push(...prev.map((p) => ({ ...p, _reused: true })));
      report.push({ repo: src.repo, error: e.message.slice(0, 300), keptPrevious: prev.length });
      log(`  ! ${src.repo}: ${e.message.slice(0, 200)}`);
    }
  });

  if (ONLY) {
    // Partial run: keep everything from repos we did not touch.
    const touched = new Set(sources.map((s) => s.repo.toLowerCase()));
    for (const s of prevIndex.skills) if (!touched.has(s.source.repo.toLowerCase()) && s.source.tier !== 0) all.push({ ...s, _reused: true });
  }
  all.push(...syncOriginals());

  for (const e of all) {
    e.flags = e.flags || [];
    if (e._reused) Object.assign(e, classify({ name: e.name, description: e.description, path: `${e.source.repo}/${e.source.path}`, body: e.excerpt || "" }));
    e.score = score(e);
  }
  const prevIds = new Map(prevIndex.skills.map((s) => [`${s.source.repo}|${s.source.path}|${s.name}`.toLowerCase(), s.id]));
  for (const e of all) if (!e.id) e.id = prevIds.get(`${e.source.repo}|${e.source.path}|${e.name}`.toLowerCase());
  let entries = dedupe(all);
  // Resolve id collisions (e.g. reused ids clashing with new ones).
  const seen = new Set();
  for (const e of entries) {
    if (e.id && seen.has(e.id)) e.id = undefined;
    if (e.id) seen.add(e.id);
  }
  assignIds(entries);

  // Write mirrors for fresh items; reused ones are already on disk.
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
  let written = 0;
  for (const e of entries) {
    if (e._copy) {
      try {
        writeMirror(e);
        written++;
      } catch (err) {
        log(`  ! mirror ${e.id}: ${err.message}`);
        e.mirrored = false;
        e.files = [];
      }
    }
  }
  const ids = new Set(entries.map((e) => e.id));
  const mirroredIds = new Set(entries.filter((e) => e.mirrored).map((e) => e.id));
  for (const d of fs.readdirSync(SKILLS_DIR)) if (!mirroredIds.has(d)) fs.rmSync(path.join(SKILLS_DIR, d), { recursive: true, force: true });

  entries = entries.map(({ _copy, _reused, ...rest }) => rest).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const now = new Date().toISOString();
  writeIndexFile(indexPath, entries, { generatedAt: now, pipelineVersion: PIPELINE_VERSION });

  // Stats + changelog
  const count = (fn) => entries.reduce((m, e) => { for (const k of [].concat(fn(e))) m[k] = (m[k] || 0) + 1; return m; }, {});
  const stats = {
    generatedAt: now,
    total: entries.length,
    mirrored: entries.filter((e) => e.mirrored).length,
    linkOnly: entries.filter((e) => !e.mirrored).length,
    sources: new Set(entries.map((e) => e.source.repo)).size,
    byCategory: count((e) => e.category),
    byKind: count((e) => e.kind),
    byOrigin: count((e) => e.origin),
    byLicense: count((e) => e.license),
    flagged: entries.filter((e) => e.flags.length).length,
  };
  writeJson(path.join(CATALOG_DIR, "stats.json"), stats);

  const prevMap = new Map(prevIndex.skills.map((s) => [s.id, s.hash]));
  const added = entries.filter((e) => !prevMap.has(e.id)).map((e) => e.id);
  const updated = entries.filter((e) => prevMap.has(e.id) && prevMap.get(e.id) !== e.hash).map((e) => e.id);
  const removed = [...prevMap.keys()].filter((id) => !ids.has(id));
  const changelogPath = path.join(CATALOG_DIR, "changelog.json");
  const changelog = readJson(changelogPath, []);
  changelog.unshift({ date: now, total: entries.length, added: added.length, updated: updated.length, removed: removed.length, addedIds: added.slice(0, 100), updatedIds: updated.slice(0, 100), removedIds: removed.slice(0, 100), errors: report.filter((r) => r.error) });
  writeJson(changelogPath, changelog.slice(0, 60));

  state.pipelineVersion = PIPELINE_VERSION;
  state.lastRun = now;
  writeJson(statePath, state);
  writeJson(path.join(CATALOG_DIR, "last-sync-report.json"), { date: now, durationSec: Math.round((Date.now() - t0) / 1000), written, report });

  if (!KEEP_CACHE) for (const d of repoDirs) fs.rmSync(d, { recursive: true, force: true });
  log(`\nDone in ${Math.round((Date.now() - t0) / 1000)}s: ${entries.length} items (${stats.mirrored} mirrored, ${stats.linkOnly} link-only) from ${stats.sources} sources. +${added.length} ~${updated.length} -${removed.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
