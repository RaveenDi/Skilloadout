---
name: cesium-errors-rendering
description: >
  Use when a CesiumJS globe renders blank, black, white, or frozen, when the
  canvas shows nothing, when the WebGL context is lost, or when a render-loop
  error panel covers the canvas. Prevents the blank-globe trap caused by an
  unset CESIUM_BASE_URL, a missing or invalid Cesium ion token, or an omitted
  bundler asset-copy step. Covers the renderError event, WebGL context-loss
  recovery, the 16-context budget, and missing imagery or terrain.
  Keywords: blank globe, black screen, white screen, nothing renders, globe not
  showing, CESIUM_BASE_URL, CONTEXT_LOST_WEBGL, renderError, rethrowRenderErrors,
  Ion.defaultAccessToken, HTTP 401, webglcontextlost, too many active WebGL
  contexts, no imagery, no terrain, how do I fix a blank Cesium globe.
license: MIT
compatibility: "Designed for Claude Code. Requires CesiumJS 1.124+."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# CesiumJS Rendering Errors

## Overview

A CesiumJS rendering failure is a configuration or lifecycle fault, not a
CesiumJS bug. Failures take three shapes, and each shape has one root-cause
family:

1. The globe never appears (blank, black, or white at load) : static assets
   are unreachable, or the Cesium ion token is missing.
2. The globe appears and then dies (black or frozen mid-session) : the WebGL
   context was lost, or the per-tab context budget is exhausted.
3. An error panel covers the canvas : an exception was thrown inside
   `Scene.render`.

This skill maps every symptom to its single root cause and a deterministic fix.
ALWAYS diagnose from the browser Console before changing code.

## When to Use

Use this skill when:

- The CesiumJS canvas element exists but the globe is blank, black, or white.
- The Console shows HTTP 404 for `Workers/`, `Assets/`, or `Widgets/` files.
- The Network tab shows HTTP 401 from `api.cesium.com` or `assets.cesium.com`.
- The globe freezes or turns black mid-session with `CONTEXT_LOST_WEBGL`.
- The Console reports `Too many active WebGL contexts`.
- An "An error occurred while rendering" panel appears over the canvas.
- The globe renders but has no map imagery, or no terrain relief.

Do NOT use this skill when:

- A 3D Tileset fails with CORS, 401, 403, or 404 : use `cesium-errors-tileset`.
- Memory grows over time or `destroy()` ordering is wrong : use
  `cesium-errors-memory`.
- Positions are `NaN` or geometry sits off the globe : use
  `cesium-errors-coordinates`.

## Step Zero : Read the Console

ALWAYS open browser devtools and read the Console and Network tabs BEFORE
editing code. The console signal names the root cause. Guessing wastes time and
hides the real fault.

| Console or Network signal | Root cause | Error |
|---------------------------|------------|-------|
| 404 for `Workers/*.js`, `Assets/*`, `Widgets/widgets.css` (dev and prod) | `CESIUM_BASE_URL` unset or wrong | E1 |
| 404 for those files in the production build only | bundler did not copy the static directories | E2 |
| 401 from `api.cesium.com` or `assets.cesium.com` | Cesium ion token missing or invalid | E3 |
| `WebGL: CONTEXT_LOST_WEBGL` | the GPU dropped the rendering context | E4 |
| `Too many active WebGL contexts` | the 16-context per-tab budget is exhausted | E5 |
| error panel plus a thrown exception in `render` | an exception inside `Scene.render` | E6 |
| no 4xx, globe is a flat solid color | no imagery layer is attached | E7 |
| no 4xx, globe surface is a smooth ellipsoid | no terrain provider is set | E8 |

## Quick Reference : The 8 Rendering Errors

| ID | Symptom | One-line fix |
|----|---------|--------------|
| E1 | Blank globe, 404 for `Workers/`/`Assets/`/`Widgets/` | Set `window.CESIUM_BASE_URL` before importing `cesium`. |
| E2 | Blank globe in production only | Add the bundler plugin that copies the four static directories. |
| E3 | Black globe, HTTP 401 from `*.cesium.com` | Set `Cesium.Ion.defaultAccessToken` before constructing the `Viewer`. |
| E4 | Globe freezes or blacks out, `CONTEXT_LOST_WEBGL` | Handle `webglcontextlost`, then recreate the `Viewer` on restore. |
| E5 | New globe stops appearing, `Too many active WebGL contexts` | Call `viewer.destroy()` on teardown; reuse one `Viewer`. |
| E6 | "An error occurred while rendering" panel | Subscribe to `scene.renderError`; remove the offending primitive. |
| E7 | Globe is a flat solid color, no map tiles | Attach an imagery layer; subscribe to `imageryLayer.errorEvent`. |
| E8 | Globe surface has no elevation relief | Pass `terrain` to the `Viewer` constructor. |

Full entries with symptom, root cause, prevention, and recovery are in
`references/anti-patterns.md`.

## Decision Tree : Blank or Black Globe

