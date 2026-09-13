import type { NextRequest } from "next/server";
import { getSkill } from "@/lib/catalog";
import { addSkillToZip, folderName, zipResponse } from "@/lib/files";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/download/[id]">) {
  const { id } = await ctx.params;
  const skill = getSkill(id);
  if (!skill) return Response.json({ error: "Skill not found" }, { status: 404 });
  if (!skill.mirrored) {
    return Response.json(
      { error: "This skill's license does not allow redistribution. Get it from the original source.", source: skill.source.url },
      { status: 403 },
    );
  }
  const entries: Record<string, Uint8Array> = {};
  if (!addSkillToZip(entries, skill)) return Response.json({ error: "Skill files missing — run `npm run sync`." }, { status: 404 });
  return zipResponse(entries, `${folderName(skill)}.zip`);
}
