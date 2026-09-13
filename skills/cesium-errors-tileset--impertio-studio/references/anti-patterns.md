# Tileset Loading Anti-Patterns

Each entry lists symptom, root cause, prevention, and recovery. Failures are
traced to the CesiumJS GitHub issues recorded in the project research base and
verified against `CHANGES.md` and the API reference on the approved sources.

## 1. Page opened over the file protocol

**Symptom:** The tileset never appears. The console floods with CORS messages
even though `tileset.json` sits in the same folder as the HTML file.

**Root cause:** A page loaded over the `file` protocol has a null origin. The
browser treats every fetch, including one for a local `tileset.json`, as
cross-origin and blocks it. Verified against issues #8584 and #10449.

**Prevention:** NEVER open the application by double-clicking the HTML file.
ALWAYS serve it over `http` or `https`.

**Recovery:** Start a local HTTP server, for example `npx http-server` or
`python3 -m http.server`, and open the app from `http://localhost`.

## 2. Tileset host sends no CORS header

**Symptom:** The tileset never loads. The console reports `has been blocked by
CORS policy` or `No 'Access-Control-Allow-Origin' header is present`.

**Root cause:** The tileset is hosted on a server that does not send an
`Access-Control-Allow-Origin` header permitting the application origin. The
browser blocks the response before CesiumJS can read it. Verified against
issues #8584 and #10449.

**Prevention:** Host tilesets on a server configured to return CORS headers
for the application origin.

**Recovery:** Add `Access-Control-Allow-Origin` on the tileset host. When the
host cannot be changed, route the tileset through a CORS-enabled reverse proxy
served from the application origin.

## 3. Missing or expired ion access token

**Symptom:** Tiles do not load. The network tab shows `401 Unauthorized` on
`tileset.json` or tile requests. `fromIonAssetId` rejects.

**Root cause:** `Ion.defaultAccessToken` is unset or expired, or the token
scopes do not include the requested asset. The Sandcastle demo token is
rate-limited and is not valid for a deployed app. Verified against the project
research base section 4.

**Prevention:** Set `Ion.defaultAccessToken` to a valid token, with scopes
covering the asset, before constructing anything that uses an ion asset.

**Recovery:** Generate a fresh token in the ion account, replace the value in
the application, and confirm the token scopes include the asset.

## 4. Missing or restricted Google API key

**Symptom:** Google Photorealistic 3D Tiles do not load. The network tab shows
`403 Forbidden`.

**Root cause:** `GoogleMaps.defaultApiKey` is unset or the key has API
restrictions that exclude the Map Tiles API. `IonResource` refreshes ion
tokens but does not refresh the underlying non-ion Google credential, so an
expired key still returns 403. Verified against issue #11605 and the
`CHANGES.md` entries for 1.105.1 and 1.110.

**Prevention:** Set `GoogleMaps.defaultApiKey` before calling
`createGooglePhotorealistic3DTileset`, or leave it unset to stream the tiles
through ion with a valid `Ion.defaultAccessToken`.

**Recovery:** Generate a fresh Google Map Tiles API key, set it on
`GoogleMaps.defaultApiKey`, and confirm the key restrictions allow the Map
Tiles API.

## 5. Synchronous construction with the url option

**Symptom:** The console reports `readyPromise is undefined`, or an invalid or
missing `url` option. The tileset never appears.

**Root cause:** `new Cesium3DTileset({ url })`, `Cesium3DTileset.ready`, and
`Cesium3DTileset.readyPromise` were deprecated in CesiumJS 1.104 and removed in
1.107. The `url` constructor option no longer exists. Code copied from old
tutorials builds a tileset with no source. Verified against issue #11195 and
PR #11059.

**Prevention:** ALWAYS construct with `await Cesium3DTileset.fromUrl(url)` or
`await Cesium3DTileset.fromIonAssetId(id)`. NEVER use `new Cesium3DTileset`,
`tileset.ready`, or `tileset.readyPromise`.

**Recovery:** Rewrite the construction to the async factory. Move code that ran
inside `readyPromise.then(...)` to run after the `await`.

## 6. Tileset resolved but not added to the scene

**Symptom:** `fromUrl` resolves with no error and no console message, yet
nothing renders.

**Root cause:** The factory loads and parses `tileset.json` only. It does not
add the tileset to `scene.primitives`. A tileset that is never added is never
drawn.

**Prevention:** After the `await`, ALWAYS call
`viewer.scene.primitives.add(tileset)`.

**Recovery:** Add the resolved tileset to `viewer.scene.primitives`.

## 7. Camera never moved to the tileset

**Symptom:** `fromUrl` resolves, the tileset is added, no errors appear, but
the view shows empty globe.

**Root cause:** The factory does not move the camera. The tileset renders
correctly somewhere off-screen.

**Prevention:** After adding the tileset, ALWAYS bring it into view with
`await viewer.zoomTo(tileset)` or
`viewer.camera.flyToBoundingSphere(tileset.boundingSphere)`.

**Recovery:** Fly the camera to `tileset.boundingSphere`.

## 8. Wrong modelMatrix places the tileset off the globe

**Symptom:** The tileset loads and is added, but appears in empty space, below
the surface, or not at all from the expected viewpoint.

**Root cause:** `tileset.modelMatrix` was assigned a matrix that places the
tileset away from its georeferenced position. The default is
`Matrix4.IDENTITY`, which keeps the tileset at its own coordinates.

**Prevention:** Leave `modelMatrix` at `Matrix4.IDENTITY` for a tileset that
is already georeferenced. Only set it to reposition a local-coordinate
tileset, using a transform from `cesium-impl-aec-georef`.

**Recovery:** Reset `tileset.modelMatrix` to `Matrix4.IDENTITY`, then verify
the tileset is georeferenced.

## 9. Individual tile content files missing

**Symptom:** The tileset mostly renders but has holes. The network tab shows
`404` for specific tile content files.

**Root cause:** `fromUrl` loads only `tileset.json`. Tile content loads lazily
as the camera approaches, so the factory promise resolves while content files
fail later. Files are missing on the host or `tileset.json` references wrong
relative paths. Verified against issues #8584 and #10449.

**Prevention:** ALWAYS attach a `tileFailed` listener. Verify every content
file referenced by `tileset.json` is deployed.

**Recovery:** The `tileFailed` event passes `{ url, message }`. Use the URLs
to find missing or mispathed files and correct them on the host.

## 10. Factory promise used without await

**Symptom:** `scene.primitives.add` throws, or `tileset.style` assignment
fails. The variable holds a `Promise`, not a `Cesium3DTileset`.

**Root cause:** `Cesium3DTileset.fromUrl` returns a `Promise`. Calling it
without `await` keeps the unresolved promise in the variable. Verified against
issue #11195 and PR #11059.

**Prevention:** ALWAYS `await` the factory inside an `async` function. NEVER
pass the unresolved promise to `scene.primitives.add`.

**Recovery:** Add the `await`, inside an `async` function.

## 11. RuntimeError rejection left unhandled

**Symptom:** An unhandled promise rejection appears in the console; setup
aborts with a `RuntimeError`.

**Root cause:** `Cesium3DTileset.fromUrl` rejects with `RuntimeError` when the
tileset asset version is not `0.0`, `1.0`, or `1.1`, or when the tileset
requires an unsupported extension. Without a `catch`, the rejection is
unhandled.

**Prevention:** ALWAYS wrap the `await` in `try`/`catch`.

**Recovery:** Add the `try`/`catch`. On a version or extension `RuntimeError`,
re-tile the source to 3D Tiles 1.0 or 1.1, or remove the unsupported
extension.
