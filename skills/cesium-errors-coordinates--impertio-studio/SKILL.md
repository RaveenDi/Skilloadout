---
name: cesium-errors-coordinates
description: >
  Use when CesiumJS geometry renders in the wrong place, falls through the
  terrain, sits at the center of the Earth, or never appears, and when position
  values come back as NaN. Prevents the radians-versus-degrees mistake, the
  Cartographic-versus-Cartesian3 mixup, the longitude and latitude swap, the
  GeoJSON ground-clamp surprise, and terrain-clamping before terrain has loaded.
  Covers Cartesian3, Cartographic, the fromDegrees factories, HeightReference,
  HeadingPitchRoll conventions, and terrain height sampling.
  Keywords: CesiumJS coordinates, NaN position, entity not showing, model wrong
  place, geometry at center of earth, off the globe, radians degrees, longitude
  latitude swapped, Cartographic Cartesian3, fromDegrees, fromRadians,
  clampToGround, sampleTerrainMostDetailed, HeightReference, HeadingPitchRoll,
  heading pitch roll wrong, why is my point underground, how do I place
  something on terrain, position is NaN.
license: MIT
compatibility: "Designed for Claude Code. Requires CesiumJS 1.124+."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Cesium Errors : Coordinates

## Overview

Almost every CesiumJS placement bug comes from confusing two coordinate types
or two angle units. CesiumJS uses ONE position type internally and a small set
of factories to build it. Reading the rules below removes the whole class of
"my thing is in the wrong place" failures.

Core facts:

- `Cartesian3` is an Earth-Centered, Earth-Fixed (ECEF) position in METERS. It
  is NOT longitude, latitude, height. Its `x`, `y`, `z` are geocentric.
- `Cartographic` stores `longitude` and `latitude` in RADIANS plus `height` in
  meters. The constructor and the fields are radians, NOT degrees.
- The `fromDegrees` factories are the bridge from human degrees to either type.

## When to Use

- An entity, model, or primitive does not appear, or appears far from where it
  should.
- Geometry renders at the center of the Earth or shoots off into space.
- A position logs as `(NaN, NaN, NaN)` or a height logs as `NaN`.
- A point sits underground or floats above terrain.
- A model points the wrong way or is tilted.
- GeoJSON or a polygon draws at sea level instead of on the terrain.

## The Two Type Rules

ALWAYS know which type an API wants. Mixing them is the single most common
coordinate bug.

| You have | You want a `Cartesian3` | You want a `Cartographic` |
|----------|-------------------------|---------------------------|
| degrees lon, lat, height | `Cartesian3.fromDegrees(lon, lat, height)` | `Cartographic.fromDegrees(lon, lat, height)` |
| radians lon, lat, height | `Cartesian3.fromRadians(lon, lat, height)` | `new Cartographic(lon, lat, height)` |
| a `Cartesian3` | already have it | `Cartographic.fromCartesian(cartesian3)` |
| a `Cartographic` | `Cartographic.toCartesian(carto)` or `ellipsoid.cartographicToCartesian(carto)` | already have it |

- ALWAYS pass a `Cartesian3` to `entity.position`, `model.position`,
  `camera.flyTo({ destination })`, and primitive `modelMatrix` builders.
- NEVER pass a `Cartographic` where a `Cartesian3` is expected. It has no `x`,
  `y`, `z` in meters and silently misplaces or breaks the geometry.

## The Units Rule

`Cartographic` longitude and latitude are RADIANS. `HeadingPitchRoll` values
are RADIANS. The `fromDegrees` factories are the only place degrees are
accepted.

- ALWAYS use `Cartesian3.fromDegrees(...)` when your data is in degrees.
- NEVER write `new Cartographic(-75.0, 40.0)`. Those numbers are read as
  radians, which is roughly 4297 and 2292 degrees, producing a wild position.
- ALWAYS convert with `Cesium.Math.toRadians(deg)` when an API needs radians
  and you have degrees.

## The Argument Order Rule

Every CesiumJS coordinate factory takes LONGITUDE FIRST, then latitude, then
height: `(longitude, latitude, height)`.

- This is the opposite of the common "lat, lon" spoken order and of many other
  mapping libraries.
- NEVER pass `(latitude, longitude)`. A point meant for Amsterdam
  (`4.9, 52.4`) passed as `(52.4, 4.9)` lands in a different hemisphere.

## NaN Positions

A `Cartesian3` with any `NaN` component renders nothing and produces no error.

- **Symptom** : geometry silently absent; logging the position shows `NaN`.
- **Root cause** : `Cartesian3.fromDegrees` received `undefined`, a string, or
  a `NaN` argument, often from unparsed input or a missing object field.
- **Prevention** : validate inputs are finite numbers before calling a factory.
  ALWAYS `Number.isFinite(value)` on each coordinate from external data.
