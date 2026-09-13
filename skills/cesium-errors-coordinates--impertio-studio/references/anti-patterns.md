# Coordinate Anti-Patterns

Each entry lists symptom, root cause, prevention, and recovery. Verified against
the CesiumJS API Reference on the approved sources on 2026-05-20.

## 1. Degree numbers passed to the Cartographic constructor

**Symptom:** An entity or model appears nowhere near the intended location,
often on the far side of the globe or off it entirely.

**Root cause:** `new Cartographic(longitude, latitude, height)` reads longitude
and latitude as RADIANS. Degree values such as `-75` and `40` are interpreted
as radians, which is thousands of degrees, wrapping to an arbitrary point.

**Prevention:** NEVER pass degrees to `new Cartographic`. Use
`Cartographic.fromDegrees(...)` or `Cartesian3.fromDegrees(...)`, or convert
each value with `Cesium.Math.toRadians`.

**Recovery:** Replace the constructor call with the `fromDegrees` factory, or
wrap each angle in `Cesium.Math.toRadians`.

## 2. A Cartographic passed where a Cartesian3 is required

**Symptom:** Geometry is misplaced or absent. No error is thrown.

**Root cause:** `entity.position`, `model.position`, camera `destination`, and
primitive `modelMatrix` builders require a `Cartesian3` in ECEF meters. A
`Cartographic` has `longitude`, `latitude`, `height` instead of `x`, `y`, `z`,
so it does not describe a valid position there.

**Prevention:** ALWAYS convert with `Cartographic.toCartesian(carto)` or build
the position directly with `Cartesian3.fromDegrees`.

**Recovery:** Find the assignment that received a `Cartographic`. Convert it to
`Cartesian3` before the assignment.

## 3. Longitude and latitude swapped

**Symptom:** The geometry lands in the wrong hemisphere or far out to sea.

**Root cause:** Every CesiumJS coordinate factory takes
`(longitude, latitude, height)`. Spoken usage and several other mapping
libraries put latitude first, so `(lat, lon)` is passed by habit.

**Prevention:** ALWAYS pass longitude first. When the data source provides
`(lat, lon)`, swap explicitly at the boundary and comment it.

**Recovery:** Inspect the factory call. If latitude is in the first slot, swap
the two arguments.

## 4. Height zero treated as the terrain surface

**Symptom:** A point or model floats above the landscape or is buried inside a
hill.

**Root cause:** Height `0` is the WGS84 ellipsoid surface. With world terrain
loaded, the terrain surface is above or below the ellipsoid by tens to
thousands of meters, so height `0` does not sit on the ground.

**Prevention:** Set `heightReference` to a clamping value such as
`HeightReference.CLAMP_TO_GROUND`, or sample the real terrain height with
`sampleTerrainMostDetailed` before placing the geometry.

**Recovery:** Add a `heightReference`, or replace the hard-coded height with a
sampled terrain height.

## 5. Sampling terrain height before terrain loads

**Symptom:** A sampled height comes back as `0` for every point even though
world terrain is configured.

**Root cause:** Terrain height is only known once terrain tiles are loaded.
Reading `cartographic.height` before an async sampler resolves yields the
unmodified ellipsoid height `0`.

**Prevention:** ALWAYS `await` `sampleTerrainMostDetailed` or `sampleTerrain`
before reading `.height`. The input `Cartographic` array is mutated in place.

**Recovery:** Move the height read after the awaited sampler call.

## 6. GeoJSON drawn at sea level

**Symptom:** GeoJSON polygons and lines float above or sink below the terrain.

**Root cause:** `GeoJsonDataSource.load` defaults `clampToGround` to `false`.
Geometry then renders at ellipsoid height `0`.

**Prevention:** ALWAYS pass `{ clampToGround: true }` in the load options when
the GeoJSON should drape on the surface.

**Recovery:** Add `clampToGround: true` to the `GeoJsonDataSource.load`
options object.

## 7. NaN coordinate from unvalidated input

**Symptom:** Geometry is silently absent. Logging the position shows `NaN`
components. No error appears in the console.

**Root cause:** `Cartesian3.fromDegrees` received `undefined`, a string, or a
`NaN`, usually from a missing object field or an unparsed value. The factory
propagates the `NaN` into the result.

**Prevention:** Validate every coordinate from external data with
`Number.isFinite` before calling a factory.

**Recovery:** Log the raw factory arguments, trace the `NaN` to its source
field or parse step, and fix or default that value.

## 8. Degrees passed to HeadingPitchRoll

**Symptom:** A model is rotated to an extreme, seemingly random orientation.

**Root cause:** `new HeadingPitchRoll(heading, pitch, roll)` reads all three
values as RADIANS. A degree value such as `90` is read as `90` radians.

**Prevention:** Convert each angle with `Cesium.Math.toRadians`, or build the
value with `HeadingPitchRoll.fromDegrees(heading, pitch, roll)`.

**Recovery:** Wrap each angle in `Cesium.Math.toRadians`, or switch to
`HeadingPitchRoll.fromDegrees`.

## 9. Expecting a model to face the camera by default

**Symptom:** A placed model points in an unexpected direction.

**Root cause:** A model given only a position, with no orientation, sits in the
default east-north-up reference frame at that position. It is not oriented
toward the viewer and not aligned to any path.

**Prevention:** To orient a model, build a `modelMatrix` with
`Transforms.headingPitchRollToFixedFrame(origin, hpr)` and assign it. See
`cesium-impl-aec-georef`.

**Recovery:** Compute and assign a `modelMatrix` with the intended
`HeadingPitchRoll`.

## 10. Treating Cartesian3 x, y, z as longitude, latitude, height

**Symptom:** Reading `position.x` expecting a longitude yields a number in the
millions; arithmetic on it produces nonsense.

**Root cause:** `Cartesian3` is geocentric ECEF in meters. Its `x`, `y`, `z`
are distances from the Earth center, not geographic angles.

**Prevention:** To get longitude, latitude, height from a `Cartesian3`, convert
with `Cartographic.fromCartesian`, then read its fields and convert the angles
with `Cesium.Math.toDegrees`.

**Recovery:** Replace direct `x`, `y`, `z` reads with a `Cartographic`
conversion.
