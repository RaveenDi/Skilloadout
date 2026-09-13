'use client';

/**
 * editorial-fusion-template.tsx — Archetype B: the editorial-fusion landing.
 *
 * VERBATIM STRUCTURE from a shipped production build; product copy/data kept
 * as a worked example. Fuses an editorial layout system (studied live from
 * the best 2026 dev-tool sites -- see study-a-reference-site.md) with the
 * depth-fly WebGL engine: near-black grid, mono body, eyebrow spine, zig-zag
 * product panels, one contrast inversion, settle discipline -- PLUS the
 * things a pure-CSS site cannot do: a live WebGL relief hero panel, a
 * click-to-run terminal against a real API, a depth-still cinema break.
 *
 * ADAPT POINTS (everything else transfers as-is):
 *  1. Fonts: swap the localFont src; keep the --font-cine variable pattern.
 *  2. HERO_FRAMES/HERO_DEPTHS: your frame pair (MINIMUM 2 -- the engine needs
 *     a valid camera leg even when progress is pinned at 0). CINEMA_STILL:
 *     your most cinematic frame.
 *  3. MARQUEE_FACTS / RATIO_ROWS / ENTERPRISE_CARDS / CLIENTS / CONCEPTS:
 *     YOUR real, verifiable numbers and features. HONESTY GUARD: a young
 *     company ships a measured-facts marquee, never a fake logo wall; every
 *     number must trace to a test or a query.
 *  4. runTerminal(): point at YOUR live no-auth demo endpoint; keep the
 *     graceful error line. Dev gotcha: if the browser call fails while curl
 *     succeeds, test the OPTIONS preflight -- your API's CORS allowlist
 *     probably lacks the dev-preview port.
 *  5. Copy: every headline/sub. Keep the register: short declaratives,
 *     numbers over adjectives, mono for supporting copy.
 *  6. CSS: pair with editorial-fusion.css (namespace rename is a find/replace
 *     of the class prefix; classes map 1:1 to this file).
 *  7. Links: your sign-up/docs/pricing routes.
 */
import dynamic from 'next/dynamic';
import localFont from 'next/font/local';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { demoCompress } from '@/libs/gotcontext-api';
import { SAMPLE_DOCUMENT } from '@/libs/sample-document';

const clashDisplay = localFont({
  src: './fonts/ClashDisplay-Semibold.woff2',
  weight: '600',
  display: 'swap',
  variable: '--font-cine',
});

const DepthFlyCanvas = dynamic(() => import('./DepthFlyCanvas'), { ssr: false });

// Two frames so the canvas always has a valid camera leg; progress stays at the
// journey start so the hero shows the first still with idle drift + mouse
// parallax only.
const HERO_FRAMES = ['/cinematic/frame1.webp', '/cinematic/frame2.webp'];
const HERO_DEPTHS = ['/cinematic/depth1.webp', '/cinematic/depth2.webp'];
const CINEMA_STILL = '/cinematic/frame3.webp';

// Measured, test-locked figures only (test_gtm_benchmarks + pricing parity):
// 9.54x on large docs, 96% tool-schema reduction, ~50% canonical typical
// saving, 173 Pro / 23 free MCP tools.
const MARQUEE_FACTS = [
  '9.54x compression measured on large documents',
  '~50% typical token savings on mixed context',
  '96% reduction on MCP tool schemas',
  '173 MCP tools on Pro, 23 on Free',
  'REST + MCP Streamable HTTP, one bearer token',
  'Engine runs locally, zero AI provider calls at runtime',
];

const CONCEPTS = [
  {
    key: 'MODEL-AGNOSTIC',
    body: 'Claude, GPT, Gemini, local models. Compression happens before your tokens leave, so every provider benefits equally.',
    diagram: ['claude ─┐', 'gpt ────┼─▶ one gateway', 'gemini ─┘'],
  },
  {
    key: 'MCP-NATIVE',
    body: 'One Streamable HTTP URL with a bearer token. Your agent discovers every tool the moment it connects.',
    diagram: ['https://api.gotcontext.ai/mcp', 'Authorization: Bearer gc_...', 'tools/list ▶ ready'],
  },
  {
    key: 'LOCAL ENGINE',
    body: 'Semantic compression runs on our metal with ONNX embeddings. Your context is never forwarded to an AI provider.',
    diagram: ['[ engine ]', 'onnx + sbert, in process', 'external AI calls: 0'],
  },
];

