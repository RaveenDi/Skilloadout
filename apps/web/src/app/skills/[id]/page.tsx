import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SkillCard, { OriginBadge, fmtStars } from "@/components/SkillCard";
import fs from "node:fs";
import path from "node:path";
import { getSkill, isSuperpower, keywordSearch, loadCatalog, readSkillFile, toCard } from "@/lib/catalog";
import { CATEGORY_EMOJI, CATEGORY_LABEL, ECOSYSTEMS, KIND_LABEL } from "@/lib/taxonomy";
import AdSlot from "@/components/AdSlot";
import { adProps, site } from "@/lib/site";

// SKILL.md files link to their own bundled files ("references/x.md", "scripts/run.py"). We don't
// serve those individually, so point them at the file in the upstream repository instead; when the
// skill has no upstream (our own originals), render the text without a dead link.
function mdComponents(repo: string, branch: string, dir: string, hasSource: boolean) {
  const resolve = (href: string) => {
    const clean = href.replace(/^\.\//, "");
    const segs = [...dir.split("/").filter(Boolean), ...clean.split("/")];
    const stack: string[] = [];
    for (const seg of segs) {
      if (seg === "..") stack.pop();
      else if (seg !== ".") stack.push(seg);
    }
    return `https://github.com/${repo}/blob/${branch}/${stack.join("/")}`;
  };
  return {
    a: ({ href, children }: React.ComponentPropsWithoutRef<"a">) => {
      const h = String(href || "");
      if (!h || h.startsWith("#")) return <span>{children}</span>;
      if (/^[a-z][a-z0-9+.-]*:/i.test(h) || h.startsWith("//")) {
        return <a href={h} target="_blank" rel="noreferrer">{children}</a>;
      }
      const looksLikePath = h.includes("/") || /\.[a-z0-9]{1,6}$/i.test(h);
      if (looksLikePath && hasSource) {
        return <a href={resolve(h)} target="_blank" rel="noreferrer">{children}</a>;
      }
      return <span>{children}</span>;
    },
    img: ({ src, alt }: React.ComponentPropsWithoutRef<"img">) => {
      const u = String(src || "");
      if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith("//")) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={u} alt={alt || ""} loading="lazy" />;
      }
      return <span className="text-muted">{alt || ""}</span>;
    },
  };
}

