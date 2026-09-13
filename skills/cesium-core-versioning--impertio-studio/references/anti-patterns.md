# Anti-Patterns: Versioning and Migration

Companion to `SKILL.md`. Each entry below is a removed or broken API on a
CesiumJS 1.124+ target. Verified against the official `CHANGES.md` and the API
reference on 2026-05-20.

## Grep-Ready Detection Catalog

Run these patterns over a codebase to find legacy CesiumJS code. A match means
the code does not run on a 1.124+ target.

| Regex | Detects | Removed in |
|-------|---------|------------|
| `\breadyPromise\b` | The removed readiness promise | 1.107 |
| `\.ready\b` | The removed readiness flag (review matches: `.ready` also appears on unrelated objects) | 1.107 |
| `new\s+(Cesium\.)?Cesium3DTileset\s*\(` | Synchronous tileset construction | 1.107 |
| `Model\.fromGltf\s*\(` | The pre-async model loader (distinct from `fromGltfAsync`) | superseded |
| `\bModelExperimental\b` | The removed experimental model class | merged into `Model` |
| `new\s+(Cesium\.)?CesiumTerrainProvider\s*\(` | Synchronous terrain construction | 1.107 |
| `\bcreateWorldTerrain\s*\(` | The pre-async world terrain helper (distinct from `createWorldTerrainAsync`) | 1.107 |
| `new\s+(Cesium\.)?IonImageryProvider\s*\(` | Synchronous ion imagery construction | 1.107 |
| `\bdefaultValue\s*\(` | The removed default-value helper | 1.134 |
| `defaultValue\.EMPTY_OBJECT` | The relocated empty-object constant | 1.134 |
| `new\s+(Cesium\.)?Cartesian[234]\.from` | `new` applied to a Cartesian static factory | throws since 1.139 |
| `\.terrainExaggeration\b` | Globe-based vertical exaggeration | 1.113 |

The `\.ready\b` and `Model\.fromGltf\s*\(` patterns can match unrelated code.
ALWAYS review each match by hand before rewriting it.

## A-1: Synchronous Tileset Construction

- **Symptom:** `TypeError: Cesium.Cesium3DTileset is not a constructor`, or
  `tileset.readyPromise is not a function`, or `tileset.ready is undefined`.
- **Root cause:** `new Cesium3DTileset({ url })` plus `.readyPromise` was the
  pre-1.104 pattern. Both the constructor signature and the readiness members
  were removed in 1.107.
- **Fix:** `const tileset = await Cesium.Cesium3DTileset.fromUrl(url)` or
  `await Cesium.Cesium3DTileset.fromIonAssetId(id)`. The awaited result is
  fully ready. NEVER read `.ready` or `.readyPromise`.

## A-2: Chaining .then on a Factory Result

- **Symptom:** No error, but error handling never fires and the code reads
  oddly.
- **Root cause:** Calling `.then(...)` on the value returned by `await
  Cesium3DTileset.fromUrl(...)` chains on an already-resolved `Cesium3DTileset`,
  not on a promise. The factory promise is the one that can reject.
- **Fix:** `await` the factory inside `try / catch`. Handle the rejection where
  the `await` happens, NEVER after it.

## A-3: ModelExperimental Referenced

- **Symptom:** `ReferenceError: ModelExperimental is not defined`, or an
  `undefined` import from `cesium`.
- **Root cause:** `ModelExperimental` was the in-development glTF renderer. It
  was merged into `Model` and removed as a separate name.
- **Fix:** Use `Model`. Load with `await Cesium.Model.fromGltfAsync(options)`.

## A-4: createWorldTerrain Without Async

- **Symptom:** `createWorldTerrain is not a function`.
- **Root cause:** `createWorldTerrain` was removed in 1.107 in favor of the
  async helper.
- **Fix:** `viewer.terrainProvider = await Cesium.createWorldTerrainAsync()`,
  or pass `terrain: Cesium.Terrain.fromWorldTerrain()` to the `Viewer` options.

## A-5: defaultValue Used

- **Symptom:** `defaultValue is not defined`, or `Cesium.defaultValue is not a
  function`.
- **Root cause:** The `defaultValue` helper was removed in 1.134.
- **Fix:** Replace `defaultValue(a, b)` with `a ?? b`. Replace
  `defaultValue.EMPTY_OBJECT` with `Cesium.Frozen.EMPTY_OBJECT`. Note that `??`
  falls through only on `null` and `undefined`, NEVER on `0`, `false`, or `""`;
  that is the correct behavior.

## A-6: new on a Cartesian Static Factory

- **Symptom:** `Cesium.Cartesian3.fromDegrees is not a constructor`, thrown
  since 1.139.
- **Root cause:** `Cartesian2`, `Cartesian3`, and `Cartesian4` became ES6
  classes in 1.139. `new` applied to a static factory method now throws.
- **Fix:** Drop `new`. Call `Cesium.Cartesian3.fromDegrees(lon, lat, height)`
  directly. The real constructor `new Cesium.Cartesian3(x, y, z)` with raw
  numeric components remains valid.

## A-7: Globe-Based Vertical Exaggeration

- **Symptom:** Setting `globe.terrainExaggeration` has no effect, or the
  property is `undefined`.
- **Root cause:** Vertical exaggeration moved off `Globe` to `Scene` in 1.113
  and now also affects 3D Tiles.
- **Fix:** Set `scene.verticalExaggeration` and
  `scene.verticalExaggerationRelativeHeight`.

## A-8: Unexpected Visual Difference After Upgrade

- **Symptom:** A scene renders without error but looks brighter, darker, or
  smoother than on an older CesiumJS build.
- **Root cause:** Release 1.121 enabled MSAA by default at 4 samples and
  switched the default tonemapper from ACES to PBR Neutral.
- **Fix:** This is expected, not a bug. To compare against the pre-1.121 look,
  set `viewer.scene.msaaSamples = 1`. NEVER assume a scene rendered identically
  across the 1.121 boundary.

## A-9: Pinning cesium to latest

- **Symptom:** A working build breaks after an unrelated `npm install`.
- **Root cause:** `"cesium": "latest"` or a broad caret range in
  `package.json` lets a CesiumJS minor release with a breaking change install
  silently.
- **Fix:** Pin an exact version, for example `"cesium": "1.142.0"`. Upgrade
  deliberately after reading the `### Breaking Changes` and `### Deprecated`
  blocks of every release in between.

## A-10: Reading the Rendered CHANGES.md Page

- **Symptom:** An automated fetch of the changelog returns navigation chrome
  instead of changelog text.
- **Root cause:** The rendered GitHub blob page does not expose the file body
  to a fetch tool.
- **Fix:** ALWAYS fetch the raw form:
  `https://raw.githubusercontent.com/CesiumGS/cesium/main/CHANGES.md`.

## Cross-Cutting Rule

Code copied from a pre-2023 Sandcastle example, blog post, or tutorial almost
always carries A-1 and frequently A-3, A-4, and A-5. When porting any external
CesiumJS snippet, ALWAYS run the detection catalog above before trusting it.
