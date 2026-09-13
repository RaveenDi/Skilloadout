import "server-only";
import fs from "node:fs";
import path from "node:path";
import { zipSync, strToU8 } from "fflate";
import { SKILLS_DIR, type Skill } from "./catalog";
import { site } from "./site";

export function listFiles(dir: string): string[] {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop()!;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile()) out.push(path.relative(dir, p).split(path.sep).join("/"));
    }
  }
  return out.sort();
}

export const folderName = (s: Skill) => (s.name || s.id).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || s.id;

export function addSkillToZip(entries: Record<string, Uint8Array>, s: Skill, prefix = "") {
  const dir = path.join(SKILLS_DIR, s.id);
  if (!fs.existsSync(dir)) return false;
  const root = `${prefix}${folderName(s)}/`;
  for (const rel of listFiles(dir)) entries[root + rel] = new Uint8Array(fs.readFileSync(path.join(dir, rel)));
  return true;
}

export function installGuide(names: string[], title: string) {
  return `# ${title}

Downloaded from ${site.name}. Each folder is an Agent Skill (a SKILL.md plus optional scripts/references).

## Install

| Tool | Where to put each skill folder |
|------|--------------------------------|
| Claude Code | \`~/.claude/skills/<folder>/\` (personal) or \`.claude/skills/<folder>/\` (project) |
| Claude.ai / Desktop | Settings → Capabilities → Skills → upload the folder as a .zip |
| OpenAI Codex / ChatGPT | \`~/.codex/skills/<folder>/\` (or \`.agents/skills/\` in a repo) |
| Gemini CLI | \`~/.gemini/skills/<folder>/\` or \`.gemini/skills/<folder>/\` |
| GitHub Copilot | \`.github/skills/<folder>/\` in your repository |
| Cursor | \`.cursor/skills/<folder>/\` (rules: copy the original .mdc/.cursorrules into \`.cursor/rules/\`) |

The agent reads each skill's name + description and loads the full instructions only when relevant.
Review scripts before running them — see ATTRIBUTION.md in each folder for source and license.

## Included
${names.map((n) => `- ${n}`).join("\n")}
`;
}

export function zipResponse(entries: Record<string, Uint8Array>, filename: string) {
  const zip = zipSync(entries, { level: 6 });
  return new Response(zip.slice().buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^\w.-]+/g, "-")}"`,
      "Cache-Control": "no-store",
    },
  });
}

export { strToU8 };
