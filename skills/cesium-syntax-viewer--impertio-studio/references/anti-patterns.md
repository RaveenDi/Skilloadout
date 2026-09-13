# Anti-Patterns: Viewer Construction

Companion to `SKILL.md`. Each entry is a real construction failure verified
against the CesiumJS API reference and CesiumGS/cesium GitHub issues on
2026-05-20.

## A-1: Ion Token Set After Construction

- **Symptom:** Blank or black globe on first load; the browser console shows
  `401` responses for World Terrain, World Imagery, or OSM Buildings (issues
  #8590, #4012).
- **Root cause:** `Ion.defaultAccessToken` was assigned after `new
  Cesium.Viewer(...)`. The viewer already started requesting ion-backed
  imagery and terrain without a token.
- **Fix:** ALWAYS set `Cesium.Ion.defaultAccessToken` before the constructor
  call. The token line is step 1 of the startup order.

## A-2: Container Element Missing

- **Symptom:** `DeveloperError: Object with id "cesiumContainer" does not
  exist in the document.`
- **Root cause:** The constructor ran before the container element existed,
  for example a script in `<head>` with no defer, or a typo in the `id`.
- **Fix:** Ensure the container element is in the DOM before construction.
  Run the constructor after `DOMContentLoaded`, or place the script after the
  container element, or pass the resolved element directly.

## A-3: requestRenderMode Without requestRender

- **Symptom:** The scene renders once then freezes. New entities, style
  changes, or property updates do not appear.
- **Root cause:** `requestRenderMode: true` renders only on a detected scene
  change. Changes the engine cannot detect leave the scene stale.
- **Fix:** Call `viewer.scene.requestRender()` after every change the engine
  does not track. NEVER assume `requestRenderMode` detects all mutations.

## A-4: Synchronous Provider Passed to baseLayer or terrain

- **Symptom:** Imagery or terrain never appears; a console error mentions a
  missing `readyPromise` or an unusable provider.
- **Root cause:** A provider built with a removed synchronous constructor was
  passed to `baseLayer` or `terrainProvider`. The `readyPromise` pattern was
  removed in CesiumJS 1.107.
- **Fix:** Use async-aware helpers: `Terrain.fromWorldTerrain()` for `terrain`,
  and `ImageryLayer.fromWorldImagery()` or `ImageryLayer.fromProviderAsync(...)`
  for `baseLayer`. See `cesium-core-versioning`.

## A-5: globe Disabled But Terrain or Imagery Expected

- **Symptom:** No terrain and no base imagery render, even though `terrain`
  and `baseLayer` were configured.
- **Root cause:** `globe: false` removes the `Globe`. Imagery and terrain are
  draped onto the globe surface, so with no globe there is no surface.
- **Fix:** Keep `globe` enabled for any scene that shows terrain or imagery.
  Set `globe: false` only for a pure 3D Tiles scene.

## A-6: Viewer Dropped Without destroy

- **Symptom:** After repeatedly creating and discarding viewers, the browser
  refuses new WebGL contexts; the globe stops rendering. Chrome enforces a
  limit near 16 contexts per tab (issue #11533).
- **Root cause:** A `Viewer` reference was dropped without calling
  `destroy()`. WebGL contexts and GPU resources are NEVER garbage-collected.
- **Fix:** Call `viewer.destroy()` on teardown, guarded by `isDestroyed()`.
  Reuse a single viewer where the application allows it. See
  `cesium-core-memory`.

## A-7: Using a Viewer After destroy

- **Symptom:** A method call on the viewer throws `DeveloperError: This object
  was destroyed`.
- **Root cause:** Code kept a reference to a viewer and called into it after
  `destroy()`.
- **Fix:** Check `viewer.isDestroyed()` before any use, and clear the
  reference once destroyed.

## A-8: Treating flyTo or setView as Synchronous

- **Symptom:** Camera position read immediately after `flyTo` returns the old
  position; logic that depends on the new view runs too early.
- **Root cause:** `flyTo` is animated and resolves over multiple frames.
  Reading camera state on the next line is a frame-timing bug.
- **Fix:** `await` the `flyTo` promise, or use its `complete` callback. Use
  `setView` for an instant placement when no animation is wanted.

## A-9: Configuring a WebGPU Path

- **Symptom:** A `contextOptions` WebGPU flag has no effect, or a search for a
  WebGPU backend toggle finds nothing.
- **Root cause:** CesiumJS renders exclusively on WebGL2 through the 1.142
  line. WebGPU is roadmap-only and is not shipped.
- **Fix:** NEVER configure a WebGPU rendering path. Treat WebGL2 as the only
  backend. Tune `contextOptions.requestWebgl2` and `powerPreference` instead.

## A-10: Setting Both baseLayer and Leaving baseLayerPicker On

- **Symptom:** A deliberately chosen base layer is replaced when the user
  clicks the base-layer picker.
- **Root cause:** `baseLayerPicker` stays enabled and lets the user override
  the configured `baseLayer`.
- **Fix:** When `baseLayer` is set explicitly, also set `baseLayerPicker:
  false` so the UI cannot override it.
