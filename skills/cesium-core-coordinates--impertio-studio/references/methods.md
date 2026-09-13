# Coordinate API Reference

All signatures below are verified against the CesiumJS API reference
(`cesium.com/learn/cesiumjs/ref-doc/`) for the 1.124+ release line. Parameter
order is exact. Optional parameters are marked `?`.

## Cartesian3

An ECEF (Earth-centered, Earth-fixed) point in meters. The `x`, `y`, `z` fields
are geocentric, NOT longitude/latitude/height.

### Constructor

```javascript
new Cesium.Cartesian3(x?, y?, z?) // raw ECEF meters, all default 0.0
```

NEVER feed longitude and latitude into this constructor. Use a factory.

### Static factories

| Signature | Notes |
|-----------|-------|
| `Cartesian3.fromDegrees(longitude, latitude, height?, ellipsoid?, result?)` | Longitude and latitude in degrees, height in meters. Height defaults to `0.0`. |
| `Cartesian3.fromRadians(longitude, latitude, height?, ellipsoid?, result?)` | Same as `fromDegrees` with radian input. |
| `Cartesian3.fromDegreesArray(coordinates, ellipsoid?, result?)` | `coordinates` is a flat `[lon, lat, lon, lat, ...]` array. Height is `0.0`. |
| `Cartesian3.fromRadiansArray(coordinates, ellipsoid?, result?)` | Radian variant of `fromDegreesArray`. |
| `Cartesian3.fromDegreesArrayHeights(coordinates, ellipsoid?, result?)` | `coordinates` is a flat `[lon, lat, height, ...]` array. |
| `Cartesian3.fromRadiansArrayHeights(coordinates, ellipsoid?, result?)` | Radian variant of `fromDegreesArrayHeights`. |
| `Cartesian3.fromElements(x, y, z, result?)` | Raw ECEF meters. |
| `Cartesian3.clone(cartesian, result?)` | Duplicates an instance. |

### Static math helpers

| Signature | Returns |
|-----------|---------|
| `Cartesian3.add(left, right, result)` | `Cartesian3` |
| `Cartesian3.subtract(left, right, result)` | `Cartesian3` |
| `Cartesian3.multiplyByScalar(cartesian, scalar, result)` | `Cartesian3` |
| `Cartesian3.normalize(cartesian, result)` | `Cartesian3` |
| `Cartesian3.magnitude(cartesian)` | `number` (meters) |
| `Cartesian3.distance(left, right)` | `number` (meters) |
| `Cartesian3.midpoint(left, right, result)` | `Cartesian3` |

The `result` parameter is an output object reused to avoid allocation. When
omitted, a new `Cartesian3` is returned. NEVER pass the same object as both an
input and the `result` of a different operation unless the method documents it
as safe.

## Cartographic

Longitude and latitude in **radians**, height in meters above the ellipsoid.

### Constructor

```javascript
new Cesium.Cartographic(longitude?, latitude?, height?) // RADIANS, all 0.0
```

The constructor performs no degree conversion. The `.longitude` and `.latitude`
fields are radians.

### Static factories

| Signature | Notes |
|-----------|-------|
| `Cartographic.fromRadians(longitude, latitude, height?, result?)` | Input already radians. |
| `Cartographic.fromDegrees(longitude, latitude, height?, result?)` | Converts degree input. Resulting fields are radians. |
| `Cartographic.fromCartesian(cartesian, ellipsoid?, result?)` | Converts an ECEF position to cartographic. Default ellipsoid `Ellipsoid.default`. |
| `Cartographic.toCartesian(cartographic, ellipsoid?, result?)` | Converts to `Cartesian3`. Default ellipsoid `Ellipsoid.default`. |
| `Cartographic.clone(cartographic, result?)` | Duplicates an instance. |

## Ellipsoid

### Static properties

| Property | Notes |
|----------|-------|
| `Ellipsoid.WGS84` | The WGS84 standard ellipsoid instance. |
| `Ellipsoid.UNIT_SPHERE` | Radii `(1.0, 1.0, 1.0)`. |
| `Ellipsoid.MOON` | A sphere with the lunar radius. |
| `Ellipsoid.default` | Settable. The ellipsoid used when an `ellipsoid` argument is omitted. Defaults to WGS84. |

ALWAYS assign `Ellipsoid.default` before constructing the `Viewer` if a
non-WGS84 body is used.

