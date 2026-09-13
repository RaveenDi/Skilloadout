"use client";

import { useEffect, useRef, useState } from "react";
import SkillCard from "./SkillCard";
import type { SkillCard as Card } from "@/lib/catalog";

type Result = { id: string; role: string; why: string; skill: Card };
type Answer = { summary: string; results: Result[]; build_plan: { step: string; skill_ids: string[] }[]; idea_sparks: string[] };

const EXAMPLES = [
  "A scroll-driven 3D website for a luxury watch brand that nobody has seen before",
  "Room walkthrough of an apartment for a real-estate listing",
  "Full-stack SaaS with Next.js, auth, Stripe payments and Postgres",
  "Audit my codebase for security vulnerabilities",
  "Analyze single-cell RNA-seq data and write up the results",
  "Build a mobile app with Expo and ship it to the App Store",
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "stack";

export default function AISearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [intent, setIntent] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Card[]>([]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setInterval(() => setPlaceholder((p) => (p + 1) % EXAMPLES.length), 3500);
    return () => clearInterval(t);
  }, []);

  async function run(q: string) {
    if (!q.trim()) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setStatus("Starting…");
    setIntent(null);
    setCandidates([]);
    setAnswer(null);
    setNotice(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
        signal: ac.signal,
      });
      if (!res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const e = JSON.parse(line);
          if (e.type === "status") setStatus(e.message);
          else if (e.type === "plan") setIntent(e.plan.intent);
          else if (e.type === "candidates") setCandidates(e.items);
          else if (e.type === "answer") setAnswer(e);
          else if (e.type === "notice" || e.type === "error") setNotice(e.message);
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setNotice((err as Error).message);
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  const byId = new Map(answer?.results.map((r) => [r.id, r.skill]) || []);
  const bundleIds = (answer?.results.map((r) => r.skill) || candidates).filter((s) => s.mirrored).map((s) => s.id);

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // Read from the form too: autofill / programmatic input can bypass onChange.
          const q = String(new FormData(e.currentTarget).get("q") || query);
          if (q !== query) setQuery(q);
          run(q);
        }}
        className="glow-ring relative mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-accent/30 bg-[#0d0d18]/90 p-2 backdrop-blur"
      >
        <span className="pl-3 text-lg">✦</span>
        <input
          autoFocus={autoFocus}
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Describe what you want to build… e.g. "${EXAMPLES[placeholder]}"`}
          className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/70"
          aria-label="Describe what you want to build or find"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-xl bg-gradient-to-r from-accent to-fuchsia-500 px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Thinking…" : "Find skills"}
        </button>
      </form>

      {!answer && !loading && !candidates.length && (
        <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
          {EXAMPLES.slice(0, 4).map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQuery(ex);
                run(ex);
              }}
              className="rounded-full border border-border bg-white/[0.03] px-3 py-1.5 text-xs text-muted transition hover:border-accent/50 hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {(loading || answer || candidates.length > 0 || notice) && (
        <section className="mx-auto mt-8 max-w-6xl text-left">
          {status && (
            <div className="mb-4 flex items-center gap-3 text-sm text-muted">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent-2" />
              {status}
              {intent && <span className="text-foreground/80">— {intent}</span>}
            </div>
          )}
          {notice && <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{notice}</div>}

          {answer && (
            <div className="mb-8 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-transparent to-accent-2/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="text-xs font-semibold uppercase tracking-widest text-violet-300">AI-assembled skill stack</div>
                  <p className="mt-2 text-[15px] leading-relaxed">{answer.summary}</p>
                </div>
                {bundleIds.length > 0 && (
                  <a
                    href={`/api/bundle?ids=${bundleIds.join(",")}&name=${slug(query)}`}
                    className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                  >
                    ⬇ Download stack ({bundleIds.length})
                  </a>
                )}
              </div>

              {answer.build_plan.length > 0 && (
                <ol className="mt-5 grid gap-2 md:grid-cols-2">
                  {answer.build_plan.map((p, i) => (
                    <li key={i} className="flex gap-3 rounded-xl border border-border bg-black/20 p-3 text-sm">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/30 text-xs font-bold">{i + 1}</span>
                      <div>
                        <div>{p.step}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.skill_ids.map((id) => (
                            <a key={id} href={`/skills/${id}`} className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-cyan-200 hover:bg-white/10">
                              {byId.get(id)?.title || id}
                            </a>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {answer.idea_sparks.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Idea sparks — concepts nobody has seen</div>
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    {answer.idea_sparks.map((idea, i) => (
                      <div key={i} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm leading-relaxed">{idea}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {answer ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {answer.results.map((r) => (
                <SkillCard key={r.id} s={r.skill} role={r.role} why={r.why} />
              ))}
            </div>
          ) : candidates.length > 0 ? (
            <>
              <div className="mb-3 text-xs uppercase tracking-widest text-muted">{loading ? "Early matches" : "Keyword matches"}</div>
              <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
                {candidates.slice(0, 12).map((s) => (
                  <SkillCard key={s.id} s={s} />
                ))}
              </div>
            </>
          ) : loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shimmer h-36 rounded-2xl border border-border" />
              ))}
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
