import Link from "next/link";
import type { Card } from "@/lib/card";
import { CATEGORY_EMOJI, CATEGORY_LABEL, KIND_LABEL, originLabel } from "@/lib/taxonomy";

export const fmtStars = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

export function OriginBadge({ origin, tier, official }: { origin: string; tier: number; official: boolean }) {
  const cls =
    tier === 0 ? "bg-gradient-to-r from-accent/30 to-accent-2/30 text-white border-accent/40"
    : official ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
    : "bg-white/5 text-muted border-border";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {tier === 0 ? "★ Original" : official ? `✓ ${originLabel(origin)}` : "Community"}
    </span>
  );
}

export default function SkillCard({ s, role, why }: { s: Card; role?: string; why?: string }) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-card p-4 transition hover:border-accent/50 hover:bg-white/[0.05]">
      <div className="mb-2 flex items-center gap-2 text-[11px] text-muted">
        <span>{CATEGORY_EMOJI[s.category]} {CATEGORY_LABEL[s.category] || s.category}</span>
        {s.kind !== "skill" && <span className="rounded bg-white/5 px-1.5">{KIND_LABEL[s.kind]}</span>}
        {s.superpower && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">⚡ Superpower</span>}
        {role && (
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${role === "core" ? "bg-accent/25 text-violet-200" : role === "supporting" ? "bg-accent-2/15 text-cyan-200" : "bg-white/5 text-muted"}`}>
            {role}
          </span>
        )}
      </div>
      <Link href={`/skills/${s.id}`} className="font-semibold leading-snug text-foreground after:absolute after:inset-0">
        {s.title}
      </Link>
      <p className="mt-1 line-clamp-3 text-sm text-muted">{why || s.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-[11px] text-muted">
        <OriginBadge origin={s.origin} tier={s.tier} official={s.official} />
        {s.tier !== 0 && <span className="truncate">{s.repo}</span>}
        {s.stars > 0 && <span>★ {fmtStars(s.stars)}</span>}
        {s.flags.includes("high") && <span className="text-red-300">⚠ review</span>}
        <span className="ml-auto">{s.mirrored ? "⬇ zip" : "↗ link"}</span>
      </div>
    </div>
  );
}