### Instance methods

| Signature | Returns |
|-----------|---------|
| `cartographicToCartesian(cartographic, result?)` | `Cartesian3` |
| `cartesianToCartographic(cartesian, result?)` | `Cartographic` or `undefined` if at the center |
| `geodeticSurfaceNormal(cartesian, result?)` | `Cartesian3` unit normal |
| `scaleToGeodeticSurface(cartesian, result?)` | `Cartesian3` or `undefined` if at the center |

`cartesianToCartographic` and `scaleToGeodeticSurface` return `undefined` for an
input at the ellipsoid center. ALWAYS guard the result.

## Transforms

A namespace of static methods that build local-frame `Matrix4` transforms. The
returned matrix maps local-frame coordinates into the ECEF fixed frame and is
assigned as a `modelMatrix`.

| Signature | Returns |
|-----------|---------|
| `Transforms.eastNorthUpToFixedFrame(origin, ellipsoid?, result?)` | `Matrix4` (x=east, y=north, z=up) |
| `Transforms.northEastDownToFixedFrame(origin, ellipsoid?, result?)` | `Matrix4` (x=north, y=east, z=down) |
| `Transforms.northUpEastToFixedFrame(origin, ellipsoid?, result?)` | `Matrix4` |
| `Transforms.northWestUpToFixedFrame(origin, ellipsoid?, result?)` | `Matrix4` |
| `Transforms.headingPitchRollToFixedFrame(origin, headingPitchRoll, ellipsoid?, fixedFrameTransform?, result?)` | `Matrix4` |
| `Transforms.headingPitchRollQuaternion(origin, headingPitchRoll, ellipsoid?, fixedFrameTransform?, result?)` | `Quaternion` |
| `Transforms.fixedFrameToHeadingPitchRoll(transform, ellipsoid?, fixedFrameTransform?, result?)` | `HeadingPitchRoll` |
| `Transforms.localFrameToFixedFrameGenerator(firstAxis, secondAxis)` | a frame-builder function |

`localFrameToFixedFrameGenerator` axis strings are `"east"`, `"north"`, `"up"`,
`"west"`, `"south"`, `"down"`. The generated function has the same shape as
`eastNorthUpToFixedFrame`. The `fixedFrameTransform` argument of the
`headingPitchRoll*` methods defaults to the ENU generator.

## HeadingPitchRoll

An orientation in **radians**.

### Constructor

```javascript
new Cesium.HeadingPitchRoll(heading?, pitch?, roll?) // RADIANS, all 0.0
```

### Static factories

| Signature | Notes |
|-----------|-------|
| `HeadingPitchRoll.fromDegrees(heading, pitch, roll, result?)` | Degree input. Use this for human-supplied angles. |
| `HeadingPitchRoll.fromQuaternion(quaternion, result?)` | Derives angles from a quaternion. |
| `HeadingPitchRoll.clone(headingPitchRoll, result?)` | Duplicates an instance. |

### Semantics (verified)

- `heading` : rotation about the negative z axis. In an ENU frame this is a
  clockwise rotation from north. Heading `0` faces north.
- `pitch` : rotation about the negative y axis.
- `roll` : rotation about the positive x axis.

## Math helpers

The `Cesium.Math` namespace (alias as `CesiumMath` under ES6 named imports).

| Signature | Returns |
|-----------|---------|
| `Math.toRadians(degrees)` | `number` |
| `Math.toDegrees(radians)` | `number` |

Constants: `Math.PI`, `Math.PI_OVER_TWO`, `Math.EPSILON7` (`0.0000001`).

## Matrix4 (used with local frames)

| Signature | Returns |
|-----------|---------|
| `Matrix4.multiplyByPoint(matrix, cartesian, result)` | `Cartesian3` (point transformed by the matrix) |
| `Matrix4.multiplyByPointAsVector(matrix, cartesian, result)` | `Cartesian3` (direction, ignores translation) |
| `Matrix4.multiply(left, right, result)` | `Matrix4` |
| `Matrix4.inverse(matrix, result)` | `Matrix4` |
| `Matrix4.fromTranslationQuaternionRotationScale(translation, rotation, scale, result?)` | `Matrix4` |
| `Matrix4.IDENTITY` | constant `Matrix4` |

`multiplyByPoint` transforms a local-frame point into the ECEF fixed frame. Use
it to compute where a local offset lands on the globe.