// Real content-type ratios (locked in token-saver-5000/tests/test_gtm_benchmarks.py).
const RATIO_ROWS = [
  { label: 'Large documents', after: 10.5, note: '9.54x' },
  { label: 'MCP tool schemas', after: 4, note: '96% smaller' },
  { label: 'Typical mixed context', after: 50, note: '~50% saved' },
];

const ENTERPRISE_CARDS = [
  { title: 'SELF-HOSTED', body: 'Run the full gateway in your VPC from one Docker image, licensed with Ed25519-signed keys.' },
  { title: 'SSO AUTH', body: 'Clerk-backed sessions and JWTs for the dashboard, HMAC-signed gc_ keys for machines.' },
  { title: 'BUDGETS & FINOPS', body: 'Per-project budgets with 75, 90 and 100 percent alerts, usage rollups by key and model.' },
  { title: 'AUDIT TRAILS', body: 'Append-only audit events enforced at the database layer. Nothing is silently rewritten.' },
  { title: 'A2A INTEROP', body: 'A Linux Foundation Agent2Agent card, signed share manifests and cross-agent task delegation.' },
  { title: 'SECURITY SCANNING', body: 'gc_scan runs 128 AST rules across 6 packs. gc_skill_scan gates skills before your agents install them.' },
];

const CLIENTS = [
  { name: 'Claude Code', how: 'plugin bundle or one .mcp.json entry' },
  { name: 'Cursor', how: 'MCP settings, same URL and bearer token' },
  { name: 'Codex CLI', how: 'pre-wired MCP config shipped in our docs' },
  { name: 'Gemini CLI', how: 'Docker image with the gateway pre-wired' },
  { name: 'VS Code', how: 'published extension on the marketplace' },
  { name: 'CI pipelines', how: 'GitHub Action plus Python and TS SDKs' },
];