const stripFrontmatter = (s: string) => s.replace(/^﻿?\s*---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/, "");
const fmtSize = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : n > 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`);

export function generateStaticParams() {
  return loadCatalog().skills.map((s) => ({ id: s.id }));
}

// A zip only exists for skills whose files we are allowed to mirror.
const hasZip = (id: string) => fs.existsSync(path.join(process.cwd(), "public", "downloads", `${id}.zip`));

export async function generateMetadata({ params }: PageProps<"/skills/[id]">) {
  const { id } = await params;
  const s = getSkill(id);
  return s ? { title: `${s.title} — ${site.name}`, description: s.description.slice(0, 160) } : {};
}

export default async function SkillPage({ params }: PageProps<"/skills/[id]">) {
  const { id } = await params;
  const s = getSkill(id);
  if (!s) notFound();

  const mainFile = s.kind === "extension" ? s.files.find((f) => /\.md$/i.test(f.path) && !/ATTRIBUTION/i.test(f.path))?.path : "SKILL.md";
  const viewing = mainFile;
  const content = s.mirrored && viewing ? readSkillFile(s.id, viewing) : null;
  const isMarkdown = !!viewing && /\.(md|mdx|mdc)$/i.test(viewing);
  const related = keywordSearch(`${s.name.replace(/[-_]/g, " ")} ${s.tags.slice(0, 3).join(" ")}`, {}, 8)
    .filter((r) => r.skill.id !== s.id)
    .slice(0, 6);
  const folder = s.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <div className="mb-2 text-sm text-muted">
        <Link href="/browse" className="hover:text-foreground">Browse</Link> /{" "}
        <Link href={`/browse?category=${s.category}`} className="hover:text-foreground">{CATEGORY_EMOJI[s.category]} {CATEGORY_LABEL[s.category]}</Link>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight">{s.title}</h1>
          <p className="mt-2 text-muted">{s.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            {isSuperpower(s.id) && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-semibold text-amber-200">⚡ Superpower</span>}
            <OriginBadge origin={s.origin} tier={s.source.tier} official={s.source.official} />
            <span className="rounded-full border border-border px-2 py-0.5">{KIND_LABEL[s.kind]}</span>
            <span className="rounded-full border border-border px-2 py-0.5">{s.license}</span>
            {s.source.stars > 0 && <span>★ {fmtStars(s.source.stars)}</span>}
            {s.tags.map((t) => (
              <Link key={t} href={`/browse?q=${encodeURIComponent(t)}`} className="rounded bg-white/5 px-1.5 py-0.5 hover:bg-white/10">#{t}</Link>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {s.mirrored && hasZip(s.id) ? (
            <a href={`/downloads/${s.id}.zip`} className="rounded-xl bg-gradient-to-r from-accent to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110">⬇ Download .zip</a>
          ) : null}
          {s.source.url && (
            <a href={s.source.url} target="_blank" rel="noreferrer" className="rounded-xl border border-border px-4 py-2.5 text-sm hover:border-accent/60">Source ↗</a>
          )}
        </div>
      </div>

      {s.flags.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="font-semibold">Safety review notes</div>
          <ul className="mt-1 list-disc pl-5">
            {s.flags.map((f) => <li key={f.id}><span className="uppercase text-[10px] font-bold">{f.severity}</span> — {f.label}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0 rounded-2xl border border-border bg-card p-6">
          {!s.mirrored ? (
            <div className="py-10 text-center">
              <div className="text-lg font-semibold">Link-only skill</div>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                This skill&apos;s license ({s.license}) doesn&apos;t allow redistribution, so {site.name} lists it without copying it. Get it from the original source.
              </p>
              {s.source.url && <a href={s.source.url} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">Open on GitHub ↗</a>}
            </div>
          ) : content == null ? (
            <div className="text-muted">File not available locally — run <code>npm run sync</code>.</div>
          ) : isMarkdown ? (
            <div className="prose-skill">
              <div className="mb-4 font-mono text-xs text-muted">{viewing}</div>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents(s.source.repo, s.source.branch || "main", s.source.path || "", !!s.source.url)}>{stripFrontmatter(content)}</ReactMarkdown>
            </div>
          ) : (
            <div className="prose-skill">
              <div className="mb-4 font-mono text-xs text-muted">{viewing}</div>
              <pre><code>{content}</code></pre>
            </div>
          )}
        </article>

        <aside className="space-y-6">
          {s.mirrored && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 text-sm font-semibold">Files</div>
              <ul className="space-y-0.5 text-sm">
                {s.files.map((f) => (
                  <li key={f.path}>
                    <div className={`flex justify-between gap-2 rounded px-2 py-1 font-mono text-xs ${f.path === viewing ? "bg-white/10 text-foreground" : "text-muted"}`}>
                      <span className="truncate">{f.path}</span>
                      <span className="shrink-0">{fmtSize(f.size)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-4 text-sm">
            <div className="mb-2 font-semibold">Install</div>
            <p className="mb-3 text-xs text-muted">Unzip into your tool&apos;s skills folder as <code className="text-foreground">{folder}/</code>:</p>
            <ul className="space-y-1.5 text-xs">
              {ECOSYSTEMS.filter((e) => s.worksWith.includes(e.id)).map((e) => (
                <li key={e.id} className="flex justify-between gap-2">
                  <span className="text-muted">{e.label}</span>
                  <code className="truncate text-foreground">{e.dir}</code>
                </li>
              ))}
            </ul>
            {s.kind === "extension" && s.source.url && (
              <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-2 text-[11px]">gemini extensions install https://github.com/{s.source.repo}</pre>
            )}
          </div>

          <AdSlot {...adProps("rail-top")} />

          <div className="rounded-2xl border border-border bg-card p-4 text-sm">
            <div className="mb-2 font-semibold">Source</div>
            <dl className="space-y-1 text-xs">
              <div className="flex justify-between gap-2"><dt className="text-muted">Repository</dt><dd className="truncate">{s.source.repo}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">License</dt><dd>{s.license}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">Updated</dt><dd>{s.updatedAt?.slice(0, 10)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">Quality score</dt><dd>{s.score}</dd></div>
            </dl>
            {s.alsoIn && s.alsoIn.length > 0 && (
              <div className="mt-3 text-xs text-muted">
                Also found in: {s.alsoIn.map((a, i) => <span key={a.repo}>{i > 0 && ", "}<a href={a.url} className="underline" target="_blank" rel="noreferrer">{a.repo}</a></span>)}
              </div>
            )}
          </div>
          <AdSlot {...adProps("rail-bottom")} />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">Pairs well with</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <SkillCard key={r.skill.id} s={toCard(r.skill)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
