import SkillCard from "@/components/SkillCard";
import { getStacks, toCard } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata = { title: `Skill stacks — ${site.name}` };

export default function StacksPage() {
  const stacks = getStacks();
  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <h1 className="text-2xl font-bold">Skill stacks</h1>
      <p className="mb-8 text-sm text-muted">Hand-picked combinations of skills that together let an agent do the whole job at a world-class level. One download each.</p>
      <div className="space-y-12">
        {stacks.map((st) => (
          <section key={st.id} id={st.id} className="scroll-mt-20">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-3xl">
                <h2 className="text-xl font-semibold">{st.emoji} {st.title}</h2>
                <p className="mt-1 text-sm text-muted">{st.description}</p>
              </div>
              <a href={`/bundles/${st.id}.zip`} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90">⬇ Download stack ({st.resolved?.filter((s) => s.mirrored).length})</a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {st.resolved?.map((s) => <SkillCard key={s.id} s={toCard(s)} />)}
            </div>
          </section>
        ))}
        {!stacks.length && <p className="text-muted">No stacks defined yet (catalog/stacks.json).</p>}
      </div>
    </div>
  );
}
