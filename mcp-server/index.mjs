#!/usr/bin/env node
// Skill Loadout MCP server — exposes the catalog this repo's scheduler maintains (catalog/index.json,
// skills/) as MCP tools, so any MCP client (Claude Code, Claude Desktop, Cursor, Codex CLI, Gemini CLI)
// can search, inspect, and install skills directly from a clone of this repo. No backend, no API key,
// no network calls: everything is read from the git checkout this process runs in. `git pull` refreshes
// the data; nothing about this server needs to change when the catalog updates.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_DIR = path.join(ROOT, "catalog");
const SKILLS_DIR = path.join(ROOT, "skills");

const INSTALL_DIRS = {
  claude: ".claude/skills",
  codex: ".agents/skills",
  gemini: ".gemini/skills",
  copilot: ".github/skills",
  cursor: ".cursor/skills",
};

function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function loadIndex() {
  const index = readJson(path.join(CATALOG_DIR, "index.json"), null);
  if (!index) {
    throw new Error(
      `Could not read ${path.join(CATALOG_DIR, "index.json")}. This server must run from inside a clone ` +
        `of github.com/RaveenDi/Skilloadout (it reads the catalog straight off disk, no network calls).`,
    );
  }
  return index.skills;
}

function text(s) {
  return { content: [{ type: "text", text: s }] };
}

function errorText(s) {
  return { content: [{ type: "text", text: s }], isError: true };
}

// Small, dependency-free relevance score: word overlap across the fields that matter most, weighted.
function scoreMatch(skill, terms) {
  const hay = [
    [skill.name, 4],
    [skill.title, 3],
    [(skill.tags || []).join(" "), 2],
    [skill.description, 1],
    [skill.excerpt, 0.5],
  ];
  let score = 0;
  for (const term of terms) {
    for (const [field, weight] of hay) {
      if (field && field.toLowerCase().includes(term)) score += weight;
    }
  }
  return score;
}

// The regex scan over-matches (security skills *describe* attacks), so only reviewed verdicts get a
// warning; unreviewed matches are reported as unverified, never as findings.
function verdictOf(skill) {
  if (!skill.flags?.length) return null;
  return skill.safety?.verdict || "unverified";
}

function safetyTag(skill) {
  const v = verdictOf(skill);
  const labels = (skill.flags || []).map((f) => f.label).join("; ");
  if (v === "malicious") return ` [⛔ reviewed: malicious — ${skill.safety.reason}]`;
  if (v === "caution") return ` [⚠ review before running — ${skill.safety.reason}]`;
  if (v === "unverified") return ` [ℹ unverified scan match: ${labels}]`;
  return "";
}

function safetyLine(skill) {
  const v = verdictOf(skill);
  if (!v) return "safety: no scan matches";
  const labels = skill.flags.map((f) => f.label).join("; ");
  if (v === "unverified") return `safety: automated scan matched (${labels}) — not yet reviewed; read the matched parts before running scripts`;
  return `safety: scan matched (${labels}); reviewed by ${skill.safety.reviewer}: ${v} — ${skill.safety.reason}`;
}

function summarize(skill) {
  const avail = skill.mirrored ? "installable" : "link-only (license not redistributable)";
  return `${skill.id} — ${skill.title} (${skill.category}, ${avail})${safetyTag(skill)}\n  ${skill.description}`;
}

const server = new McpServer({ name: "skill-loadout", version: "0.1.0" });

