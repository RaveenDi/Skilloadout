---
name: cinematic-scroll-3d-website
title: Cinematic Scroll-Driven 3D Website
description: Build award-level, scroll-driven 3D websites (Three.js / React Three Fiber + GSAP ScrollTrigger + Lenis) where scrolling moves a camera through a designed world — fly-throughs, room walkthroughs, product reveals, and chapter-based storytelling. Use when the user wants a "3D website", "immersive landing page", "scroll storytelling", "camera fly-through", "Awwwards-style site", or anything that should feel like a film rather than a page.
license: MIT
category: 3d-webgl
---

# Cinematic Scroll-Driven 3D Website

This is the orchestrator skill. It turns a vague brief ("make a 3D site for my brand") into a
directed experience where **scroll is the timeline** and **the camera is the storyteller**.
Pair it with: `camera-flythrough-paths`, `room-walkthrough-3d`, `scroll-storytelling-director`,
`webgl-shader-effects`, `3d-web-performance`, and the official `gsap-scrolltrigger` skill.

## 0. Non-negotiables

1. **One master timeline.** Every scroll-reactive thing (camera, text, shaders, DOM) reads from a
   single normalized progress value `p ∈ [0,1]` (or per-chapter `p`). Never let five independent
   ScrollTriggers fight over the camera.
2. **Smooth, not laggy.** Lenis (or ScrollSmoother) for input smoothing; damp the *camera* toward
   its target (`lerp`/`damp`) instead of snapping to scroll. Never scrub > 1s behind the finger.
3. **60 fps on a mid-range phone** or it ships a reduced mode. See `3d-web-performance`.
4. **Accessible fallback.** `prefers-reduced-motion` → static hero + normal document flow; all
   copy exists as real HTML text (SEO + screen readers), never only inside the canvas.
5. **Direct it like a film.** Establishing shot → inciting detail → journey → climax → resolve (CTA).

## 1. Architecture (vanilla or R3F — same shape)

```
index.html
 ├─ <canvas id="gl">   position: fixed; inset: 0; z-index: 0   (the world)
 └─ <main id="story">  position: relative; z-index: 1          (scrollable chapters, real text)
      <section data-chapter="intro"   style="height:150vh">
      <section data-chapter="journey" style="height:300vh">
      <section data-chapter="reveal"  style="height:200vh">
      <section data-chapter="cta"     style="height:100vh">
```

- Chapters are tall DOM sections; their heights *are* the pacing. 100vh ≈ 1 beat.
- A `Director` maps scroll → `{ chapter, localProgress, globalProgress }` and drives:
  camera rig, material uniforms, DOM reveals, audio (optional).

### Vanilla Three.js + GSAP + Lenis skeleton

```js
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("#gl"), antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 500);

// Camera rail: position curve + look-at curve (see camera-flythrough-paths)
const rail = new THREE.CatmullRomCurve3([/* designed keyframe points */], false, "centripetal");
const look = new THREE.CatmullRomCurve3([/* matching look targets */], false, "centripetal");

const state = { p: 0, smoothP: 0 };
ScrollTrigger.create({
  trigger: "#story", start: "top top", end: "bottom bottom",
  onUpdate: (self) => (state.p = self.progress),
});

const tmpPos = new THREE.Vector3(), tmpLook = new THREE.Vector3();
renderer.setAnimationLoop((time) => {
  state.smoothP = THREE.MathUtils.damp(state.smoothP, state.p, 4, 1 / 60);
  rail.getPointAt(state.smoothP, tmpPos);
  look.getPointAt(state.smoothP, tmpLook);
  camera.position.copy(tmpPos);
  camera.lookAt(tmpLook);
  renderer.render(scene, camera);
});
```

### R3F equivalent

Use `@react-three/drei` `<ScrollControls pages={N} damping={0.2}>` + `useScroll()` inside a
`CameraRig` component, or keep Lenis+ScrollTrigger outside React and pass progress via a
ref/zustand store (preferred when DOM chapters must stay native & SEO-friendly).

## 2. Design the experience before code

Write a **shot list** first (put it in `docs/shotlist.md`):

| # | Chapter | Scroll % | Camera move | Subject | Text beat | Effect |
|---|---------|----------|-------------|---------|-----------|--------|
| 1 | Intro | 0–12 | slow push-in, slight dutch | hero object | Headline | fog lifts |
| 2 | Journey | 12–55 | fly through tunnel along spline | environment | 3 short claims | speed lines, FOV 45→60 |
| 3 | Reveal | 55–85 | orbit 180° around product | product | features pinned | material morph |
| 4 | CTA | 85–100 | pull back to wide | whole world | CTA button | bloom settles |

Camera grammar that reads as "premium":
- **Push-in** (dolly toward subject) = importance. **Pull-back** = context/resolution.
- **Orbit** = showcase. **Crane/descent** = entering a new world. **Truck** (sideways) = timeline/list.
- Change FOV subtly (40↔60) for speed; never rotate the horizon > 8° unless intentional.
- Ease *between* keyframes, but keep constant speed on long travel (use `getPointAt`, arc-length).

## 3. Signature moves (pick 2–3, don't use all)

- **Portal transition:** render scene B to a `WebGLRenderTarget`, show it on a plane/frame in scene A, fly the camera through it, swap scenes at the threshold.
- **Particle morph:** one `BufferGeometry` of N points with `positionA/positionB` attributes; a `uMorph` uniform tied to chapter progress morphs logo → product → text.
- **Room walkthrough:** baked-light GLB interior + camera rail at eye height (1.6m) + hotspots (see `room-walkthrough-3d`).
- **Scroll-scrubbed material:** wireframe → clay → full PBR as the user scrolls (blueprint-to-reality).
- **Split reality:** a shader wipe (noise-thresholded mask) between two versions of the same scene.
- **Depth typography:** real HTML headline masked with `mix-blend-mode` over the canvas, or SDF text (troika-three-text) placed in 3D along the camera path.

## 4. DOM ↔ 3D choreography

- Pin chapter text with ScrollTrigger (`pin: true, scrub: true`) while the camera travels.
- Reveal text by line (SplitText or CSS `clip-path`) with 60–120ms stagger; exit before the next beat enters.
- Keep text on the "quiet" side of the frame — compose the 3D shot so the subject sits on a third.
- Use `data-chapter` + a single `ScrollTrigger` per chapter that writes `localProgress` into the Director.

## 5. Build checklist

- [ ] Shot list approved; chapter heights reflect pacing
- [ ] Assets: GLB with Draco/Meshopt, textures KTX2, total < 8 MB initial (lazy-load later chapters)
- [ ] Loading screen that *is* part of the story (progress drives an intro animation)
- [ ] Master progress + damping; no competing ScrollTriggers on camera
- [ ] Resize + DPR cap + `ScrollTrigger.refresh()` after fonts/assets load
- [ ] Reduced motion + no-WebGL fallback; real HTML text for SEO
- [ ] Perf pass: < 150 draw calls, instancing, frustum culling, pause rendering when tab hidden
- [ ] Test on iOS Safari (address bar resize!) — use `lvh/svh` units and `ScrollTrigger.config({ ignoreMobileResize: true })`

## 6. Anti-patterns

- Camera snapping directly to `self.progress` (feels cheap) — always damp.
- Scroll-jacking that disables native scroll or breaks the back button.
- Giant uncompressed GLBs, 4K textures on mobile, `setPixelRatio(devicePixelRatio)` uncapped.
- Text baked into textures (unreadable, not indexable).
- Using every effect at once. Restraint is what makes it look expensive.
