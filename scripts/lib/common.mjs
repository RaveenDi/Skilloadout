// Shared helpers for the Skill Loadout sync + discovery pipeline.
import { spawnSync, execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const SKILLS_DIR = path.join(ROOT, "skills");
export const CATALOG_DIR = path.join(ROOT, "catalog");
export const ORIGINALS_DIR = path.join(ROOT, "originals");
export const CACHE_DIR = path.join(ROOT, ".cache", "repos");

export const readJson = (p, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
};
export const writeJson = (p, data, pretty = true) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, pretty ? 2 : 0) + "\n");
};

export const sha1 = (s) => crypto.createHash("sha1").update(s).digest("hex");

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function humanize(slug) {
  return String(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function git(args, cwd, input) {
  const r = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    input,
    maxBuffer: 1 << 28,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  if (r.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${(r.stderr || "").trim().slice(0, 500)}`);
  }
  return r.stdout;
}

// Resolve a GitHub token without ever printing it: env first, then the gh CLI's stored login.
let cachedToken;
export function githubToken() {
  if (cachedToken !== undefined) return cachedToken;
  cachedToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  if (!cachedToken) {
    try {
      cachedToken = execFileSync("gh", ["auth", "token"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
      cachedToken = "";
    }
  }
  return cachedToken;
}

export async function gh(pathname, { allow404 = false } = {}) {
  const url = pathname.startsWith("http") ? pathname : `https://api.github.com${pathname}`;
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "world-skills-sync" };
  const token = githubToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    if (res.ok) return res.json();
    if (res.status === 404 && allow404) return null;
    if ((res.status === 403 || res.status === 429 || res.status >= 500) && attempt < 3) {
      const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
      const wait = res.headers.get("retry-after")
        ? Number(res.headers.get("retry-after")) * 1000
        : reset && res.headers.get("x-ratelimit-remaining") === "0"
          ? Math.min(Math.max(reset - Date.now(), 1000), 90_000)
          : 2000 * (attempt + 1);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    throw new Error(`GitHub ${res.status} for ${url}: ${(await res.text()).slice(0, 300)}`);
  }
}

// Frontmatter: tolerant of BOMs, CRLF and slightly invalid YAML (common in community skills).
export function parseFrontmatter(text) {
  const m = text.match(/^﻿?\s*---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/);
  if (!m) return { data: {}, body: text };
  let data = {};
  try {
    data = YAML.parse(m[1]) ?? {};
  } catch {
    data = {};
    let key = null;
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
      if (kv) {
        key = kv[1];
        data[key] = kv[2].replace(/^["']|["']$/g, "");
      } else if (key && /^\s+\S/.test(line) && typeof data[key] === "string") {
        data[key] = `${data[key]} ${line.trim()}`.trim();
      }
    }
  }
  if (typeof data !== "object" || Array.isArray(data)) data = {};
  return { data, body: text.slice(m[0].length) };
}

export const asText = (v) => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(asText).join(", ");
  if (typeof v === "object") return Object.values(v).map(asText).join(" ");
  return String(v);
};

export function firstParagraph(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (out.length) break;
      continue;
    }
    if (/^(#|```|<|!\[|\||-{3,}|>)/.test(t)) {
      if (out.length) break;
      continue;
    }
    out.push(t);
  }
  return out.join(" ").slice(0, 400);
}

export function walk(dir, { skip = new Set() } = {}) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (skip.has(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile()) out.push(p);
    }
  }
  return out;
}

export const toPosix = (p) => p.split(path.sep).join("/");

export async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}
