# Coordinate API Reference

All signatures verified via WebFetch on 2026-05-20 against the CesiumJS API
Reference (https://cesium.com/learn/cesiumjs/ref-doc/). Target version 1.124+.

## Cartesian3

An ECEF position in meters. Components `x`, `y`, `z` are geocentric, NOT
longitude, latitude, height.

| Member | Signature | Notes |
|--------|-----------|-------|
| constructor | `new Cartesian3(x, y, z)` | Raw metre components. Rarely used directly for geographic data. |
| `Cartesian3.fromDegrees` | `fromDegrees(longitude, latitude, height?, ellipsoid?, result?)` | Degrees in, `Cartesian3` out. `height` defaults `0`. |
| `Cartesian3.fromRadians` | `fromRadians(longitude, latitude, height?, ellipsoid?, result?)` | Radians in. |
| `Cartesian3.fromDegreesArray` | `fromDegreesArray([lon, lat, lon, lat, ...])` | Returns `Cartesian3[]`, height `0`. |
| `Cartesian3.fromDegreesArrayHeights` | `fromDegreesArrayHeights([lon, lat, h, ...])` | Returns `Cartesian3[]` with heights. |

`fromDegrees` is a static factory. NEVER call it with `new`; since 1.139
`Cartesian3` is an ES6 class and `new Cartesian3.fromDegrees(...)` throws.

## Cartographic

Longitude and latitude in RADIANS, height in meters.

| Member | Signature | Notes |
|--------|-----------|-------|
| constructor | `new Cartographic(longitude, latitude, height?)` | All RADIANS and meters. |
| `Cartographic.fromDegrees` | `fromDegrees(longitude, latitude, height?, result?)` | Degrees in, `Cartographic` out. |
| `Cartographic.fromRadians` | `fromRadians(longitude, latitude, height?, result?)` | Radians in. |
| `Cartographic.fromCartesian` | `fromCartesian(cartesian, ellipsoid?, result?)` | `Cartesian3` to `Cartographic`. Returns `undefined` if the cartesian is at the ellipsoid center. |
| `Cartographic.toCartesian` | `toCartesian(cartographic, ellipsoid?, result?)` | `Cartographic` to `Cartesian3`. |
| fields | `.longitude`, `.latitude`, `.height` | longitude and latitude are RADIANS. |

## Ellipsoid

| Member | Signature | Notes |
|--------|-----------|-------|
| `Ellipsoid.WGS84` | static | The standard Earth ellipsoid, the default. |
| `Ellipsoid.default` | static, settable | Process-wide default ellipsoid, introduced 1.119. |
| `cartographicToCartesian` | `ellipsoid.cartographicToCartesian(cartographic, result?)` | Instance form of the conversion. |
| `cartesianToCartographic` | `ellipsoid.cartesianToCartographic(cartesian, result?)` | Instance form. |

## Math angle helpers

| Member | Signature | Notes |
|--------|-----------|-------|
| `Cesium.Math.toRadians` | `toRadians(degrees)` | Degrees to radians. |
| `Cesium.Math.toDegrees` | `toDegrees(radians)` | Radians to degrees. |

## HeightReference (enum)

Controls how an entity graphic height is interpreted.

| Value | Meaning |
|-------|---------|
| `HeightReference.NONE` | Absolute height above the ellipsoid. |
| `HeightReference.CLAMP_TO_GROUND` | Clamped to terrain and 3D Tiles; height ignored. |
| `HeightReference.CLAMP_TO_TERRAIN` | Clamped to terrain only. |
| `HeightReference.CLAMP_TO_3D_TILE` | Clamped to 3D Tiles only. |
| `HeightReference.RELATIVE_TO_GROUND` | Height measured upward from the surface. |
| `HeightReference.RELATIVE_TO_TERRAIN` | Relative to terrain only. |
| `HeightReference.RELATIVE_TO_3D_TILE` | Relative to 3D Tiles only. |

## HeadingPitchRoll

| Member | Signature | Notes |
|--------|-----------|-------|
| constructor | `new HeadingPitchRoll(heading?, pitch?, roll?)` | All RADIANS, default `0`. |
| `HeadingPitchRoll.fromDegrees` | `fromDegrees(heading, pitch, roll, result?)` | Degrees in. |

heading is rotation about local up, `0` faces north, increases clockwise. pitch
is rotation about local east, `0` level, negative looks down by convention.
roll is rotation about local forward.

## Terrain height sampling

| Function | Signature | Notes |
|----------|-----------|-------|
| `sampleTerrainMostDetailed` | `sampleTerrainMostDetailed(terrainProvider, [Cartographic, ...])` | Async. Resolves to the same array with `.height` filled at the most detailed level. |
| `sampleTerrain` | `sampleTerrain(terrainProvider, level, [Cartographic, ...])` | Async. Samples at a fixed tile level. |
| `scene.sampleHeight` | `scene.sampleHeight(cartographic, objectsToExclude?, width?)` | Synchronous, samples loaded scene geometry including 3D Tiles. |
| `scene.clampToHeight` | `scene.clampToHeight(cartesian, objectsToExclude?, width?, result?)` | Synchronous clamp of a `Cartesian3` to scene geometry. |

`sampleTerrainMostDetailed` and `sampleTerrain` return Promises. The input
`Cartographic` array is mutated in place; `await` before reading `.height`.

## GeoJsonDataSource load option

`GeoJsonDataSource.load(data, options)` accepts `clampToGround` in `options`.
It defaults to `false`. Set `true` to drape geometry on the surface.
