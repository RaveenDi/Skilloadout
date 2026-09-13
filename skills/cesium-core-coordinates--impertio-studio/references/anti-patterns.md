# Coordinate Anti-Patterns

Each entry: the broken code, the symptom, the root cause, and the fix. These
are the verified failure modes behind NaN positions, off-globe geometry, and
objects in the wrong place.

## 1. Longitude and latitude passed into the constructor

```javascript
// BROKEN: the constructor takes raw ECEF x/y/z meters.
const position = new Cesium.Cartesian3(-75.1652, 39.9526, 30.0);
```

Symptom: the entity is invisible, or the camera flies to a point near the
center of the Earth.

Root cause: `new Cartesian3(x, y, z)` stores geocentric meters. A longitude of
`-75` is interpreted as `-75` meters, placing the point essentially at the
planet core.

Fix:

```javascript
const position = Cesium.Cartesian3.fromDegrees(-75.1652, 39.9526, 30.0);
```

## 2. Latitude before longitude

```javascript
// BROKEN: latitude and longitude swapped.
const position = Cesium.Cartesian3.fromDegrees(39.9526, -75.1652, 30.0);
```

Symptom: the object appears in a plausible-looking but wrong place, often in a
different hemisphere or in the ocean.

Root cause: every `from*` factory takes `longitude` first. `39.9526` as a
longitude and `-75.1652` as a latitude is a valid coordinate, so nothing
throws.

Fix: ALWAYS order arguments `(longitude, latitude, height)`.

## 3. Reading a Cartographic radian field as degrees

```javascript
// BROKEN: carto.longitude is radians, not degrees.
const carto = Cesium.Cartographic.fromCartesian(position);
label.text = `Lon: ${carto.longitude}`; // prints ~ -1.31, not -75.16
```

Symptom: displayed coordinates are off by a factor of about 57.3 and never
match the expected lon/lat.

Root cause: `Cartographic` stores longitude and latitude in radians. The
`fromCartesian`, `fromRadians`, and `fromDegrees` factories all produce a
radian-valued object. Only the input to `fromDegrees` is degrees.

Fix:

```javascript
label.text = `Lon: ${Cesium.Math.toDegrees(carto.longitude).toFixed(4)}`;
```

## 4. Passing a Cartographic where a Cartesian3 is required

```javascript
// BROKEN: entity.position expects a Cartesian3.
const carto = Cesium.Cartographic.fromDegrees(4.9, 52.37, 10.0);
viewer.entities.add({ position: carto, point: { pixelSize: 10 } });
```

Symptom: the entity does not render, or downstream math produces NaN.

Root cause: `Cartographic` is a geographic description with `longitude`,
`latitude`, `height` fields. `entity.position`, `camera.destination`, and
`modelMatrix` origins all require a `Cartesian3` with `x`, `y`, `z`.

Fix:

```javascript
const position = Cesium.Cartographic.toCartesian(carto);
viewer.entities.add({ position, point: { pixelSize: 10 } });
```

## 5. Omitting height over real terrain

```javascript
// RISKY: height defaults to 0.0, the ellipsoid surface.
const position = Cesium.Cartesian3.fromDegrees(86.925, 27.988);
```

Symptom: in a scene with world terrain enabled, the geometry is buried inside a
mountain or floats below a valley floor.

Root cause: `fromDegrees` defaults `height` to `0.0`, which is the WGS84
ellipsoid surface, not the terrain surface. Terrain elevation is independent of
the ellipsoid.

Fix: pass an explicit height in meters, or clamp the entity to terrain with a
`heightReference` of `CLAMP_TO_GROUND` (covered by `cesium-syntax-entity`).

## 6. Treating Cartesian3 x/y/z as lon/lat/height

```javascript
// BROKEN: x is geocentric meters, not longitude.
const longitude = position.x;
const height = position.z;
```

Symptom: nonsensical values in the millions, no relation to the real
coordinate.

Root cause: `Cartesian3` is geocentric. The axes pass through the Earth center;
they do not align with longitude, latitude, or local up.

Fix: convert with `Cartographic.fromCartesian(position)`, then read
`.longitude`, `.latitude`, `.height`.

## 7. Degrees assigned directly to HeadingPitchRoll

```javascript
// BROKEN: heading expects radians.
const hpr = new Cesium.HeadingPitchRoll();
hpr.heading = 90; // 90 radians, not 90 degrees
```

Symptom: the model points in an apparently random direction and may appear to
spin.

Root cause: `HeadingPitchRoll` fields are radians. `90` radians wraps the
rotation many times around.

Fix:

```javascript
const hpr = Cesium.HeadingPitchRoll.fromDegrees(90.0, 0.0, 0.0);
```

## 8. Not guarding the undefined result of cartesianToCartographic

```javascript
// RISKY: returns undefined when the input is at the ellipsoid center.
const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(somePosition);
const lon = Cesium.Math.toDegrees(carto.longitude); // throws if undefined
```

Symptom: `TypeError: Cannot read properties of undefined`.

Root cause: `cartesianToCartographic` and `scaleToGeodeticSurface` return
`undefined` for an input exactly at the ellipsoid center, which happens with an
all-zero or uninitialized `Cartesian3`.

Fix:

```javascript
const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(somePosition);
if (Cesium.defined(carto)) {
  const lon = Cesium.Math.toDegrees(carto.longitude);
}
```

## 9. Reassigning Ellipsoid.default after positions exist

```javascript
// BROKEN: positions already computed against WGS84.
const viewer = new Cesium.Viewer("cesiumContainer");
const p = Cesium.Cartesian3.fromDegrees(0, 0, 0);
Cesium.Ellipsoid.default = Cesium.Ellipsoid.MOON; // too late
```

Symptom: a scene with positions computed against two different ellipsoids;
geometry drifts relative to the globe.

Root cause: `Ellipsoid.default` is read at the moment each conversion runs.
Changing it mid-session splits the data between two reference surfaces.

Fix: assign `Ellipsoid.default` ONCE, before constructing the `Viewer` and
before any `from*` conversion.

## 10. Skipping the local frame for an oriented object

```javascript
// BROKEN: a glTF model placed only by position has no globe-aware orientation.
const model = await Cesium.Model.fromGltfAsync({
  url: "truck.glb",
  // no modelMatrix: the model uses raw ECEF axes and tilts off the surface
});
```

Symptom: the model is tilted, lying on its side, or floating at the wrong
angle relative to the ground.

Root cause: ECEF axes do not align with local up or north. A model needs a
`modelMatrix` built from a local frame to stand upright at its location.

Fix:

```javascript
const origin = Cesium.Cartesian3.fromDegrees(-75.1652, 39.9526, 0.0);
const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
const model = await Cesium.Model.fromGltfAsync({ url: "truck.glb", modelMatrix });
```
