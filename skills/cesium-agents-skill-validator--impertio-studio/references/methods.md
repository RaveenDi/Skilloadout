# Validator Check Reference

Every check as a grep-ready pattern, verdict, and fix skill. Patterns are
regular expressions for a quick scan of CesiumJS code. Verified against the
project research base and `CHANGES.md` on 2026-05-20. Target version 1.124+.

## Check 1 : Removed async-era APIs (BLOCKER)

| Pattern | Status | Replacement | Fix skill |
|---------|--------|-------------|-----------|
| `new\s+(Cesium\.)?Cesium3DTileset\s*\(` | removed 1.107 | `await Cesium3DTileset.fromUrl(...)` | `cesium-syntax-3d-tiles` |
| `\.readyPromise` | removed 1.107 | `await` the factory | `cesium-core-versioning` |
| `\.ready\b` (on tileset/model/provider) | removed 1.107 | awaited result is ready | `cesium-core-versioning` |
| `\.fromGltf\b` (not `fromGltfAsync`) | removed | `Model.fromGltfAsync(...)` | `cesium-syntax-gltf-model` |
| `ModelExperimental` | removed | `Model` | `cesium-syntax-gltf-model` |
| `new\s+(Cesium\.)?CesiumTerrainProvider\s*\(` | removed 1.107 | `await CesiumTerrainProvider.fromUrl(...)` | `cesium-syntax-terrain` |
| `createWorldTerrain\s*\(` (not `Async`) | removed 1.107 | `createWorldTerrainAsync(...)` | `cesium-syntax-terrain` |
| `defaultValue\s*\(` | removed 1.134 | `a ?? b` | `cesium-core-versioning` |
| `new\s+Cesium\.Cartesian[234]\.from` | throws since 1.139 | drop `new` | `cesium-core-coordinates` |
| `terrainExaggeration` | moved 1.113 | `scene.verticalExaggeration` | `cesium-core-versioning` |

Any match : verdict REJECT.

## Check 2 : WebGPU assumption (BLOCKER)

| Pattern | Verdict | Fix skill |
|---------|---------|-----------|
| `WebGPU` near CesiumJS context, backend, or toggle | REJECT | `cesium-core-architecture` |

CesiumJS 1.124+ renders only on WebGL2.

## Check 3 : Missing ion token (BLOCKER if ion used)

Trigger : the code contains any of `fromIonAssetId`, `IonImageryProvider`,
`fromWorldImagery`, `createWorldTerrainAsync`, `createOsmBuildingsAsync`, but
contains no assignment to `Ion.defaultAccessToken`.

Verdict : REJECT. Fix skill : `cesium-syntax-viewer`, `cesium-impl-cesium-ion`.

## Check 4 : Async factory not awaited (BLOCKER)

Trigger : a call to `fromUrl`, `fromIonAssetId`, `fromGltfAsync`,
`fromProviderAsync`, or `createWorldTerrainAsync` whose return value is assigned
or used without `await` (and not explicitly handled as a `Promise` with
`.then`).

Verdict : REJECT. Fix skill : `cesium-core-versioning`.

## Check 5 : Missing teardown (WARN)

Trigger : `new Viewer`, `new CesiumWidget`, `Cesium3DTileset.from*`,
`Model.fromGltfAsync`, `new ScreenSpaceEventHandler`, or `new PrimitiveCollection`
with no matching `destroy()` anywhere; or `addEventListener` on a CesiumJS
`Event` with no stored remover.

Verdict : WARN. Fix skill : `cesium-core-memory`, `cesium-errors-memory`.

## Check 6 : Coordinate type and unit (BLOCKER)

| Pattern | Problem | Fix skill |
|---------|---------|-----------|
| `new\s+(Cesium\.)?Cartographic\s*\(` with arguments above ~7 in magnitude | degrees read as radians | `cesium-errors-coordinates` |
| a `Cartographic` value assigned to `position` | wrong type | `cesium-errors-coordinates` |
| `fromDegrees\(` with latitude in the first slot | argument order swapped | `cesium-errors-coordinates` |
| `new\s+(Cesium\.)?HeadingPitchRoll\s*\(` with degree-magnitude args | degrees read as radians | `cesium-errors-coordinates` |

Verdict : REJECT.

## Check 7 : API name verification (BLOCKER)

Trigger : any CesiumJS class, method, property, or enum value in the code.

Action : confirm each against `https://cesium.com/learn/cesiumjs/ref-doc/`, the
SOURCES.md primary source, via WebFetch. A name that does not resolve is
hallucinated.

Verdict : REJECT until every name resolves.

## Check 8 : Continuous render on a static scene (WARN)

Trigger : a `Viewer` or `CesiumWidget` for a scene with no constant per-frame
animation, constructed without `requestRenderMode: true`.

Verdict : WARN. Fix skill : `cesium-core-performance`.

## Verdict aggregation

| Condition | Result |
|-----------|--------|
| Any BLOCKER (Check 1, 2, 3, 4, 6, 7) unresolved | REJECT |
| Only WARN items (Check 5, 8) | ACCEPT, state the warnings |
| All checks clear | ACCEPT |
