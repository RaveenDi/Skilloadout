# CesiumJS Picking and Measurement Anti-Patterns

Each entry lists the symptom, the root cause, and the fix. Verified against the
CesiumJS API reference and the project research base.

## 1. pickPosition without checking pickPositionSupported

**Symptom:** `scene.pickPosition` throws or returns an unreliable value on some
devices.

**Root cause:** `pickPosition` reconstructs a position from the depth buffer
and depends on WebGL depth-texture support. Not every device or context
provides it.

**Fix:** ALWAYS guard the call with `scene.pickPositionSupported`. When it is
`false`, fall back to `globe.pick` with a pick ray for ground positions.

## 2. camera.pickEllipsoid used on a terrain scene

**Symptom:** A position picked under the cursor sits below or above the visible
terrain; a placed marker floats or sinks.

**Root cause:** `camera.pickEllipsoid` intersects the smooth WGS84 ellipsoid
and ignores terrain entirely. Over a mountain it returns a point at ellipsoid
height `0`, far from the rendered surface.

**Fix:** Use `globe.pick(camera.getPickRay(windowPosition), scene)` for the
terrain surface, or `scene.pickPosition` for geometry. Reserve
`camera.pickEllipsoid` for scenes with no terrain.

## 3. ScreenSpaceEventHandler never destroyed

**Symptom:** Input callbacks keep firing after a tool is closed; memory grows
as tools are opened and closed repeatedly.

**Root cause:** A `ScreenSpaceEventHandler` registers DOM listeners on the
canvas. Dropping the reference without calling `destroy()` leaves the listeners
and the callbacks attached.

**Fix:** ALWAYS call `handler.destroy()` when the tool that created it is
removed. Check `handler.isDestroyed()` before reusing a reference.

## 4. Adding LEFT_CLICK to the Viewer built-in handler

**Symptom:** After registering a click action, the InfoBox stops opening and
entity selection no longer works.

**Root cause:** `viewer.screenSpaceEventHandler` already has actions that drive
entity selection. `setInputAction` for the same `ScreenSpaceEventType` replaces
the existing action rather than adding to it.

**Fix:** ALWAYS create a separate `new Cesium.ScreenSpaceEventHandler(
viewer.scene.canvas)` for custom input. Leave the Viewer handler alone, or set
`viewer.selectedEntity` yourself from the custom handler.

## 5. Treating the scene.pick result as the Entity

**Symptom:** Reading `.name` or `.position` on the pick result returns
`undefined`.

**Root cause:** `scene.pick` returns an object with a `primitive` and an `id`
property for entity-backed geometry, or a `Cesium3DTileFeature` for a tileset.
It does not return the `Entity` directly.

**Fix:** Read `picked.id` for the `Entity`. Branch with
`picked.id instanceof Cesium.Entity` and
`picked instanceof Cesium.Cesium3DTileFeature` before use.

## 6. Straight-line distance used for ground measurement

**Symptom:** A measured ground distance over a long span reads shorter than
expected.

**Root cause:** `Cartesian3.distance` is the straight-line chord between two
points, which cuts through the curve of the Earth. Over tens of kilometers the
chord is meaningfully shorter than the surface path.

**Fix:** Use `EllipsoidGeodesic.surfaceDistance` for distance along the
surface. Reserve `Cartesian3.distance` for short spans on a single model.

## 7. sampleHeight or clampToHeight returns undefined

**Symptom:** `scene.sampleHeight` or `scene.clampToHeight` returns `undefined`
for a position that is clearly over loaded terrain.

**Root cause:** The synchronous methods read ONLY the globe and 3D Tiles tiles
that are currently rendered. A tile that has not streamed in yet, or a
fine-detail tile outside the current view, yields no height.

**Fix:** Use the asynchronous `scene.sampleHeightMostDetailed` or
`scene.clampToHeightMostDetailed`. They load the finest level of detail and
resolve to a `Promise`.

## 8. Reading .position inside a MOUSE_MOVE callback

**Symptom:** A hover handler reads `undefined` and never updates.

**Root cause:** A motion event delivers `startPosition` and `endPosition`. It
has no `position` property; that property exists only on click-type events.

**Fix:** Read `movement.endPosition` for the current cursor location inside a
`MOUSE_MOVE` callback.

## 9. Using a pick result without a defined check

**Symptom:** A click in empty space throws a `TypeError` reading a property of
`undefined`.

**Root cause:** `scene.pick`, `scene.pickPosition`, `globe.pick`, and
`camera.pickEllipsoid` all return `undefined` when nothing is hit. Empty space,
the sky, and the edge of the globe are common cases.

**Fix:** ALWAYS guard every pick result with `Cesium.defined(result)` before
reading it.