server.registerTool(
  "search_skills",
  {
    description:
      "Search the Skill Loadout catalog (12,000+ license-checked, safety-scanned AI agent skills across 36 categories) by free-text query, optionally narrowed to one category. Returns the best-matching skill ids plus a one-line description each — use get_skill to read a skill's full instructions.",
    inputSchema: z.object({
      query: z.string().describe("Free-text search, e.g. 'scroll-driven 3d camera' or 'stripe payments'"),
      category: z.string().optional().describe("Restrict to a taxonomy category id, e.g. 'ai-ml' or 'workflow-agents'. See list_categories."),
      limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10)"),
    }),
  },
  async ({ query, category, limit }) => {
    const skills = loadIndex();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return errorText("query must be non-empty.");
    const pool = category ? skills.filter((s) => s.category === category || (s.categories || []).includes(category)) : skills;
    const ranked = pool
      .map((s) => ({ s, score: scoreMatch(s, terms) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || (b.s.score || 0) - (a.s.score || 0))
      .slice(0, limit ?? 10);
    if (!ranked.length) return text(`No skills matched "${query}"${category ? ` in category "${category}"` : ""}.`);
    return text(ranked.map((r) => summarize(r.s)).join("\n\n"));
  },
);

server.registerTool(
  "get_skill",
  {
    description:
      "Fetch full details for one skill by id, including its complete SKILL.md instructions when it's installable (mirrored under a redistributable license), or its upstream source link when it's link-only.",
    inputSchema: z.object({ id: z.string().describe("Skill id, as returned by search_skills") }),
  },
  async ({ id }) => {
    const skills = loadIndex();
    const skill = skills.find((s) => s.id === id);
    if (!skill) return errorText(`No skill with id "${id}". Use search_skills to find valid ids.`);
    const meta = [
      `id: ${skill.id}`,
      `title: ${skill.title}`,
      `category: ${skill.category} (also: ${(skill.categories || []).join(", ")})`,
      `license: ${skill.license || "unknown"}`,
      `source: ${skill.source?.repo || "world-skills/originals"}${skill.source?.url ? ` (${skill.source.url})` : ""}`,
      `works with: ${(skill.worksWith || []).join(", ")}`,
      safetyLine(skill),
    ].join("\n");
    if (skill.quarantined) {
      return text(`${meta}\n\nThis skill is quarantined: a safety review found it malicious, so its files are not distributed here. Do not install it from its source either.`);
    }
    if (!skill.mirrored) {
      return text(`${meta}\n\nThis skill is link-only — its license doesn't allow redistribution, so it isn't bundled in this repo.\nGet it directly from: ${skill.source?.url || `https://github.com/${skill.source?.repo}`}`);
    }
    const skillPath = path.join(SKILLS_DIR, id, "SKILL.md");
    if (!fs.existsSync(skillPath)) return errorText(`Catalog says "${id}" is mirrored, but ${skillPath} is missing on disk — try \`git pull\`.`);
    const body = fs.readFileSync(skillPath, "utf8");
    const files = fs
      .readdirSync(path.join(SKILLS_DIR, id), { withFileTypes: true })
      .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
      .filter((f) => f !== "SKILL.md");
    return text(`${meta}\nother files: ${files.length ? files.join(", ") : "(none)"}\n\n--- SKILL.md ---\n\n${body}`);
  },
);

server.registerTool(
  "install_skill",
  {
    description:
      "Copy a mirrored skill's folder from this repo into a project so an agent picks it up. Pick `client` for the conventional install path (.claude/skills, .cursor/skills, etc.) or pass an explicit `targetDir`.",
    inputSchema: z.object({
      id: z.string().describe("Skill id to install"),
      client: z.enum(["claude", "codex", "gemini", "copilot", "cursor"]).optional().describe("Install under this tool's conventional skills directory, relative to cwd"),
      targetDir: z.string().optional().describe("Explicit directory to install into instead of `client` (the skill's own folder is created inside it)"),
      cwd: z.string().optional().describe("Project root the relative paths above are resolved against (default: this server's current working directory)"),
    }),
  },
  async ({ id, client, targetDir, cwd }) => {
    const skills = loadIndex();
    const skill = skills.find((s) => s.id === id);
    if (!skill) return errorText(`No skill with id "${id}". Use search_skills to find valid ids.`);
    if (skill.quarantined || verdictOf(skill) === "malicious") return errorText(`Refusing to install "${id}": a safety review found it malicious — ${skill.safety?.reason || "quarantined"}`);
    if (!skill.mirrored) return errorText(`"${id}" is link-only (license doesn't allow redistribution) — fetch it yourself from ${skill.source?.url || skill.source?.repo}.`);
    const srcDir = path.join(SKILLS_DIR, id);
    if (!fs.existsSync(path.join(srcDir, "SKILL.md"))) return errorText(`Catalog says "${id}" is mirrored, but ${srcDir} is missing on disk — try \`git pull\`.`);
    const base = path.resolve(cwd || process.cwd());
    const destParent = targetDir ? path.resolve(base, targetDir) : path.resolve(base, INSTALL_DIRS[client || "claude"]);
    const dest = path.join(destParent, id);
    fs.mkdirSync(dest, { recursive: true });
    // Copy real files only — a symlink in a skill folder must never point an agent at files outside it.
    fs.cpSync(srcDir, dest, { recursive: true, filter: (p) => !fs.lstatSync(p).isSymbolicLink() });
    const note = ["caution", "unverified"].includes(verdictOf(skill)) ? `\n${safetyLine(skill)}` : "";
    return text(`Installed "${id}" into ${dest}${note}`);
  },
);

server.registerTool(
  "list_categories",
  { description: "List the 36 taxonomy categories skills are classified under, with id, label, and description — use the id with search_skills's `category` filter." },
  async () => {
    const taxonomy = readJson(path.join(CATALOG_DIR, "taxonomy.json"), []);
    return text(taxonomy.map((c) => `${c.id} ${c.emoji} ${c.label} — ${c.description}`).join("\n"));
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