```
Globe never appeared (blank, black, or white at load)
├─ Console: 404 for Workers/ Assets/ Widgets/
│   ├─ 404 in dev AND prod      -> E1  CESIUM_BASE_URL unset or wrong
│   └─ 404 in prod build only   -> E2  bundler asset-copy omitted
├─ Network: 401 from *.cesium.com -> E3  ion token missing or invalid
└─ No 404, no 401
    ├─ globe is a flat solid color    -> E7  no imagery layer
    └─ globe surface is a smooth ball -> E8  no terrain provider

Globe appeared, then died (black or frozen mid-session)
├─ Console: CONTEXT_LOST_WEBGL              -> E4  WebGL context lost
└─ Console: Too many active WebGL contexts  -> E5  context budget exhausted

Error panel covers the canvas
└─ "An error occurred while rendering"      -> E6  exception in Scene.render
```

## Correct Bootstrap Sequence

The order is fixed. A correct CesiumJS start ALWAYS runs these steps in this
sequence:

1. Set `window.CESIUM_BASE_URL`, OR let the bundler plugin define it, BEFORE
   importing `cesium`.
2. Import `cesium`.
3. Set `Cesium.Ion.defaultAccessToken`, only when an ion asset is used.
4. Construct `new Cesium.Viewer(container, options)`.
5. `await` async factories (terrain, tilesets, imagery) inside `try/catch`.
6. Add data sources, then move the camera.

```js
// main.js
window.CESIUM_BASE_URL = "/cesium/"; // step 1 : before the import

import * as Cesium from "cesium";    // step 2
import "cesium/Build/Cesium/Widgets/widgets.css";

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN; // step 3

const viewer = new Cesium.Viewer("cesiumContainer", {  // step 4
  terrain: Cesium.Terrain.fromWorldTerrain(),
});
```

Skipping step 1 or step 3 is the dominant cause of a blank globe. The full
verified example is in `references/examples.md`.

## Context Loss : Recovery Is Recreation

CesiumJS does NOT restore GPU resources after a lost WebGL context. The
recovery path is recreation, not repair:

1. Listen for `webglcontextlost` on `viewer.scene.canvas` and call
   `event.preventDefault()` so the browser keeps the canvas restorable.
2. On `webglcontextrestored`, call `viewer.destroy()` on the dead viewer and
   construct a fresh `Viewer`.

Reducing GPU load (lower `maximumScreenSpaceError`, lower `cacheBytes`, lower
`resolutionScale`) prevents the loss on memory-constrained devices. See
`references/examples.md` for the handler.

## ALWAYS / NEVER

- ALWAYS set `window.CESIUM_BASE_URL`, or define it through the bundler plugin,
  before the `cesium` import resolves. CesiumJS fetches Web Workers, assets, and
  widget CSS from that URL at runtime.
- ALWAYS set `Cesium.Ion.defaultAccessToken` before constructing a `Viewer`
  that uses any ion asset (World Terrain, OSM Buildings, ion imagery).
- ALWAYS pass `baseLayer: false` when the application has no ion token, then
  supply a non-ion imagery provider. NEVER leave the default ion base layer in
  place without a valid token.
- ALWAYS call `viewer.destroy()` when a `Viewer` leaves the page. NEVER create
  a `Viewer` per route or per component without destroying the previous one.
- ALWAYS subscribe to `scene.renderError` so a render-loop exception is logged
  instead of silently producing a frozen frame.
- ALWAYS call `event.preventDefault()` inside the `webglcontextlost` handler.
- NEVER assume `viewer.destroy()` frees the WebGL context immediately; the
  browser caps live contexts near 16 per tab. Reuse one `Viewer` where the app
  allows it.
- NEVER reference a WebGPU rendering path. CesiumJS renders exclusively on
  WebGL2 through the 1.142 line.
- NEVER use `readyPromise`, `.ready`, `new Cesium3DTileset({url})`,
  `ModelExperimental`, or `defaultValue()`. They were removed; use the async
  factories and the `??` operator.

## Common Mistakes

| Mistake | Consequence | Correct approach |
|---------|-------------|------------------|
| Setting `window.CESIUM_BASE_URL` after the `cesium` import | Workers and assets 404, blank globe | Set it on the first line, before any import |
| Relying on the dev server while shipping a build with no asset-copy plugin | Globe works in dev, blank in production | Add `vite-plugin-cesium` or `CopyWebpackPlugin` |
| Pasting a Sandcastle demo token into production | 401 once the demo token rotates | Use an account token from `cesium.com/ion` |
| Mounting a new `Viewer` on every route change | Context budget exhausted after ~16 mounts | Destroy on unmount or reuse a single `Viewer` |
| Treating a lost context as recoverable in place | Frozen black globe stays frozen | Destroy the viewer and build a new one |
| Adding a primitive with a `NaN` position | Exception inside `Scene.render`, error panel | Validate positions before adding; see `cesium-errors-coordinates` |

## Reference Files

- `references/methods.md` : verified APIs for diagnosis and recovery
  (`CESIUM_BASE_URL`, `Ion.defaultAccessToken`, `Scene.renderError`,
  `rethrowRenderErrors`, `errorEvent`, `Terrain.fromWorldTerrain`, build plugins).
- `references/examples.md` : verified working code (correct bootstrap, render
  error handler, context-loss recovery, Vite and webpack config, imagery and
  terrain fallback, single-viewer reuse).
- `references/anti-patterns.md` : the 8 rendering errors, each with symptom,
  root cause, prevention, and recovery.
