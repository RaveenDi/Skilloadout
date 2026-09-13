import Link from "next/link";
import { loadCatalog, readJsonFile } from "@/lib/catalog";
import { site } from "@/lib/site";

type Run = { date: string; total: number; added: number; updated: number; removed: number; addedIds: string[]; errors: { repo: string; error: string }[] };
type Discovery = { date: string; reviewer: string; candidates: number; accepted: string[]; decisions: { repo: string; decision: string; reason: string }[] };
type Stats = { total: number; mirrored: number; linkOnly: number; sources: number; flagged: number; byOrigin: Record<string, number>; byLicense: Record<string, number>; generatedAt: string };

export const metadata = { title: `Updates — ${site.name}` };

export default function UpdatesPage() {
  const runs = readJsonFile<Run[]>("changelog.json", []);
  const discovery = readJsonFile<Discovery[]>("discovery-log.json", []);
  const stats = readJsonFile<Stats | null>("stats.json", null);
  // Older runs list skills that have since been removed (e.g. by the quality gate) — don't link those.
  const liveIds = new Set(loadCatalog().skills.map((s) => s.id));

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="text-2xl font-bold">Updates</h1>
      <p className="mt-1 text-sm text-muted">
        An update agent runs every 3 days (GitHub Actions): it discovers new skill repositories, has Claude review them for quality and safety,
        re-syncs every source, re-checks licenses, dedupes, safety-scans and re-scores the whole library.
      </p>

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ["Skills", stats.total],
            ["Downloadable", stats.mirrored],
            ["Link-only", stats.linkOnly],
            ["Sources", stats.sources],
            ["Flagged for review", stats.flagged],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border bg-card p-4">
              <div className="text-2xl font-bold">{Number(v).toLocaleString()}</div>
              <div className="text-xs text-muted">{k}</div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 mb-3 text-lg font-semibold">Sync history</h2>
      <div className="space-y-3">
        {runs.map((r) => (
          <div key={r.date} className="rounded-xl border border-border bg-card p-4 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs text-muted">{r.date.replace("T", " ").slice(0, 16)} UTC</span>
              <span className="text-emerald-300">+{r.added}</span>
              <span className="text-cyan-300">~{r.updated}</span>
              <span className="text-red-300">−{r.removed}</span>
              <span className="text-muted">total {r.total.toLocaleString()}</span>
            </div>
            {r.addedIds.filter((id) => liveIds.has(id)).length > 0 && r.added < 60 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {r.addedIds.filter((id) => liveIds.has(id)).slice(0, 30).map((id) => (
                  <Link key={id} href={`/skills/${id}`} className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] hover:bg-white/10">{id}</Link>
                ))}
              </div>
            )}
            {r.errors?.length > 0 && <div className="mt-2 text-xs text-amber-300">{r.errors.length} source(s) failed and kept their previous version: {r.errors.map((e) => e.repo).join(", ")}</div>}
          </div>
        ))}
        {!runs.length && <p className="text-muted">No syncs yet — run <code>npm run sync</code>.</p>}
      </div>

      <h2 className="mt-10 mb-3 text-lg font-semibold">Discovery agent</h2>
      <div className="space-y-3">
        {discovery.map((d) => (
          <div key={d.date} className="rounded-xl border border-border bg-card p-4 text-sm">
            <div className="font-mono text-xs text-muted">{d.date.slice(0, 16).replace("T", " ")} · reviewer: {d.reviewer} · {d.candidates} candidates · {d.accepted.length} accepted</div>
            <ul className="mt-2 space-y-1 text-xs">
              {d.decisions.slice(0, 15).map((x) => (
                <li key={x.repo}><span className={x.decision === "accept" ? "text-emerald-300" : "text-muted"}>{x.decision === "accept" ? "✓" : "✗"} {x.repo}</span> — <span className="text-muted">{x.reason}</span></li>
              ))}
            </ul>
          </div>
        ))}
        {!discovery.length && <p className="text-muted">The discovery agent hasn&apos;t run yet.</p>}
      </div>
    </div>
  );
}
