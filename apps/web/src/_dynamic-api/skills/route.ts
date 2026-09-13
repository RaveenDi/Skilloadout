import type { NextRequest } from "next/server";
import { keywordSearch, listSkills, toCard, type Filters } from "@/lib/catalog";

// GET /api/skills?q=&category=&kind=&origin=&works=&official=1&downloadable=1&sort=score|stars|recent|name&offset=0&limit=48
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filters: Filters = {
    category: sp.get("category") || undefined,
    kind: sp.get("kind") || undefined,
    origin: sp.get("origin") || undefined,
    worksWith: sp.get("works") || undefined,
    official: sp.get("official") === "1",
    downloadable: sp.get("downloadable") === "1",
  };
  const offset = Math.max(0, Number(sp.get("offset")) || 0);
  const limit = Math.min(96, Math.max(1, Number(sp.get("limit")) || 48));
  const q = (sp.get("q") || "").trim();
  if (q) {
    const all = keywordSearch(q, filters, 500);
    return Response.json({ total: all.length, items: all.slice(offset, offset + limit).map((r) => toCard(r.skill)) });
  }
  const sort = (sp.get("sort") as "score" | "stars" | "recent" | "name") || "score";
  const { total, items } = listSkills(filters, sort, offset, limit);
  return Response.json({ total, items: items.map(toCard) });
}
