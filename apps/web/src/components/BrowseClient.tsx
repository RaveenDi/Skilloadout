"use client";

import { Fragment, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import SkillCard from "./SkillCard";
import AdSlot from "./AdSlot";
import type { AdProps } from "@/lib/site";
import { itemToCard } from "@/lib/card";
import { loadIndex, search, type Filters, type Item, type Sort } from "@/lib/search-client";
import { CATEGORIES, KIND_LABEL } from "@/lib/taxonomy";

type F = Filters & { q: string; sort: Sort };

const sel = "h-9 rounded-lg border border-border bg-[#0d0d16] px-2 text-sm text-foreground outline-none focus:border-accent/60";
const PAGE = 48;

function fromSearch(qs: string): F {
  const p = new URLSearchParams(qs);
  return {
    q: p.get("q") || "",
    category: p.get("category") || undefined,
    origin: p.get("origin") || undefined,
    kind: p.get("kind") || undefined,
    official: p.get("official") === "1" || undefined,
    downloadable: p.get("downloadable") === "1" || undefined,
    superpower: p.get("superpower") === "1" || undefined,
    sort: (p.get("sort") as Sort) || "score",
  };
}

// The page is static HTML, so the initial filters come from the URL on the client.
const subscribeToUrl = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

export default function BrowseClient({ origins, ad }: { origins: { id: string; label: string; count: number }[]; ad: AdProps }) {
  const urlSearch = useSyncExternalStore(subscribeToUrl, () => window.location.search, () => "");
  const urlFilters = useMemo(() => fromSearch(urlSearch), [urlSearch]);
  const [override, setOverride] = useState<F | null>(null);
  const [qInput, setQInput] = useState<string | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [shown, setShown] = useState(PAGE);
  const f = override ?? urlFilters;
  const queryBox = qInput ?? f.q;

  useEffect(() => {
    loadIndex().then((idx) => setItems(idx.items)).catch(() => setItems([]));
  }, []);

  // Debounced text input -> filters (async, so it never cascades a synchronous render).
  useEffect(() => {
    if (qInput === null || qInput === f.q) return;
    const t = setTimeout(() => {
      setOverride({ ...f, q: qInput });
      setShown(PAGE);
    }, 150);
    return () => clearTimeout(t);
  }, [qInput, f]);

  // Keep the URL shareable without a server round-trip. Only runs once the visitor changes
  // something: writing on mount would erase the incoming ?origin=…/?category=… before
  // useSyncExternalStore reads it (the server snapshot is an empty query string).
  useEffect(() => {
    if (!override) return;
    const p = new URLSearchParams();
    if (f.q) p.set("q", f.q);
    if (f.category) p.set("category", f.category);
    if (f.origin) p.set("origin", f.origin);
    if (f.kind) p.set("kind", f.kind);
    if (f.official) p.set("official", "1");
    if (f.downloadable) p.set("downloadable", "1");
    if (f.superpower) p.set("superpower", "1");
    if (f.sort !== "score") p.set("sort", f.sort);
    const qs = p.toString();
    window.history.replaceState(null, "", `/browse${qs ? `?${qs}` : ""}`);
  }, [f, override]);

  const results = useMemo(() => {
    if (!items) return [];
    const { q, sort, ...filters } = f;
    return search(items, q, filters, sort);
  }, [items, f]);

  const loading = items === null;
  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const t = e.target as HTMLInputElement;
    setOverride({ ...f, [k]: t.type === "checkbox" ? t.checked || undefined : t.value || undefined });
    setShown(PAGE);
  };

  return (
    <div>
      <div className="sticky top-14 z-30 -mx-5 mb-6 border-b border-border bg-background/85 px-5 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          <input value={queryBox} onChange={(e) => setQInput(e.target.value)} placeholder="Search skills…" className={`${sel} w-64 px-3`} />
          <select value={f.category || ""} onChange={set("category")} className={sel}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
          <select value={f.origin || ""} onChange={set("origin")} className={sel}>
            <option value="">All sources</option>
            {origins.map((o) => <option key={o.id} value={o.id}>{o.label} ({o.count})</option>)}
          </select>
          <select value={f.kind || ""} onChange={set("kind")} className={sel}>
            <option value="">All types</option>
            {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={f.sort} onChange={set("sort")} className={sel} disabled={!!f.q}>
            <option value="score">Best quality</option>
            <option value="stars">Most stars</option>
            <option value="name">A–Z</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm text-muted"><input type="checkbox" checked={!!f.superpower} onChange={set("superpower")} /> ⚡ Superpowers</label>
          <label className="flex items-center gap-1.5 text-sm text-muted"><input type="checkbox" checked={!!f.official} onChange={set("official")} /> Official</label>
          <label className="flex items-center gap-1.5 text-sm text-muted"><input type="checkbox" checked={!!f.downloadable} onChange={set("downloadable")} /> Downloadable</label>
          <span className="ml-auto text-sm text-muted">{loading ? "loading…" : `${results.length.toLocaleString()} results`}</span>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="shimmer h-36 rounded-2xl border border-border" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.slice(0, shown).map((it, i) => (
              <Fragment key={it.i}>
                <SkillCard s={itemToCard(it)} />
                {ad.inFeed && ad.provider !== "none" && i % 16 === 11 && (
                  <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    <AdSlot {...ad} variant="banner" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
          {shown < results.length && (
            <div className="mt-8 text-center">
              <button onClick={() => setShown((s) => s + PAGE)} className="rounded-xl border border-border px-5 py-2 text-sm hover:border-accent/60">
                Load more ({(results.length - shown).toLocaleString()} left)
              </button>
            </div>
          )}
          {!results.length && <div className="py-20 text-center text-muted">No skills match these filters.</div>}
        </>
      )}
    </div>
  );
}
