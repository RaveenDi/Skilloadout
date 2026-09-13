#!/usr/bin/env node
// QA: crawl the built static site and verify every link and asset reference resolves.
//
//   node scripts/check-links.mjs            # all non-skill pages + a sample of skill pages
//   node scripts/check-links.mjs --all      # every page (slow: 6k+ files)
//   node scripts/check-links.mjs --external # also HEAD-check unique external URLs
//
// Internal links are resolved against apps/web/out/ the way a static host would
// (trailingSlash: true -> /path/ maps to out/path/index.html).

import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/common.mjs";

const OUT = path.join(ROOT, "apps", "web", "out");
const ALL = process.argv.includes("--all");
const CHECK_EXTERNAL = process.argv.includes("--external");
const SKILL_SAMPLE = 150;

if (!fs.existsSync(OUT)) {
  console.error("No build found at apps/web/out — run: npm run build");
  process.exit(1);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const allPages = walk(OUT);
const skillPages = allPages.filter((p) => p.includes(`${path.sep}skills${path.sep}`));
const otherPages = allPages.filter((p) => !p.includes(`${path.sep}skills${path.sep}`));
const pages = ALL ? allPages : [...otherPages, ...skillPages.slice(0, SKILL_SAMPLE)];

const ATTR_RE = /(?:href|src)\s*=\s*"([^"]+)"/gi;
const urlOf = (file) => "/" + path.relative(OUT, file).split(path.sep).join("/").replace(/index\.html$/, "");

// Resolve an internal link to a file on disk, mirroring static-host behaviour.
function resolveInternal(link) {
  const clean = link.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return path.join(OUT, "index.html");
  const rel = clean.replace(/^\//, "");
  const candidates = [
    path.join(OUT, rel),
    path.join(OUT, rel, "index.html"),
    path.join(OUT, rel.replace(/\/$/, "") + ".html"),
    path.join(OUT, rel.replace(/\/$/, "") + ".txt"), // RSC payloads
  ];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
}

const broken = [];
const external = new Map(); // url -> first page that used it
const counts = { pages: 0, links: 0, internal: 0, externalRefs: 0, anchors: 0, mailto: 0 };

for (const file of pages) {
  counts.pages++;
  const html = fs.readFileSync(file, "utf8");
  const from = urlOf(file);
  const seen = new Set();
  let m;
  while ((m = ATTR_RE.exec(html))) {
    const raw = m[1].trim();
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);
    counts.links++;
    if (raw.startsWith("#")) { counts.anchors++; continue; }
    if (raw.startsWith("mailto:")) { counts.mailto++; continue; }
    if (/^(https?:)?\/\//i.test(raw)) {
      counts.externalRefs++;
      if (!external.has(raw)) external.set(raw, from);
      continue;
    }
    if (raw.startsWith("data:")) continue;
    counts.internal++;
    const target = raw.startsWith("/") ? raw : "/" + path.posix.join(path.posix.dirname(from), raw);
    if (!resolveInternal(target)) broken.push({ from, link: raw });
  }
}

console.log(`Checked ${counts.pages.toLocaleString()} pages (${ALL ? "all" : `all non-skill + ${SKILL_SAMPLE} skill pages`})`);
console.log(`  ${counts.links.toLocaleString()} references: ${counts.internal} internal, ${counts.externalRefs} external, ${counts.anchors} anchors, ${counts.mailto} mailto`);

if (broken.length) {
  console.log(`\n❌ ${broken.length} broken internal link(s):`);
  const grouped = new Map();
  for (const b of broken) {
    if (!grouped.has(b.link)) grouped.set(b.link, []);
    grouped.get(b.link).push(b.from);
  }
  for (const [link, froms] of [...grouped].slice(0, 40)) {
    console.log(`  ${link}\n      on ${froms.slice(0, 3).join(", ")}${froms.length > 3 ? ` (+${froms.length - 3} more)` : ""}`);
  }
} else {
  console.log("\n✅ No broken internal links");
}

const hosts = new Map();
for (const [url] of external) {
  const host = new URL(url.startsWith("//") ? "https:" + url : url).host;
  hosts.set(host, (hosts.get(host) || 0) + 1);
}
console.log(`\nExternal hosts referenced (${external.size} unique URLs):`);
for (const [host, n] of [...hosts].sort((a, b) => b[1] - a[1])) console.log(`  ${n}\t${host}`);

if (CHECK_EXTERNAL) {
  // Skip the thousands of per-skill GitHub source links; check the site's own outbound links.
  const toCheck = [...external.keys()].filter((u) => !/github\.com\/[^/]+\/[^/]+\/(tree|blob)\//.test(u));
  console.log(`\nHEAD-checking ${toCheck.length} external URL(s)…`);
  for (const url of toCheck) {
    const full = url.startsWith("//") ? "https:" + url : url;
    try {
      const res = await fetch(full, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(15000) });
      console.log(`  ${res.ok ? "✅" : "⚠️ "} ${res.status} ${full}`);
    } catch (e) {
      console.log(`  ❌ ERR ${full} — ${e.message.slice(0, 60)}`);
    }
  }
}

process.exit(broken.length ? 1 : 0);
