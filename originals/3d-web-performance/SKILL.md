---
name: 3d-web-performance
title: 3D Web Performance Budget
description: Make Three.js / React Three Fiber / WebGL sites hit 60fps on mid-range phones — asset compression (Draco, Meshopt, KTX2), draw-call budgets, instancing, LOD, texture sizing, DPR capping, render-on-demand, lazy loading, adaptive quality tiers, and profiling. Use when building or reviewing any 3D website, when a 3D site is slow/janky, or before launching a WebGL experience.
license: MIT
category: 3d-webgl
---

# 3D Web Performance Budget

A beautiful 3D site that stutters is worse than no 3D at all. Treat performance as a design constraint from day one.

## The budget (per scene, mid-range phone target)

| Metric | Budget |
|--------|--------|
| Initial download (JS + assets before first frame) | ≤ 3–5 MB |
| Draw calls | ≤ 100 (mobile), ≤ 250 (desktop) |
| Triangles on screen | ≤ 300k mobile, ≤ 1.5M desktop |
| Textures | ≤ 1K mobile / 2K desktop, KTX2-compressed |
| Frame time | ≤ 16 ms (aim 10 ms to leave headroom for scroll/DOM) |
| DPR | `Math.min(devicePixelRatio, 1.5)` (2 for hero-only moments on desktop) |

## Asset pipeline

```bash
# geometry + textures in one pass (gltf-transform CLI)
npx @gltf-transform/cli optimize in.glb out.glb \
  --compress meshopt --texture-compress ktx2 --texture-size 2048 --simplify true
```
- Meshopt or Draco for geometry (Meshopt decodes faster; Draco smaller).
- KTX2: UASTC for normal maps, ETC1S for albedo/roughness. Set up `KTX2Loader` with the basis transcoder path.
- Bake lighting/AO into textures for static content. Merge static meshes by material.
- Split assets per chapter; preload chapter N+1 while the user is in chapter N.

## Runtime techniques

- **Instancing** (`InstancedMesh` / drei `<Instances>`) for anything repeated > 10 times.
- **LOD** (`THREE.LOD` / drei `<Detailed>`) for large hero meshes seen at distance.
- **Frustum + visibility culling**: set `object.visible = false` for chapters not on screen; `frustumCulled` stays true.
- **Render on demand** when static (R3F `frameloop="demand"` + `invalidate()`); pause the loop when `document.hidden`.
- **Adaptive quality**: measure average frame time for 60 frames after load → pick tier `high | medium | low` (DPR, shadows, post FX, particle counts). drei `<PerformanceMonitor>` does this in R3F.
- **Shadows**: bake them. If real-time, one directional light, `shadowMap.autoUpdate = false` and update only when things move.
- **Post FX**: merge effects into one pass; half-res bloom; skip SSAO on mobile.
- **Dispose** geometries/materials/textures when leaving a chapter or route (`renderer.info.memory` should plateau).
- **Main thread**: don't allocate in the render loop (reuse Vector3s), throttle DOM reads (`getBoundingClientRect`) to scroll/resize, move heavy work to workers (OffscreenCanvas where supported).

## Profiling workflow

1. `renderer.info.render.calls / triangles` overlay in dev (`?debug`).
2. Chrome Performance panel with 4× CPU throttle; Spector.js for a frame capture.
3. Test real devices: iPhone (Safari), mid-range Android (Chrome). Thermal throttling appears after ~2 minutes — test long sessions.
4. Lighthouse: keep LCP driven by HTML/poster, not by the canvas. Load three.js after first paint (dynamic import).

## Launch checklist

- [ ] Budget table met on a mid-range phone
- [ ] All GLBs optimized (gltf-transform report attached)
- [ ] Adaptive quality tiers + reduced-motion mode
- [ ] No per-frame allocations; memory stable after navigating all chapters
- [ ] Poster/fallback for no-WebGL; canvas not blocking LCP
