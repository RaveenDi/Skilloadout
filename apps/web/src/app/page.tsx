import Link from "next/link";
import InstantSearch, { type StackHint } from "@/components/InstantSearch";
import SkillCard from "@/components/SkillCard";
import { getStacks, getTopPicks, loadCatalog, readJsonFile, toCard } from "@/lib/catalog";
import { CATEGORIES, CATEGORY_GROUPS } from "@/lib/taxonomy";
import { site } from "@/lib/site";

type Stats = { total: number; mirrored: number; sources: number; byCategory: Record<string, number>; generatedAt: string };

export default function Home() {
  const { skills } = loadCatalog();
  const stats = readJsonFile<Stats>("stats.json", { total: skills.length, mirrored: 0, sources: 0, byCategory: {}, generatedAt: "" });
  const originals = skills.filter((s) => s.origin === "world-skills").slice(0, 6);
  const { byId } = loadCatalog();
  const superpowers = Object.values(getTopPicks().byCategory)
    .map((ids) => ids.map((id) => byId.get(id)).find((s) => s && s.origin !== "world-skills"))
    .filter((s) => !!s)
    .slice(0, 9);
  const official = skills.filter((s) => s.source.official && s.mirrored).slice(0, 8);
  const allStacks = getStacks();
  const stacks = allStacks.slice(0, 6);
  const stackHints: StackHint[] = allStacks.map((st) => ({
    id: st.id,
    title: st.title,
    tagline: st.tagline,
    emoji: st.emoji,
    count: st.resolved?.filter((x) => x.mirrored).length || 0,
    keywords: [st.title, st.tagline, st.description, ...(st.resolved || []).slice(0, 8).map((x) => x.title)].join(" ").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2),
  }));

  return (
    <div className="relative overflow-hidden">
      <div className="aurora" />
      <div className="grid-bg absolute inset-x-0 top-0 h-[700px]" />

      <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-20 text-center md:pt-28">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.04] px-3 py-1 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {stats.total.toLocaleString()} skills · {stats.sources} sources · auto-updated every 3 days
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
          <span className="gradient-text">Every skill your AI needs</span>
          <br />
          to build what nobody has seen.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted md:text-lg">
          The best agent skills from Anthropic, OpenAI, Google, GitHub and the community, plus original flagship skills for
          3D, scroll-driven and immersive web. Works with Claude, Codex/ChatGPT, Gemini CLI, Copilot and Cursor.
        </p>
        <div className="mt-10">
          <InstantSearch autoFocus stacks={stackHints} />
        </div>
      </section>

      {originals.length > 0 && (
        <section className="relative mx-auto max-w-7xl px-5 py-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold">★ {site.name} Originals</h2>
              <p className="text-sm text-muted">Flagship skills for immersive 3D, fly-throughs, walkthroughs and scroll storytelling.</p>
            </div>
            <Link href="/browse?origin=world-skills" className="text-sm text-violet-300 hover:underline">All originals →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {originals.map((s) => <SkillCard key={s.id} s={toCard(s)} />)}
          </div>
        </section>
      )}

      {superpowers.length > 0 && (
        <section className="relative mx-auto max-w-7xl px-5 py-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold">⚡ Superpowers</h2>
              <p className="text-sm text-muted">The single best skill in each category — hand-picked from thousands.</p>
            </div>
            <Link href="/categories" className="text-sm text-violet-300 hover:underline">Superpowers by category →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {superpowers.map((s) => <SkillCard key={s.id} s={toCard(s)} />)}
          </div>
        </section>
      )}

      {stacks.length > 0 && (
        <section className="relative mx-auto max-w-7xl px-5 py-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold">Skill stacks</h2>
              <p className="text-sm text-muted">Curated bundles — one download, everything an agent needs for the job.</p>
            </div>
            <Link href="/stacks" className="text-sm text-violet-300 hover:underline">All stacks →</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {stacks.map((st) => (
              <Link key={st.id} href={`/stacks#${st.id}`} className="rounded-2xl border border-border bg-card p-5 transition hover:border-accent/50">
                <div className="text-2xl">{st.emoji}</div>
                <div className="mt-2 font-semibold">{st.title}</div>
                <div className="mt-1 text-sm text-muted">{st.tagline}</div>
                <div className="mt-3 text-xs text-muted">{st.resolved?.length || 0} skills</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="relative mx-auto max-w-7xl px-5 py-10">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Every category, top skills only</h2>
          <Link href="/categories" className="text-sm text-violet-300 hover:underline">All {CATEGORIES.length} categories →</Link>
        </div>
        {CATEGORY_GROUPS.map((g) => (
          <div key={g} className="mb-6">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{g}</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              {CATEGORIES.filter((c) => c.group === g).map((c) => (
                <Link key={c.id} href={`/categories/${c.id}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-accent/50">
                  <div className="text-xl">{c.emoji}</div>
                  <div className="mt-2 text-sm font-medium leading-tight">{c.label}</div>
                  <div className="mt-1 text-xs text-muted">{(stats.byCategory[c.id] || 0).toLocaleString()} skills</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {official.length > 0 && (
        <section className="relative mx-auto max-w-7xl px-5 py-10 pb-20">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-xl font-semibold">Top official skills</h2>
            <Link href="/browse?official=1" className="text-sm text-violet-300 hover:underline">See all →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {official.map((s) => <SkillCard key={s.id} s={toCard(s)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
