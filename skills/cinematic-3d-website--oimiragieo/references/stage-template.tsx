'use client';

/**
 * stage-template.tsx (reference, verbatim from the shipped production build).
 *
 * The scaffold around the WebGL engine: manual pin, weighted-leg scroll
 * pacing, copy beats, scroll-driven exit handoff, display typeface, phone
 * gyro fallback, and the opt-in ambient-sound toggle.
 *
 * ADAPT POINTS when reusing on another site:
 *   - FRAMES / DEPTHS / BEATS: your assets and copy.
 *   - LEG_WEIGHTS: scroll distance per journey leg (hero and payoff long,
 *     transit legs short). journeyProgress() keeps f(0)=0 and f(1)=1 so
 *     reverse scrubbing stays exact.
 *   - demoCompress / SAMPLE_DOCUMENT: swap for YOUR real API call; the
 *     in-scene terminal demo must show an honest product action.
 *   - localFont src: your display face (self-host; see SKILL.md Phase 4b).
 *   - CSS classes map to engine.css; color tokens come from your system.
 *
 * MOBILE / a11y: HARD static fallback (single hero frame + stacked copy),
 * with DeviceOrientation gyro parallax where motion is allowed.
 */

import dynamic from 'next/dynamic';
import localFont from 'next/font/local';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { demoCompress } from '@/libs/gotcontext-api';
import { SAMPLE_DOCUMENT } from '@/libs/sample-document';
import { createCinematicSound } from './cinematic-sound';

// Display face for the cinematic only (self-hosted, ITF Free Font License —
// see ./fonts/README.md). Exposed as --font-cine; aura.css applies it to the
// beat titles and the preloader wordmark under this stage's scope.
const clashDisplay = localFont({
  src: './fonts/ClashDisplay-Semibold.woff2',
  weight: '600',
  display: 'swap',
  variable: '--font-cine',
});

const DepthFlyCanvas = dynamic(() => import('./depth-fly-engine'), { ssr: false });

const FRAMES = [
  '/cinematic/frame1.webp',
  '/cinematic/frame2.webp',
  '/cinematic/frame3.webp',
  '/cinematic/frame4.webp',
  '/cinematic/frame5.webp',
];
const DEPTHS = [
  '/cinematic/depth1.webp',
  '/cinematic/depth2.webp',
  '/cinematic/depth3.webp',
  '/cinematic/depth4.webp',
  '/cinematic/depth5.webp',
];
const N = FRAMES.length;

// Per-leg scroll weights + linger remap (scroll-world pacing law). Hero and
// payoff legs get more scroll distance than the transit legs; within a leg the
// smoothstep lingers at both beat centers (zero slope) and accelerates through
// the seam. f(0)=0 and f(1)=1 hold, monotonic, so reverse scrubbing is exact.
const LEG_WEIGHTS = [1.3, 0.9, 0.95, 1.25];
const LEG_TOTAL = LEG_WEIGHTS.reduce((a, b) => a + b, 0);

function journeyProgress(raw: number): number {
  const x = Math.min(Math.max(raw, 0), 1);
  let start = 0;
  for (let k = 0; k < LEG_WEIGHTS.length; k += 1) {
    const w = LEG_WEIGHTS[k]! / LEG_TOTAL;
    if (x <= start + w || k === LEG_WEIGHTS.length - 1) {
      const local = Math.min(1, Math.max(0, (x - start) / w));
      const s = local * local * (3 - 2 * local);
      return (k + s) / LEG_WEIGHTS.length;
    }
    start += w;
  }
  return 1;
}

type Beat = { eyebrow: string; title: string; sub: string; stat?: string; cta?: boolean };
const BEATS: Beat[] = [
  { eyebrow: 'The context engine', title: 'This is your context.', sub: 'Every doc, every file, every token, sent to the model on every single call.' },
  { eyebrow: 'Compression core', title: 'We pull it into the core.', sub: 'Semantic compression runs on every request, before your tokens ever leave.' },
  { eyebrow: 'Compression', title: 'And compress it.', sub: 'Same meaning, about half the tokens, on the context you were already sending.', stat: '≈2× more calls per budget' },
  { eyebrow: 'One gateway', title: 'Every tool. One bearer token.', sub: 'Compression, code intelligence, security scanning and knowledge, over REST and MCP.' },
  { eyebrow: 'The payoff', title: '~50% fewer tokens.', sub: 'On the context you already send. No quality loss. Point your agent and go.', cta: true },
];

function prefersMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) {
    return false;
  }
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.matchMedia('(max-width: 899px)').matches;
  return !(coarse && narrow);
}

function readToken(name: string, fallback: string): string {
  if (typeof window === 'undefined' || !document.documentElement) {
    return fallback;
  }
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function StaticFallback() {
  // Phone gyro parallax. The hero frame drifts gently with
  // device tilt so the phone fallback still feels cinematic without WebGL.
  // Respects prefers-reduced-motion; on iOS 13+ the sensor needs a
  // user-gesture permission request, so we bind on the first tap and stay
  // static if the user declines. Desktop (no sensor events) is unaffected.
  const bgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const bg = bgRef.current;
    if (!bg) {
      return;
    }

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let running = false;

    const onOrient = (e: DeviceOrientationEvent) => {
      // gamma = left/right tilt; beta = front/back, ~45° at a natural hold.
      const g = Math.max(-30, Math.min(30, e.gamma ?? 0));
      const b = Math.max(-30, Math.min(30, (e.beta ?? 45) - 45));
      tx = (g / 30) * -14;
      ty = (b / 30) * -10;
    };
    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      bg.style.transform = `scale(1.12) translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    const bind = () => {
      if (running) {
        return;
      }
      running = true;
      window.addEventListener('deviceorientation', onOrient, { passive: true });
      raf = requestAnimationFrame(tick);
    };

    const doe = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    const needsGesture = typeof doe.requestPermission === 'function';
    const onFirstTap = () => {
      window.removeEventListener('touchend', onFirstTap);
      window.removeEventListener('click', onFirstTap);
      doe.requestPermission!()
        .then((state) => {
          if (state === 'granted') {
            bind();
          }
        })
        .catch(() => { /* declined or unavailable — stay static */ });
    };
    if (needsGesture) {
      window.addEventListener('touchend', onFirstTap, { passive: true });
      window.addEventListener('click', onFirstTap);
    } else {
      bind();
    }

    return () => {
      window.removeEventListener('deviceorientation', onOrient);
      if (needsGesture) {
        window.removeEventListener('touchend', onFirstTap);
        window.removeEventListener('click', onFirstTap);
      }
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`gc-film-static ${clashDisplay.variable}`}>
      <div ref={bgRef} className="gc-film-static-bg" style={{ backgroundImage: `url(${FRAMES[0]})` }} aria-hidden="true" />
      <div className="gc-film-static-inner">
        <div className="gc-cine-eyebrow">The compression engine</div>
        <h1 className="gc-cine-title">Compress everything. One bearer token.</h1>
        <p className="gc-cine-sub">
          Semantic compression for every LLM call, over REST and MCP. Point your
          agent at the gateway and cut the tokens on the context you already send.
        </p>
        <div className="gc-cine-cta">
          <Link className="gc-cine-btn gc-cine-btn-primary" href="/sign-up">Get a free API key</Link>
          <Link className="gc-cine-btn gc-cine-btn-ghost" href="/docs">Read the docs</Link>
        </div>
      </div>
    </div>
  );
}

export function DepthFlyStage() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const beatNodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const cueRef = useRef<HTMLDivElement | null>(null);
  const handoffRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const [animate, setAnimate] = useState<boolean | null>(null);
  // Opt-in ambient audio. Instance built lazily inside the toggle
  // gesture (autoplay-policy safe); nothing exists until the user asks.
  const soundRef = useRef<ReturnType<typeof createCinematicSound> | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  const toggleSound = useCallback(() => {
    soundRef.current ??= createCinematicSound();
    setSoundOn(soundRef.current.toggle());
  }, []);

  useEffect(() => {
    return () => {
      soundRef.current?.dispose();
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    setAnimate(prefersMotion());
  }, []);

  const colors = useMemo(() => {
    const cool = readToken('--accent-cyan', '#33d2ff');
    const emberTriplet = readToken('--cinematic-ember', '255, 138, 76');
    return { cool, hot: `rgb(${emberTriplet})` };
  }, []);

  // LIVE demo for the in-scene terminal: a REAL /v1/demo/compress run on the
  // shared ~5,000-char sample doc — the typed result is genuine, not scripted.
  const runDemo = useCallback(async () => {
    const r = await demoCompress(SAMPLE_DOCUMENT);
    return {
      original_tokens: r.original_tokens,
      compressed_tokens: r.compressed_tokens,
      savings_pct: r.savings_pct,
    };
  }, []);

  const onScroll = useCallback(() => {
    const el = wrapRef.current;
    if (!el) {
      return;
    }
    const vh = window.innerHeight;
    const rect = el.getBoundingClientRect();
    const total = el.offsetHeight - vh;
    const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
    const p = journeyProgress(total > 0 ? scrolled / total : 0);
    progressRef.current = p;

    const pin = pinRef.current;
    if (pin) {
      if (rect.top > 0) {
        pin.style.position = 'absolute';
        pin.style.top = '0';
        pin.style.bottom = 'auto';
      } else if (rect.bottom < vh) {
        pin.style.position = 'absolute';
        pin.style.top = 'auto';
        pin.style.bottom = '0';
      } else {
        pin.style.position = 'fixed';
        pin.style.top = '0';
        pin.style.bottom = 'auto';
      }
    }
    const step = 1 / (N - 1);
    for (let i = 0; i < N; i += 1) {
      const node = beatNodesRef.current[i];
      if (node) {
        // Half-width < 0.5*step so adjacent beats' text can never overlap — at
        // the midpoint between two beats both are fully faded (clean hand-off).
        node.style.opacity = String(Math.max(0, 1 - Math.abs(p - i * step) / (step * 0.42)));
      }
    }
    if (cueRef.current) {
      cueRef.current.style.opacity = String(Math.max(0, 1 - p * 8));
    }
    if (handoffRef.current) {
      // Exit glow fades in over the final leg only (p 0.8 → 1.0, smoothstep).
      const t = Math.min(1, Math.max(0, (p - 0.8) / 0.2));
      handoffRef.current.style.opacity = String(t * t * (3 - 2 * t));
    }
    soundRef.current?.setProgress(p);
  }, []);

  useEffect(() => {
    if (!animate) {
      return;
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [animate, onScroll]);

  if (animate !== true) {
    return <StaticFallback />;
  }

  return (
    <div ref={wrapRef} className={`gc-film-wrap ${clashDisplay.variable}`}>
      <div ref={pinRef} className="gc-film-pin">
        <h1 className="sr-only">The gotcontext compression engine: compress everything, one bearer token.</h1>
        <div className="gc-film-frame gc-depth-canvas" style={{ opacity: 1, transform: 'none' }}>
          <DepthFlyCanvas progressRef={progressRef} frames={FRAMES} depths={DEPTHS} cool={colors.cool} hot={colors.hot} runDemo={runDemo} />
        </div>
        <div className="gc-film-vignette" aria-hidden="true" />
        {BEATS.map((b, i) => (
          <div
            key={b.title}
            ref={(node) => {
              beatNodesRef.current[i] = node;
            }}
            className={`gc-film-beat${i === 0 ? ' gc-film-beat-first' : ''}`}
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            <div className="gc-film-card">
              <div className="gc-cine-eyebrow">{b.eyebrow}</div>
              <h2 className="gc-cine-title gc-film-title">{b.title}</h2>
              <p className="gc-cine-sub">{b.sub}</p>
              {b.stat ? <div className="gc-srv-stat">{b.stat}</div> : null}
              {b.cta
                ? (
                    <div className="gc-cine-cta">
                      <Link className="gc-cine-btn gc-cine-btn-primary" href="/sign-up">Get a free API key</Link>
                      <Link className="gc-cine-btn gc-cine-btn-ghost" href="/docs">Read the docs</Link>
                    </div>
                  )
                : null}
            </div>
          </div>
        ))}
        <div ref={cueRef} className="gc-cine-scrollcue" aria-hidden="true">Scroll to fly in</div>
        <div ref={handoffRef} className="gc-cine-handoff" aria-hidden="true" />
        <button
          type="button"
          className={`gc-cine-sound${soundOn ? ' is-on' : ''}`}
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Mute ambient sound' : 'Enable ambient sound'}
          title={soundOn ? 'Mute ambient sound' : 'Enable ambient sound'}
        >
          {soundOn ? '◉ sound on' : '○ sound'}
        </button>
      </div>
    </div>
  );
}

export default DepthFlyStage;
