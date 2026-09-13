# CesiumJS Picking and Measurement API Reference

All names verified against the CesiumJS API reference at
`https://cesium.com/learn/cesiumjs/ref-doc/` for the 1.124+ release line.

## Scene picking methods

`viewer.scene` exposes the picking surface.

| Member | Signature | Returns |
|--------|-----------|---------|
| `pick` | `scene.pick(windowPosition, width, height)` | Topmost picked object, or `undefined` |
| `drillPick` | `scene.drillPick(windowPosition, limit, width, height)` | Array of picked objects, front to back |
| `pickPosition` | `scene.pickPosition(windowPosition, result)` | `Cartesian3` from the depth buffer, or `undefined` |
| `pickPositionSupported` | property, readonly boolean | `true` if `pickPosition` is supported |

- `windowPosition` is a `Cartesian2` in CSS pixels.
- `width` and `height` default to `3` pixels; they size the pick rectangle.
- `limit` on `drillPick` caps the number of results; omit it for all.
- `scene.pick` returns an object with a `primitive` property and an `id`
  property. For entity-backed geometry `id` is the `Entity`. For a 3D Tileset
  the return value is a `Cesium3DTileFeature`.
- `scene.pickPosition` reconstructs a position from the depth buffer. It
  returns a value only where geometry was rendered. Set
  `scene.pickTranslucentDepth` to `true` to include translucent geometry.

## Scene height sampling and clamping

| Member | Signature | Returns |
|--------|-----------|---------|
| `sampleHeight` | `scene.sampleHeight(position, objectsToExclude, width)` | Height number, or `undefined` |
| `sampleHeightMostDetailed` | `scene.sampleHeightMostDetailed(positions, objectsToExclude, width)` | `Promise` of an array of `Cartographic` |
| `sampleHeightSupported` | property, readonly boolean | `true` if `sampleHeight` is supported |
| `clampToHeight` | `scene.clampToHeight(cartesian, objectsToExclude, width, result)` | Clamped `Cartesian3`, or `undefined` |
| `clampToHeightMostDetailed` | `scene.clampToHeightMostDetailed(cartesians, objectsToExclude, width)` | `Promise` of an array of `Cartesian3` |
| `clampToHeightSupported` | property, readonly boolean | `true` if `clampToHeight` is supported |

- `position` for `sampleHeight` is a `Cartographic`.
- `width` defaults to `0.1` meters and sizes the sampling region.
- The synchronous variants read ONLY currently rendered tiles. The
  `MostDetailed` variants load the finest level of detail and are asynchronous.
- `objectsToExclude` is an optional array of primitives, entities, or features
  to skip while sampling.

## Globe picking

| Member | Signature | Returns |
|--------|-----------|---------|
| `pick` | `globe.pick(ray, scene, result)` | `Cartesian3` ray and terrain intersection, or `undefined` |
| `depthTestAgainstTerrain` | property, boolean, default `false` | Whether primitives are depth-tested against terrain |

- `globe` is `viewer.scene.globe`.
- `ray` is a `Ray` in world coordinates, built with `camera.getPickRay`.
- `globe.pick` intersects the ray with the rendered terrain surface.

## Camera picking

| Member | Signature | Returns |
|--------|-----------|---------|
| `getPickRay` | `camera.getPickRay(windowPosition, result)` | `Ray` from the camera through the pixel, or `undefined` |
| `pickEllipsoid` | `camera.pickEllipsoid(windowPosition, ellipsoid, result)` | `Cartesian3` on the ellipsoid, or `undefined` |

- `camera` is `viewer.camera`.
- `ellipsoid` defaults to `Ellipsoid.default`.
- `camera.pickEllipsoid` ignores terrain; it intersects the smooth ellipsoid.

## ScreenSpaceEventHandler

| Member | Signature | Purpose |
|--------|-----------|---------|
| constructor | `new Cesium.ScreenSpaceEventHandler(element)` | `element` is an optional `HTMLCanvasElement` |
| `setInputAction` | `setInputAction(action, type, modifier)` | Registers a callback |
| `getInputAction` | `getInputAction(type, modifier)` | Returns the registered callback |
| `removeInputAction` | `removeInputAction(type, modifier)` | Unregisters a callback |
| `isDestroyed` | `isDestroyed()` | `true` once destroyed |
| `destroy` | `destroy()` | Removes all listeners and destroys the handler |

- `type` is a `ScreenSpaceEventType` value.
- `modifier` is an optional `KeyboardEventModifier` value.
- For a click-type event the callback receives an object with a single
  `position` property, a `Cartesian2`.
- For a motion event (`MOUSE_MOVE`) the callback receives an object with
  `startPosition` and `endPosition`, both `Cartesian2`.

## ScreenSpaceEventType enum

`LEFT_DOWN`, `LEFT_UP`, `LEFT_CLICK`, `LEFT_DOUBLE_CLICK`, `RIGHT_DOWN`,
`RIGHT_UP`, `RIGHT_CLICK`, `MIDDLE_DOWN`, `MIDDLE_UP`, `MIDDLE_CLICK`,
`MOUSE_MOVE`, `WHEEL`, `PINCH_START`, `PINCH_END`, `PINCH_MOVE`.

## KeyboardEventModifier enum

`SHIFT`, `CTRL`, `ALT`. Passed as the third argument to `setInputAction` to
register a modified-input action.

## Viewer selection members

| Member | Type | Purpose |
|--------|------|---------|
| `selectedEntity` | `Entity` or `undefined` | The entity shown in the InfoBox and selection indicator |
| `selectedEntityChanged` | `Event` | Fires when `selectedEntity` changes |
| `trackedEntity` | `Entity` or `undefined` | The entity the camera follows |
| `screenSpaceEventHandler` | `ScreenSpaceEventHandler` | The built-in handler that drives default selection |

Setting `viewer.selectedEntity` opens the InfoBox for that entity. Setting it
to `undefined` closes the InfoBox.

## Measurement helpers

| Member | Signature | Returns |
|--------|-----------|---------|
| `Cartesian3.distance` | `Cartesian3.distance(left, right)` | Straight-line distance in meters |
| `Cartesian3.midpoint` | `Cartesian3.midpoint(left, right, result)` | The midpoint `Cartesian3` |
| `EllipsoidGeodesic` constructor | `new Cesium.EllipsoidGeodesic(start, end, ellipsoid)` | A geodesic between two `Cartographic` points |
| `EllipsoidGeodesic.surfaceDistance` | property, readonly number | Distance along the surface in meters |

- `Cartesian3.distance` is the chord through the Earth.
- `EllipsoidGeodesic.surfaceDistance` is the distance along the curved surface;
  `start` and `end` are `Cartographic`. `ellipsoid` defaults to
  `Ellipsoid.default`.
- CesiumJS has no built-in geodesic polygon-area function; area is computed
  from picked vertices in application code.

## Cesium3DTileFeature

The object type returned by `scene.pick` when the topmost hit belongs to a 3D
Tileset. Read and write per-feature properties with `getProperty(name)` and
`setProperty(name, value)`, and reach the owning tileset through `tileset`.
Detailed coverage is in `cesium-syntax-3d-tiles`.
