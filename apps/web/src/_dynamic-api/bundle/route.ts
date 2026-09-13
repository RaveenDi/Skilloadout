import type { NextRequest } from "next/server";
import { getSkill, getStacks, type Skill } from "@/lib/catalog";
import { addSkillToZip, folderName, installGuide, strToU8, zipResponse } from "@/lib/files";

// GET /api/bundle?ids=a,b,c&name=my-stack   or   /api/bundle?stack=<stack-id>
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  let title = (sp.get("name") || "world-skills-bundle").slice(0, 60);
  let skills: Skill[] = [];
  const stackId = sp.get("stack");
  if (stackId) {
    const stack = getStacks().find((s) => s.id === stackId);
    if (!stack) return Response.json({ error: "Stack not found" }, { status: 404 });
    title = stack.id;
    skills = stack.resolved || [];
  } else {
    const ids = (sp.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 60);
    skills = ids.map((id) => getSkill(id)).filter((s): s is Skill => !!s);
  }
  const downloadable = skills.filter((s) => s.mirrored);
  if (!downloadable.length) return Response.json({ error: "No downloadable skills in this selection." }, { status: 400 });

  const entries: Record<string, Uint8Array> = {};
  const prefix = `${title}/`;
  const included: string[] = [];
  for (const s of downloadable) if (addSkillToZip(entries, s, prefix)) included.push(`${folderName(s)} — ${s.title} (${s.source.repo}, ${s.license})`);
  const linkOnly = skills.filter((s) => !s.mirrored);
  let guide = installGuide(included, title);
  if (linkOnly.length) guide += `\n## Link-only (license does not allow redistribution — install from source)\n${linkOnly.map((s) => `- ${s.title}: ${s.source.url}`).join("\n")}\n`;
  entries[`${prefix}INSTALL.md`] = strToU8(guide);
  return zipResponse(entries, `${title}.zip`);
}