- **Recovery** : log the raw arguments at the factory call; trace the `NaN`
  back to the source field or parse step.

## Height, Terrain, and Ground Clamping

Height `0` is the WGS84 ellipsoid surface, not the terrain surface. With world
terrain loaded, ellipsoid height `0` can sit far above or below the ground.

- ALWAYS set `heightReference` to clamp an entity to the surface instead of
  guessing a height: `HeightReference.CLAMP_TO_GROUND` (terrain and 3D Tiles),
  `CLAMP_TO_TERRAIN`, or `RELATIVE_TO_GROUND`.
- A clamped entity needs a position whose longitude and latitude are correct;
  its height is then ignored.
- To read an actual terrain height, ALWAYS `await` an async sampler. Reading a
  height before terrain tiles load returns the ellipsoid height `0`.

```js
const carto = Cesium.Cartographic.fromDegrees(4.9, 52.4);
const [sampled] = await Cesium.sampleTerrainMostDetailed(
  viewer.terrainProvider,
  [carto]
);
const groundPosition = Cesium.Cartographic.toCartesian(sampled);
```

## GeoJSON Floats at Sea Level

`GeoJsonDataSource.load` defaults `clampToGround` to `false`. Polygons and
lines then draw at ellipsoid height `0`, which floats or sinks over terrain.

- ALWAYS pass `{ clampToGround: true }` to drape GeoJSON on the surface.
- This is a default, not a bug; it must be opted into.

## HeadingPitchRoll Conventions

`HeadingPitchRoll` orients a model or camera. All three values are RADIANS.

| Value | Meaning | Sign convention |
|-------|---------|-----------------|
| heading | rotation about the local up axis | 0 faces north, increases clockwise (toward east) |
| pitch | rotation about the local east axis | 0 is level; negative looks down by convention |
| roll | rotation about the local forward axis | 0 is upright |

- A model placed only with a position but no orientation defaults to an
  east-north-up frame; it is not "facing the camera".
- NEVER pass degrees to `HeadingPitchRoll`. Convert with `Cesium.Math.toRadians`.
- To place AND orient a model, build a `modelMatrix` with
  `Transforms.headingPitchRollToFixedFrame(origin, hpr)`. See
  `cesium-impl-aec-georef`.

## Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| `new Cartographic(-75, 40)` with degree numbers | Position thousands of degrees off | Use `Cartesian3.fromDegrees` or `Cartographic.fromDegrees` |
| Passing a `Cartographic` to `entity.position` | Geometry misplaced or absent | Convert with `Cartographic.toCartesian` |
| `(latitude, longitude)` argument order | Point in the wrong hemisphere | Order is `(longitude, latitude, height)` |
| Height `0` expecting the terrain surface | Geometry above or below the ground | Set `heightReference` or sample terrain |
| GeoJSON without `clampToGround: true` | Polygons float at sea level | Pass `{ clampToGround: true }` |
| `undefined` field into `fromDegrees` | `NaN` position, nothing renders | Validate inputs with `Number.isFinite` |
| Degrees passed to `HeadingPitchRoll` | Model wildly rotated | Convert with `Cesium.Math.toRadians` |

## Red Flags : STOP

- `new Cartographic(` followed by numbers larger than about 7 in magnitude.
- A coordinate factory called with a value straight from `JSON.parse` with no
  finite-number check.
- `entity.position` or `model.position` assigned something that is not the
  result of a `Cartesian3` factory.
- A polygon or line `DataSource` loaded without `clampToGround` while terrain
  is enabled.

## Reference Files

- `references/methods.md` : verified signatures for `Cartesian3`,
  `Cartographic`, the `fromDegrees` and `fromRadians` factories,
  `Cesium.Math.toRadians`, `sampleTerrainMostDetailed`, and `HeightReference`.
- `references/examples.md` : correct placement, degree-to-radian conversion,
  terrain height sampling, ground-clamped GeoJSON, and oriented model placement.
- `references/anti-patterns.md` : each coordinate failure with symptom, root
  cause, prevention, and recovery.

## Related Skills

- `cesium-core-coordinates` : the full coordinate-system reference.
- `cesium-syntax-entity` : `entity.position` and `heightReference`.
- `cesium-syntax-datasources` : GeoJSON `clampToGround`.
- `cesium-impl-aec-georef` : `Transforms` and `modelMatrix` orientation.
- `cesium-syntax-terrain` : loading a terrain provider before sampling.

## Sources

Verified via WebFetch on 2026-05-20 against the CesiumJS API Reference
(https://cesium.com/learn/cesiumjs/ref-doc/) : `Cartesian3`, `Cartographic`,
`Math`, `HeightReference`, `HeadingPitchRoll`, `sampleTerrainMostDetailed`,
`GeoJsonDataSource`.
