# Anti-Patterns: Primitive API

Companion to `SKILL.md`. Each entry is a real failure verified against the
CesiumJS API reference and CesiumGS/cesium GitHub issues on 2026-05-20.

## A-1: vertexFormat Mismatch

- **Symptom:** A primitive renders blank, renders black, or per-instance color
  never appears, with no thrown error.
- **Root cause:** The `Geometry` was built with the default `vertexFormat`,
  which lacks the attributes the chosen `Appearance` needs. The appearance
  shader has no data to read.
- **Fix:** Set the geometry `vertexFormat` from the appearance. For
  `PerInstanceColorAppearance`, pass
  `vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT`. ALWAYS match
  the geometry to the appearance.

## A-2: MaterialAppearance Expecting Per-Instance Color

- **Symptom:** Every instance renders in one color even though each
  `GeometryInstance` carries a distinct `ColorGeometryInstanceAttribute`.
- **Root cause:** `MaterialAppearance` shades from a shared `Material` and
  ignores per-instance color attributes.
- **Fix:** Use `PerInstanceColorAppearance` when each instance needs its own
  color. Use `MaterialAppearance` only for one shared material.

## A-3: Volume Geometry Passed to GroundPrimitive

- **Symptom:** A `GroundPrimitive` is empty; nothing drapes on the terrain.
- **Root cause:** `GroundPrimitive` accepts only footprint geometries:
  `CircleGeometry`, `CorridorGeometry`, `EllipseGeometry`, `PolygonGeometry`,
  `RectangleGeometry`. A `BoxGeometry` or `EllipsoidGeometry` produces nothing.
- **Fix:** Use a supported footprint geometry. For a free-standing volume, use
  a plain `Primitive` instead.

## A-4: GroundPrimitive Geometry Carries Heights

- **Symptom:** Draped geometry floats above or sinks below the terrain.
- **Root cause:** The footprint geometry was built with explicit height
  values. `GroundPrimitive` conforms geometry to the surface and the supplied
  heights conflict with that.
- **Fix:** Build the footprint geometry with no height component. Use
  `Cesium.Cartesian3.fromDegreesArray` rather than
  `fromDegreesArrayHeights` for a `GroundPrimitive` polygon.

## A-5: Material on GroundPrimitive Without a Support Check

- **Symptom:** A material renders on some machines and fails on others.
- **Root cause:** Materials on a `GroundPrimitive` need the
  `WEBGL_depth_texture` extension, which is not present on every device.
- **Fix:** Gate the `MaterialAppearance` behind
  `GroundPrimitive.supportsMaterials(scene)`, and use a plain color attribute
  as the path when the check fails.

## A-6: Differing Colors in a ClassificationPrimitive

- **Symptom:** `DeveloperError` thrown on the first render of a
  `ClassificationPrimitive`.
- **Root cause:** `ClassificationPrimitive` requires every geometry instance
  to share one color. The rendering technique cannot vary color per instance.
- **Fix:** Give every instance the same `ColorGeometryInstanceAttribute`. For
  per-instance colors on a classified surface, use `GroundPrimitive`.

## A-7: Reading geometryInstances After Build

- **Symptom:** `primitive.geometryInstances` is `undefined` after the
  primitive is constructed.
- **Root cause:** `releaseGeometryInstances` defaults to `true`, so the
  primitive releases the input instances once geometry is built.
- **Fix:** Keep a separate reference to the instances before construction, or
  set `releaseGeometryInstances: false` when later access is required.

## A-8: Polling a Primitive for Readiness

- **Symptom:** Wasted frames, or a race where code runs before geometry is
  built.
- **Root cause:** Code reads the `ready` property in a loop to wait for
  asynchronous geometry to finish.
- **Fix:** Add the primitive to `scene.primitives` and let the render loop
  display it once building completes. NEVER poll for readiness. Use
  `asynchronous: false` only when the primitive must render on the very next
  frame and the main-thread cost is acceptable.

## A-9: Mutating the Original GeometryInstance

- **Symptom:** A change to a `GeometryInstance` after the primitive is built
  has no visible effect.
- **Root cause:** The primitive batched the instance data at build time. The
  original `GeometryInstance` no longer drives rendering.
- **Fix:** Update per-instance attributes through
  `primitive.getGeometryInstanceAttributes(id)`, then call
  `scene.requestRender()` if `requestRenderMode` is enabled.

## A-10: Using a Primitive After Removal

- **Symptom:** A method call on a primitive throws `DeveloperError: This
  object was destroyed`.
- **Root cause:** `scene.primitives.remove(...)` and `removeAll()` destroy the
  primitive by default. The object is then unusable.
- **Fix:** Build a fresh primitive. Set
  `scene.primitives.destroyPrimitives = false` only when a primitive must
  survive removal from the collection.

## A-11: Choosing Primitive Where Entity Fits

- **Symptom:** Hand-written, hard-to-maintain code for a small interactive or
  time-dynamic dataset.
- **Root cause:** The Primitive API was used below its scale threshold. It is
  static and low-level; per-object interactivity is manual work.
- **Fix:** Use the Entity API for interactive or time-dynamic data under
  roughly ten thousand objects. Drop to the Primitive API only when scale or a
  measured visualizer bottleneck demands it. See `cesium-syntax-entity`.
