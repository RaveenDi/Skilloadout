"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import SkillCard from "./SkillCard";
import { itemToCard, bundleUrl } from "@/lib/card";
import { loadIndex, search, suggestStacks, type Item } from "@/lib/search-client";
import { track } from "./Analytics";

export type StackHint = { id: string; title: string; tagline: string; emoji: string; keywords: string[]; count: number };

const EXAMPLES = [
  "scroll-driven 3D website",
  "room walkthrough for real estate",
  "Next.js + Stripe + auth",
  "security audit my repo",
  "clinical notes and FHIR",
  "lesson plan for my class",
];

export default function InstantSearch({ stacks, autoFocus = false }: { stacks: StackHint[]; autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState(0);
  const started = useRef(false);

  // Rotate placeholder examples until the user types.
  useEffect(() => {
    if (query) return;
    const t = setInterval(() => setPlaceholder((p) => (p + 1) % EXAMPLES.length), 3000);
    return () => clearInterval(t);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 120);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch the index on first interaction (keeps the landing page light).
  const ensureIndex = () => {
    if (started.current) return;
    started.current = true;
    loadIndex()
      .then((idx) => setItems(idx.items))
      .catch(() => setError("Could not load the search index — try reloading."));
  };

  const results = useMemo(() => {
    if (!items || !debounced) return [];
    return search(items, debounced, {}, "score").slice(0, 18);
  }, [items, debounced]);

  // Report searches to GA4 (standard `search` event). This is the single most useful signal:
  // it tells you what people actually came for, including the queries that return nothing.
  useEffect(() => {
    if (!debounced || debounced.length < 3 || !items) return;
    const t = setTimeout(() => {
      track("search", { search_term: debounced.toLowerCase().slice(0, 100), results: results.length });
    }, 900);
    return () => clearTimeout(t);
  }, [debounced, items, results.length]);

  const matchedStacks = useMemo(() => (debounced ? suggestStacks(debounced, stacks) : []), [debounced, stacks]);
  const loading = !!debounced && !items && !error;

  return (
    <div className="w-full">
      <div className="glow-ring relative mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-accent/30 bg-[#0d0d18]/90 p-2 backdrop-blur">
        <span className="pl-3 text-lg">⌕</span>
        <input
          autoFocus={autoFocus}
          value={query}
          onFocus={ensureIndex}
          onChange={(e) => {
            ensureIndex();
            setQuery(e.target.value);
          }}
          placeholder={`Search 6,000+ skills — try "${EXAMPLES[placeholder]}"`}
          className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/70"
          aria-label="Search skills"
        />
        {query && (
          <button onClick={() => setQuery("")} className="px-3 text-sm text-muted hover:text-foreground" aria-label="Clear search">
            ✕
          </button>
        )}
      </div>

      {!debounced && (
        <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
          {EXAMPLES.slice(0, 4).map((ex) => (
            <button
              key={ex}
              onClick={() => {
                ensureIndex();
                setQuery(ex);
              }}
              className="rounded-full border border-border bg-white/[0.03] px-3 py-1.5 text-xs text-muted transition hover:border-accent/50 hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {(loading || error || debounced) && (
        <section className="mx-auto mt-8 max-w-6xl text-left">
          {error && <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</div>}

          {matchedStacks.length > 0 && (
            <div className="mb-6 grid gap-3 md:grid-cols-2">
              {matchedStacks.map((st) => (
                <div key={st.id} className="flex items-center gap-4 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-transparent p-4">
                  <div className="text-3xl">{st.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-widest text-violet-300">Ready-made loadout</div>
                    <Link href={`/stacks#${st.id}`} className="font-semibold hover:underline">{st.title}</Link>
                    <div className="truncate text-sm text-muted">{st.tagline}</div>
                  </div>
                  <a href={bundleUrl(st.id)} className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-white/90">
                    ⬇ {st.count} skills
                  </a>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shimmer h-36 rounded-2xl border border-border" />
              ))}
            </div>
          ) : results.length ? (
            <>
              <div className="mb-3 flex items-center justify-between text-xs text-muted">
                <span>{results.length === 18 ? "Top 18 matches" : `${results.length} match${results.length === 1 ? "" : "es"}`}</span>
                <Link href={`/browse?q=${encodeURIComponent(debounced)}`} className="text-violet-300 hover:underline">
                  Refine with filters →
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((it) => (
                  <SkillCard key={it.i} s={itemToCard(it)} />
                ))}
              </div>
            </>
          ) : debounced && items ? (
            <div className="py-12 text-center text-muted">
              Nothing matched “{debounced}”. Try a tool name (three.js, Stripe, Playwright) or browse{" "}
              <Link href="/categories" className="text-violet-300 hover:underline">all categories</Link>.
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
