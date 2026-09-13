import Link from "next/link";
import { notFound } from "next/navigation";
import SkillCard from "@/components/SkillCard";
import AdRail from "@/components/AdRail";
import { getTopPicks, listSkills, loadCatalog, toCard } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/taxonomy";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/categories/[id]">) {
  const { id } = await params;
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? { title: `Best ${c.label} skills for AI agents — ${site.name}`, description: c.description } : {};
}

export default async function CategoryPage({ params }: PageProps<"/categories/[id]">) {
  const { id } = await params;
  const cat = CATEGORIES.find((c) => c.id === id);
  if (!cat) notFound();

  const { byId } = loadCatalog();
  const pickIds = getTopPicks().byCategory[id] || [];
  const picks = pickIds.map((pid) => byId.get(pid)).filter((s) => !!s);
  const pickSet = new Set(pickIds);
  const { total, items } = listSkills({ category: id }, "score", 0, 60);
  const rest = items.filter((s) => !pickSet.has(s.id)).slice(0, 36);
  const downloadable = picks.filter((s) => s.mirrored).map((s) => s.id);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="text-sm text-muted">
        <Link href="/categories" className="hover:text-foreground">Categories</Link> / {cat.group}
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight">{cat.emoji} {cat.label}</h1>
          <p className="mt-2 text-muted">{cat.description}</p>
        </div>
        {downloadable.length > 0 && (
          <a href={`/bundles/${cat.id}-superpowers.zip`} className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-sm font-semibold text-black hover:brightness-110">
            ⚡ Download all Superpowers ({downloadable.length})
          </a>
        )}
      </div>

      {picks.length > 0 && (
        <section className="mt-8 rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 via-transparent to-transparent p-5">
          <h2 className="text-lg font-semibold">⚡ Superpowers</h2>
          <p className="mb-4 text-sm text-muted">Hand-picked: the few skills in this category that make the biggest difference.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((s) => <SkillCard key={s.id} s={toCard(s)} />)}
          </div>
        </section>
      )}

      <section className="mt-10 flex gap-6">
        <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold">More top skills</h2>
          <Link href={`/browse?category=${id}`} className="text-sm text-violet-300 hover:underline">All {total.toLocaleString()} →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((s) => <SkillCard key={s.id} s={toCard(s)} />)}
        </div>
        </div>
        <AdRail />
      </section>
    </div>
  );
}
