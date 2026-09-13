import Link from "next/link";
import { loadCatalog, readJsonFile } from "@/lib/catalog";
import { CATEGORIES, CATEGORY_GROUPS } from "@/lib/taxonomy";
import { site } from "@/lib/site";

export const metadata = { title: `All categories — ${site.name}` };

export default function CategoriesPage() {
  const { skills } = loadCatalog();
  const topPicks = readJsonFile<Record<string, string[]>>("top-picks.json", {});
  const counts = new Map<string, number>();
  for (const s of skills) for (const c of s.categories) counts.set(c, (counts.get(c) || 0) + 1);
  const titles = new Map(skills.map((s) => [s.id, s.title]));

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Every category</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {CATEGORIES.length} categories spanning software, creative work, business and everyday knowledge. Each one opens with its hand-picked
        <span className="text-amber-200"> ⚡ Superpower</span> skills — the best of the best — followed by everything else that passed our quality bar.
      </p>
      {CATEGORY_GROUPS.map((g) => (
        <section key={g} className="mt-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{g}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.filter((c) => c.group === g).map((c) => {
              const picks = (topPicks[c.id] || []).filter((id) => titles.has(id));
              return (
                <Link key={c.id} href={`/categories/${c.id}`} className="group rounded-2xl border border-border bg-card p-5 transition hover:border-accent/50">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-xs text-muted">{(counts.get(c.id) || 0).toLocaleString()} skills</span>
                  </div>
                  <div className="mt-2 font-semibold">{c.label}</div>
                  <p className="mt-1 text-sm text-muted">{c.description}</p>
                  {picks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {picks.slice(0, 4).map((id) => (
                        <span key={id} className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[11px] text-amber-200">⚡ {titles.get(id)}</span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
