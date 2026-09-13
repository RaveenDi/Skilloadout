---
name: r3f-scroll-scenes
title: React Three Fiber Scroll Scenes
description: Production patterns for scroll-driven 3D in React / Next.js with React Three Fiber and drei — ScrollControls vs. native-scroll + GSAP bridge, a zustand scroll store, per-section scenes, HTML overlays, suspense-loaded GLBs, adaptive performance, and SSR-safe setup. Use when building a 3D scroll experience in React or Next.js, or porting a vanilla Three.js scroll site to R3F.
license: MIT
category: 3d-webgl
---

# React Three Fiber Scroll Scenes

## Pick the scroll architecture

| Option | When | Trade-off |
|--------|------|-----------|
| **A. drei `<ScrollControls>`** | Canvas-first experiences, few DOM sections | Scroll lives inside the canvas container; DOM content goes in `<Scroll html>` — weaker SEO/a11y |
| **B. Native scroll + store (recommended for sites)** | Marketing sites, Next.js pages, real HTML content | Fixed canvas behind the page; Lenis + ScrollTrigger write progress into a store that `useFrame` reads |

### Option B: the bridge

```tsx
// scroll-store.ts
import { create } from "zustand";
export const useScrollStore = create<{ progress: number; chapter: number; local: number }>(() => ({ progress: 0, chapter: 0, local: 0 }));

// SmoothScroll.tsx  ("use client")
useEffect(() => {
  const lenis = new Lenis({ lerp: 0.09 });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (t: number) => lenis.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  const st = ScrollTrigger.create({
    trigger: document.documentElement, start: 0, end: "max",
    onUpdate: (s) => useScrollStore.setState({ progress: s.progress }),
  });
  return () => { st.kill(); gsap.ticker.remove(tick); lenis.destroy(); };
}, []);
```

```tsx
// Experience.tsx — read the store without re-rendering React every frame
function CameraRig({ rail }: { rail: CameraRail }) {
  const smooth = useRef(0);
  useFrame(({ camera }, dt) => {
    const p = useScrollStore.getState().progress;   // transient read, no subscription
    smooth.current = THREE.MathUtils.damp(smooth.current, p, 4, dt);
    rail.apply(camera, smooth.current);
  });
  return null;
}
```

**Never** `useState` for per-frame values — use refs and `getState()` (transient updates).

### Layout (Next.js App Router)

```tsx
// app/page.tsx (server) renders real sections; the canvas is a client island
<>
  <FixedCanvas />            {/* "use client", dynamic(() => import(...), { ssr: false }) */}
  <main className="relative z-10">
    <section data-chapter="intro" className="h-[150svh]">…real text…</section>
    …
  </main>
</>
```

```tsx
// FixedCanvas.tsx
<Canvas
  className="!fixed inset-0 -z-0"
  dpr={[1, 1.5]}
  gl={{ antialias: true, powerPreference: "high-performance" }}
  camera={{ fov: 45, near: 0.1, far: 300 }}
>
  <Suspense fallback={null}>
    <Scene />
    <Preload all />
  </Suspense>
  <PerformanceMonitor onDecline={() => setDpr(1)} />
  <AdaptiveDpr pixelated />
</Canvas>
```

## Per-chapter scenes

- Each chapter component receives `local` progress (0–1 within its chapter) derived from the store.
- Mount/unmount chapter groups by proximity (current ±1) to save GPU; keep assets cached with `useGLTF.preload`.
- Animate with `useFrame` + damping, or build a paused GSAP timeline per chapter and set `tl.progress(local)` in `useFrame` (great for complex choreography authored in GSAP).

```tsx
function Chapter({ index, children }: { index: number; children: (local: number) => void }) {
  const group = useRef<THREE.Group>(null!);
  useFrame(() => {
    const { progress } = useScrollStore.getState();
    const local = THREE.MathUtils.clamp(progress * CHAPTERS - index, 0, 1);
    group.current.visible = local > 0 && local < 1 || index === 0;
  });
  return <group ref={group}>{/* … */}</group>;
}
```

## Assets & materials

- `useGLTF(url, true /* draco */)`, KTX2 via `useKTX2`; run `npx gltfjsx model.glb --transform` to get a typed, optimized component.
- Environment: drei `<Environment preset="city" />` or a custom HDRI at low resolution; bake what you can.
- Text in 3D: drei `<Text>` (troika) with a real font file; keep headings in DOM when SEO matters.

## Gotchas

- SSR: never import three in server components; wrap the canvas in `dynamic(..., { ssr: false })`.
- Hydration + ScrollTrigger: create triggers in `useLayoutEffect`/`useGSAP` after mount, `ScrollTrigger.refresh()` after fonts & GLBs load.
- Route changes: kill triggers, destroy Lenis, and dispose GPU resources on unmount.
- iOS: use `svh` units and `ScrollTrigger.config({ ignoreMobileResize: true })`.
- Strict mode double effects: make setup idempotent (return cleanups).

Pair with: `camera-flythrough-paths` (CameraRail), `webgl-shader-effects`, `3d-web-performance`, `gsap-react` (official GSAP skill).
