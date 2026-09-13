---
name: cesium-agents-skill-validator
description: >
  Use when CesiumJS code has just been generated or reviewed and must be
  checked before it is called done, to catch deprecated APIs and common
  defects, or when auditing CesiumJS code from an older source. Detects the removed synchronous
  patterns (readyPromise, the url constructor option, ModelExperimental,
  defaultValue, new on a Cartesian factory), WebGPU assumptions, missing ion
  tokens, missing destroy() calls, and coordinate-type mistakes. Runs a
  deterministic checklist and routes each failure to the skill that fixes it.
  Keywords: validate CesiumJS code, review Cesium code, is this Cesium code
  correct, deprecated CesiumJS API, readyPromise, ModelExperimental,
  defaultValue removed, check before commit, CesiumJS code quality, lint Cesium,
  did I use the right API, audit Cesium scene, why might this code fail.
license: MIT
compatibility: "Designed for Claude Code. Requires CesiumJS 1.124+."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Cesium Agents : Skill Validator

## Overview

This is a validation skill. Run it over any CesiumJS code before declaring it
finished. It is a deterministic checklist: each check has a grep-style trigger,
a verdict, and the skill that holds the fix. The checklist targets CesiumJS
1.124+, where a large set of pre-2023 APIs no longer exist.

CesiumJS 1.124+ is WebGL2 only. Any code that names or assumes WebGL is fine;
any code that names or assumes WebGPU for CesiumJS is wrong.

## When to Use

- A CesiumJS snippet was just generated and is about to be presented or
  committed.
- Reviewing CesiumJS code from an older tutorial, blog post, or Sandcastle.
- A scene "should work" but renders blank, throws, or leaks, and a structured
  pass is needed.

## Check 1 : Removed Async-Era APIs (BLOCKER)

Each token below was removed before or within the 1.124 to 1.142 window. Any
match is a hard failure. Verdict: REJECT until fixed.

| Found token | Status | Required replacement | Fix skill |
|-------------|--------|----------------------|-----------|
| `new Cesium3DTileset(` | removed 1.107 | `await Cesium3DTileset.fromUrl(url)` / `.fromIonAssetId(id)` | `cesium-syntax-3d-tiles` |
| `.readyPromise` | removed 1.107 | `await` the async factory | `cesium-core-versioning` |
| `.ready` on a tileset/model/provider | removed 1.107 | the awaited result is ready | `cesium-core-versioning` |
| `Model.fromGltf(` (without `Async`) | removed | `Model.fromGltfAsync(` | `cesium-syntax-gltf-model` |
| `ModelExperimental` | removed (merged into `Model`) | `Model` | `cesium-syntax-gltf-model` |
| `new CesiumTerrainProvider({` | removed 1.107 | `await CesiumTerrainProvider.fromUrl(url)` | `cesium-syntax-terrain` |
| `createWorldTerrain(` (without `Async`) | removed 1.107 | `createWorldTerrainAsync(` | `cesium-syntax-terrain` |
| `defaultValue(` | removed 1.134 | `a ?? b` | `cesium-core-versioning` |
| `new Cesium.Cartesian3.fromDegrees` | throws since 1.139 | drop `new` | `cesium-core-coordinates` |
| `terrainExaggeration` on `Globe` | removed 1.113 | `scene.verticalExaggeration` | `cesium-core-versioning` |

## Check 2 : WebGPU Assumption (BLOCKER)

- Trigger: any reference to a WebGPU backend, context, or toggle for CesiumJS.
- Verdict: REJECT. CesiumJS renders only on WebGL2 in 1.124+.
- Fix skill: `cesium-core-architecture`.

## Check 3 : Missing ion Token (BLOCKER if ion used)

- Trigger: code uses `fromIonAssetId`, `IonImageryProvider`, world imagery,
  world terrain, or OSM Buildings, but never sets `Ion.defaultAccessToken`.
- Verdict: REJECT. The scene will 401 and the globe will be blank.
- Fix skill: `cesium-syntax-viewer`, `cesium-impl-cesium-ion`.

## Check 4 : Async Factory Not Awaited (BLOCKER)

- Trigger: a `from*` factory (`fromUrl`, `fromIonAssetId`, `fromGltfAsync`,
  `fromProviderAsync`) whose result is used without `await`.
- Verdict: REJECT. The variable holds a `Promise`, not the object;
  `scene.primitives.add` and property access fail.
- Fix skill: `cesium-core-versioning`, `cesium-syntax-3d-tiles`.

## Check 5 : Missing Teardown (WARN)

- Trigger: a `Viewer`, `Cesium3DTileset`, `Model`, custom `Primitive`, or
  `ScreenSpaceEventHandler` is created with no `destroy()` on any cleanup path;
  or an `addEventListener` on a CesiumJS `Event` with no stored remover.
- Verdict: WARN. Acceptable for a one-shot script, a defect for an app.
- Fix skill: `cesium-core-memory`, `cesium-errors-memory`.

## Check 6 : Coordinate Type and Unit (BLOCKER)

- Trigger: `new Cartographic(` with degree-magnitude numbers; a `Cartographic`
  assigned to `entity.position`; a factory called as `(latitude, longitude)`;
  degrees passed to `new HeadingPitchRoll`.
- Verdict: REJECT. The geometry will be misplaced or absent.
- Fix skill: `cesium-errors-coordinates`, `cesium-core-coordinates`.

## Check 7 : API Name Verification (BLOCKER)

- Trigger: any CesiumJS class, method, or enum value not confirmed against the
  API reference.
- Verdict: REJECT until verified. Hallucinated API names are the highest-risk
  defect in generated code.
- Action: WebFetch the name against
  `https://cesium.com/learn/cesiumjs/ref-doc/` (the SOURCES.md primary source).
  If it does not exist, the code is wrong.

## Check 8 : Continuous Render on a Static Scene (WARN)

- Trigger: a static or rarely-changing scene with no `requestRenderMode: true`.
- Verdict: WARN. Not a defect, but a battery and GPU cost.
- Fix skill: `cesium-core-performance`.

## Verdict Rule

- Any BLOCKER unresolved : REJECT the code. Do not present it as done.
- Only WARN items : ACCEPT with the warnings stated to the user.
- All checks clear : ACCEPT.

NEVER report CesiumJS code as complete while a Check 1 to 4, 6, or 7 failure
stands.

## Quick Scan Order

Run Check 1, 2, 3, 4 first; they are the fastest to grep and the most common.
Then Check 6 and 7. Check 5 and 8 last; they are WARN-level.

## Reference Files

- `references/methods.md` : every check as a grep-ready pattern with verdict
  and fix skill.
- `references/examples.md` : worked validations of three code snippets, one
  rejected and rewritten, one warned, one accepted.
- `references/anti-patterns.md` : the failure modes of validation itself, such
  as trusting a plausible but hallucinated API name.

## Related Skills

- `cesium-core-versioning` : the full removed-API migration detail.
- `cesium-core-architecture` : the WebGL2-only fact.
- `cesium-errors-coordinates` : coordinate type and unit failures.
- `cesium-core-memory` : teardown requirements.
- `cesium-agents-scene-architect` : the setup decisions this validator checks.

## Sources

Built on the project research base (`docs/research/vooronderzoek-cesium.md`)
and the verified `CHANGES.md` matrix, against the CesiumJS API Reference on the
approved sources, 2026-05-20.