export function FactoryLanding() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroProgressRef = useRef(0);
  const cinemaImgRef = useRef<HTMLDivElement | null>(null);
  const cinemaWrapRef = useRef<HTMLElement | null>(null);
  const [canvasOn, setCanvasOn] = useState(false);

  // Section entrance reveals: one IntersectionObserver, fire once, settle.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const targets = root.querySelectorAll('[data-flr]');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 },
    );
    targets.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Hero WebGL relief only where it earns its cost: fine pointer + motion OK.
  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setCanvasOn(fine && !still);
  }, []);

  // Cinema still: slow scroll parallax (the one perpetual-feeling motion, and
  // it only moves while the user scrolls).
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const wrap = cinemaWrapRef.current;
        const img = cinemaImgRef.current;
        if (!wrap || !img) {
          return;
        }
        const r = wrap.getBoundingClientRect();
        const mid = r.top + r.height / 2 - window.innerHeight / 2;
        img.style.transform = `scale(1.18) translate3d(0, ${(mid * -0.08).toFixed(1)}px, 0)`;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Live terminal: a REAL /v1/demo/compress run, typed line by line.
  const [termLines, setTermLines] = useState<string[]>([]);
  const [termState, setTermState] = useState<'idle' | 'running' | 'done'>('idle');
  const timersRef = useRef<number[]>([]);
  useEffect(() => () => timersRef.current.forEach(t => clearTimeout(t)), []);

  const runTerminal = useCallback(async () => {
    if (termState === 'running') {
      return;
    }
    setTermState('running');
    setTermLines([
      '$ POST https://api.gotcontext.ai/v1/demo/compress',
      '  sending the shared 5,000 character sample document...',
    ]);
    try {
      const r = await demoCompress(SAMPLE_DOCUMENT);
      const lines = [
        `  original_tokens    ${r.original_tokens.toLocaleString('en-US')}`,
        `  compressed_tokens  ${r.compressed_tokens.toLocaleString('en-US')}`,
        `  savings            ${Math.round(r.savings_pct)}%`,
        '  status             COMPLETE. Same context, smaller bill.',
      ];
      lines.forEach((ln, i) => {
        const t = window.setTimeout(() => {
          setTermLines(prev => [...prev, ln]);
          if (i === lines.length - 1) {
            setTermState('done');
          }
        }, 300 * (i + 1));
        timersRef.current.push(t);
      });
    } catch {
      setTermLines(prev => [...prev, '  error              live API unreachable right now, try again shortly']);
      setTermState('idle');
    }
  }, [termState]);

  return (
    <div ref={rootRef} className={`gc-fl ${clashDisplay.variable}`}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="gc-fl-hero">
        <div className="gc-fl-hero-copy" data-flr>
          <div className="gc-fl-eyebrow">
            <span className="gc-fl-dot" />
            CONTEXT ENGINE
          </div>
          <h1 className="gc-fl-display gc-fl-h1">
            Half the tokens.
            <br />
            All the context.
          </h1>
          <p className="gc-fl-mono gc-fl-sub">
            gotcontext is the context gateway for AI agents. Semantic
            compression, code intelligence, security scanning and team memory,
            behind one MCP URL.
          </p>
          <div className="gc-fl-ctas">
            <Link className="gc-fl-btn gc-fl-btn-primary" href="/sign-up">GET A FREE API KEY</Link>
            <Link className="gc-fl-btn gc-fl-btn-ghost" href="/docs">
              READ THE DOCS
              {' '}
              →
            </Link>
          </div>
        </div>
        <div className="gc-fl-heroviz" aria-hidden="true">
          <div className="gc-fl-window gc-fl-heroviz-window">
            <div className="gc-fl-window-bar">
              <span className="gc-fl-tl" />
              <span className="gc-fl-tl" />
              <span className="gc-fl-tl" />
              <span className="gc-fl-window-title">the compression core, live relief</span>
            </div>
            <div className="gc-fl-heroviz-canvas">
              {canvasOn
                ? (
                    <DepthFlyCanvas
                      progressRef={heroProgressRef}
                      frames={HERO_FRAMES}
                      depths={HERO_DEPTHS}
                      cool="#33d2ff"
                      hot="rgb(255, 138, 76)"
                    />
                  )
                : <div className="gc-fl-heroviz-still" style={{ backgroundImage: `url(${HERO_FRAMES[0]})` }} />}
            </div>
            <div className="gc-fl-heroviz-chips gc-fl-mono">
              <span>~50% typical savings</span>
              <span>9.54x large docs</span>
              <span>REST + MCP</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Measured-facts marquee (our honest stand-in for a logo wall) ── */}
      <section className="gc-fl-band" data-flr>
        <div className="gc-fl-band-label gc-fl-mono">MEASURED ON REAL WORKLOADS</div>
        <div className="gc-fl-marquee">
          <div className="gc-fl-marquee-track">
            {MARQUEE_FACTS.map(f => <span key={f} className="gc-fl-mono">{f}</span>)}
            {MARQUEE_FACTS.map(f => <span key={`${f}-dup`} className="gc-fl-mono" aria-hidden="true">{f}</span>)}
          </div>
        </div>
      </section>

      {/* ── Concept cards ────────────────────────────────────────────────── */}
      <section className="gc-fl-section" data-flr>
        <h2 className="gc-fl-display gc-fl-h2">Defining your context gateway</h2>
        <div className="gc-fl-cards3">
          {CONCEPTS.map(c => (
            <div key={c.key} className="gc-fl-card">
              <div className="gc-fl-card-diagram gc-fl-mono" aria-hidden="true">
                {c.diagram.map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="gc-fl-card-title gc-fl-mono">{c.key}</div>
              <p className="gc-fl-mono gc-fl-card-body">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cinema break: depth still with scroll parallax ───────────────── */}
      <section ref={cinemaWrapRef} className="gc-fl-cinema">
        <div ref={cinemaImgRef} className="gc-fl-cinema-img" style={{ backgroundImage: `url(${CINEMA_STILL})` }} aria-hidden="true" />
        <div className="gc-fl-cinema-caption" data-flr>
          <div className="gc-fl-eyebrow">
            <span className="gc-fl-dot" />
            THE CORE
          </div>
          <h2 className="gc-fl-display gc-fl-h2">Your context goes in. Half the tokens come out.</h2>
        </div>
      </section>

      {/* ── Zig row A: compression analytics ─────────────────────────────── */}
      <section className="gc-fl-zig" data-flr>
        <div className="gc-fl-zig-copy">
          <div className="gc-fl-eyebrow">
            <span className="gc-fl-dot" />
            COMPRESSION
          </div>
          <h2 className="gc-fl-display gc-fl-h2">Model vendors bill by the token. We shrink the bill.</h2>
          <p className="gc-fl-mono gc-fl-body">
            The engine builds a semantic skeleton of what you were about to
            send, keeps the meaning and drops the rest. Ratios below are
            measured and locked by tests, not marketing.
          </p>
        </div>
        <div className="gc-fl-zig-panel gc-fl-window">
          <div className="gc-fl-window-bar">
            <span className="gc-fl-tl" />
            <span className="gc-fl-tl" />
            <span className="gc-fl-tl" />
            <span className="gc-fl-window-title">tokens after compression, by content type</span>
          </div>
          <div className="gc-fl-ratio">
            {RATIO_ROWS.map(r => (
              <div key={r.label} className="gc-fl-ratio-row">
                <div className="gc-fl-mono gc-fl-ratio-label">{r.label}</div>
                <div className="gc-fl-ratio-bars">
                  <div className="gc-fl-ratio-before" />
                  <div className="gc-fl-ratio-after" style={{ width: `${r.after}%` }} />
                </div>
                <div className="gc-fl-mono gc-fl-ratio-note">{r.note}</div>
              </div>
            ))}
            <div className="gc-fl-mono gc-fl-panel-foot">gray = tokens sent today. orange = after gotcontext.</div>
          </div>
        </div>
      </section>

      {/* ── Zig row B: code intelligence (reversed) ──────────────────────── */}
      <section className="gc-fl-zig gc-fl-zig-rev" data-flr>
        <div className="gc-fl-zig-copy">
          <div className="gc-fl-eyebrow">
            <span className="gc-fl-dot" />
            CODE INTELLIGENCE
          </div>
          <h2 className="gc-fl-display gc-fl-h2">Point your agent at code. Get answers, not file dumps.</h2>
          <p className="gc-fl-mono gc-fl-body">
            Blast radius, callers, edit plans and 128 AST security rules run
            server side, so your agent reads one ranked answer instead of
            twenty raw files.
          </p>
        </div>
        <div className="gc-fl-zig-panel gc-fl-window">
          <div className="gc-fl-window-bar">
            <span className="gc-fl-tl" />
            <span className="gc-fl-tl" />
            <span className="gc-fl-tl" />
            <span className="gc-fl-window-title">gc_blast_radius, output shape from the live tool</span>
          </div>
          <pre className="gc-fl-mono gc-fl-tree">
            {`$ gc_blast_radius record_usage
├─ blast_radius_score   moderate
├─ caller_tree
│  ├─ routers/usage.py
│  ├─ mcp_gateway.py
│  └─ services/billing.py
├─ impacted tests        6 files
└─ graph_trust_summary   parser-backed`}
          </pre>
        </div>
      </section>

      {/* ── Zig row C: team memory ───────────────────────────────────────── */}
      <section className="gc-fl-zig" data-flr>
        <div className="gc-fl-zig-copy">
          <div className="gc-fl-eyebrow">
            <span className="gc-fl-dot" />
            TEAM MEMORY
          </div>
          <h2 className="gc-fl-display gc-fl-h2">A knowledge base your whole agent fleet shares.</h2>
          <p className="gc-fl-mono gc-fl-body">
            Agents write once and every agent reads compressed. Plans are
            versioned items with signed change proposals only a human owner can
            merge.
          </p>
        </div>
        <div className="gc-fl-zig-panel gc-fl-window">
          <div className="gc-fl-window-bar">
            <span className="gc-fl-tl" />
            <span className="gc-fl-tl" />
            <span className="gc-fl-tl" />
            <span className="gc-fl-window-title">knowledge base, plan proposals</span>
          </div>
          <div className="gc-fl-kb gc-fl-mono">
            <div className="gc-fl-kb-row gc-fl-kb-head">
              <span>item</span>
              <span>type</span>
              <span>state</span>
            </div>
            <div className="gc-fl-kb-row">
              <span>release-plan</span>
              <span>plan</span>
              <span className="gc-fl-kb-ok">v4 merged by owner</span>
            </div>
            <div className="gc-fl-kb-row">
              <span>api-conventions</span>
              <span>doc</span>
              <span>indexed, shared</span>
            </div>
            <div className="gc-fl-kb-row">
              <span>incident-notes</span>
              <span>doc</span>
              <span className="gc-fl-kb-warn">proposal pending review</span>
            </div>
            <div className="gc-fl-panel-foot">gc_kb_* and gc_plan_* tools, private by default.</div>
          </div>
        </div>
      </section>

      {/* ── Live terminal ────────────────────────────────────────────────── */}
      <section className="gc-fl-section" data-flr>
        <div className="gc-fl-eyebrow">
          <span className="gc-fl-dot" />
          LIVE DEMO
        </div>
        <h2 className="gc-fl-display gc-fl-h2">Watch it compress. This one is real.</h2>
        <div className="gc-fl-window gc-fl-term">
          <div className="gc-fl-window-bar">
            <span className="gc-fl-tl" />
            <span className="gc-fl-tl" />
            <span className="gc-fl-tl" />
            <span className="gc-fl-window-title">gotcontext -- live compression -- /v1/demo/compress</span>
          </div>
          <div className="gc-fl-term-body gc-fl-mono" role="log" aria-live="polite">
            {termLines.length === 0
              ? <div className="gc-fl-term-hint">press run. this fires a real request against the production API.</div>
              : termLines.map(l => <div key={l}>{l}</div>)}
            {termState === 'running' ? <div className="gc-fl-term-cursor">▮</div> : null}
          </div>
          <div className="gc-fl-term-foot gc-fl-mono">
            <button type="button" className="gc-fl-term-run" onClick={runTerminal} disabled={termState === 'running'}>
              {termState === 'done' ? '↻ RUN AGAIN' : termState === 'running' ? 'RUNNING...' : '▶ RUN LIVE DEMO'}
            </button>
            <span className="gc-fl-term-note">no key needed for the demo route</span>
          </div>
        </div>
      </section>

      {/* ── Enterprise grid ──────────────────────────────────────────────── */}
      <section className="gc-fl-section" data-flr>
        <div className="gc-fl-eyebrow">
          <span className="gc-fl-dot" />
          ENTERPRISE
        </div>
        <h2 className="gc-fl-display gc-fl-h2">Built for the enterprise from day one</h2>
        <div className="gc-fl-grid6">
          {ENTERPRISE_CARDS.map(c => (
            <div key={c.title} className="gc-fl-card gc-fl-card-flat">
              <div className="gc-fl-card-title gc-fl-mono">{c.title}</div>
              <p className="gc-fl-mono gc-fl-card-body">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Clients: contrast-inverted light section ─────────────────────── */}
      <section className="gc-fl-light" data-flr>
        <div className="gc-fl-light-inner">
          <div className="gc-fl-eyebrow gc-fl-eyebrow-ink">
            <span className="gc-fl-dot" />
            CLIENTS
          </div>
          <h2 className="gc-fl-display gc-fl-h2">For every agent stack that pays for context</h2>
          <div className="gc-fl-clients">
            {CLIENTS.map(c => (
              <div key={c.name} className="gc-fl-client">
                <div className="gc-fl-client-name">{c.name}</div>
                <div className="gc-fl-mono gc-fl-client-how">{c.how}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="gc-fl-final" data-flr>
        <h2 className="gc-fl-display gc-fl-h1">Ready to cut your token bill?</h2>
        <p className="gc-fl-mono gc-fl-sub">Start free with 23 MCP tools. Connect one URL. Keep your models.</p>
        <div className="gc-fl-ctas gc-fl-ctas-center">
          <Link className="gc-fl-btn gc-fl-btn-primary" href="/sign-up">GET A FREE API KEY</Link>
          <Link className="gc-fl-btn gc-fl-btn-ghost" href="/pricing">SEE PRICING →</Link>
        </div>
      </section>
    </div>
  );
}

export default FactoryLanding;
