# 3D Tiles Anti-Patterns

Each entry below is a real failure mode verified against CesiumGS/cesium
GitHub issues and the CesiumJS API reference. Format: symptom, root cause,
fix.

## 1. Synchronous Construction With readyPromise

**Symptom:** Code from an old tutorial throws on CesiumJS 1.124+, or
`tileset.readyPromise` is `undefined`.

**Root cause:** `new Cesium3DTileset({ url })`, `tileset.ready`, and
`tileset.readyPromise` were deprecated in 1.104 and removed in 1.107. The
target line is 1.124+, where only the async factory exists.

**Fix:** ALWAYS create a tileset with `await Cesium3DTileset.fromUrl(url)` or
`await Cesium3DTileset.fromIonAssetId(assetId)`. The resolved tileset is fully
ready; no `readyPromise` step exists.

```js
// WRONG: removed in 1.107
const tileset = new Cesium.Cesium3DTileset({ url });
await tileset.readyPromise;

// RIGHT
const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
```

## 2. Reading boundingSphere Before the Promise Resolves

**Symptom:** A camera move throws, or `tileset.boundingSphere` is `undefined`.

**Root cause:** `boundingSphere` and `root` are valid only after the factory
promise resolves. Reading them on the still-pending tileset returns
`undefined`.

**Fix:** Read derived properties only after the `await` completes.

```js
const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
viewer.camera.viewBoundingSphere(tileset.boundingSphere); // valid here
```

## 3. Tileset CORS Failure

**Symptom:** The tileset never appears and the console fills with opaque CORS
errors against `tileset.json` or a tile content file (issues #8584, #10449).

**Root cause:** `fromUrl` against a server that does not return an
`Access-Control-Allow-Origin` header. A `file://` URL is treated as
cross-origin by the browser.

**Fix:** Serve the tileset over HTTP from a server that sets
`Access-Control-Allow-Origin`. NEVER load a tileset from `file://`. Run a
local HTTP server during development.

## 4. Missing or Expired ion Token

**Symptom:** `fromIonAssetId` rejects with a 401 or 403; an ion-backed
tileset stays blank (issue #11605).

**Root cause:** `Cesium.Ion.defaultAccessToken` was not set, was wrong, or
expired before the factory call.

**Fix:** ALWAYS set `Cesium.Ion.defaultAccessToken` before any
`fromIonAssetId` call. A 403 from a third-party provider such as Google
points to that provider's token, not the ion token.

```js
Cesium.Ion.defaultAccessToken = "<your-ion-token>";
const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
```

## 5. Unhandled Promise Rejection

**Symptom:** A failed load produces an `Uncaught (in promise)` error and the
application has no chance to show a fallback.

**Root cause:** The `await` on the factory was not wrapped in `try / catch`.
The factory rejects on a network, CORS, token, or unsupported-version
failure.

**Fix:** ALWAYS wrap the factory `await` in `try / catch` and handle the
error path.

```js
try {
  const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
  viewer.scene.primitives.add(tileset);
} catch (error) {
  console.error("Tileset failed to load:", error);
}
```

## 6. Tileset Loaded But Never Rendered

**Symptom:** No error, the promise resolves, but nothing shows on the globe.

**Root cause:** The resolved tileset was never added to a primitive
collection. A tileset is a primitive and renders only once it is in
`viewer.scene.primitives`.

**Fix:** ALWAYS call `viewer.scene.primitives.add(tileset)` after the
factory resolves.

## 7. maximumScreenSpaceError Set Too Low

**Symptom:** The tileset loads slowly, the frame rate drops, and memory use
climbs.

**Root cause:** A very low `maximumScreenSpaceError` forces the runtime to
load far more detailed tiles than the screen needs.

**Fix:** Keep `maximumScreenSpaceError` at the default `16` or raise it. A
HIGHER value loads coarser tiles and renders faster; a LOWER value adds
detail at a memory and bandwidth cost.

## 8. Tileset Memory Not Released

**Symptom:** Memory keeps climbing as tilesets are swapped, and the browser
tab eventually hits the WebGL context or memory limit.

**Root cause:** A tileset was dropped without `destroy()`. WebGL resources
are not garbage-collected.

**Fix:** Remove the tileset with `viewer.scene.primitives.remove(tileset)`,
which destroys it by default, or call `tileset.destroy()` directly when the
tileset was never added to a collection. See `cesium-core-memory`.

## 9. Expecting an Entity From a Tileset Pick

**Symptom:** `picked.id` or `picked instanceof Cesium.Entity` is checked
after `scene.pick` over a tileset and never matches.

**Root cause:** A pick against a tileset returns a `Cesium3DTileFeature`, not
an `Entity`. The metadata model is different.

**Fix:** Test `picked instanceof Cesium.Cesium3DTileFeature` and read values
with `getProperty`, `getPropertyIds`, and `hasProperty`.

## 10. Treating Tile Format as a Runtime Choice

**Symptom:** Code tries to select `b3dm` versus glTF content, or assumes a
tileset is 1.0 only.

**Root cause:** The tile content format and the 3D Tiles spec version are
fixed by the tileset author inside `tileset.json`. They are not runtime
settings.

**Fix:** Load any tileset with the same factory call. CesiumJS 1.124+ reads
both 3D Tiles 1.0 (`b3dm`, `i3dm`, `pnts`, `cmpt`) and 1.1 (glTF content) and
detects the format automatically.
