# Coordinate Examples

Complete, runnable patterns. All code is verified against the CesiumJS 1.124+
API reference. Examples use the `Cesium.` namespace prefix; under ES6 named
imports, alias the `Math` namespace as shown in the final example.

## 1. Place a point from longitude and latitude

```javascript
// Independence Hall, Philadelphia. Order is ALWAYS (lon, lat, height).
const position = Cesium.Cartesian3.fromDegrees(-75.1503, 39.9489, 25.0);

viewer.entities.add({
  name: "Independence Hall",
  position: position,
  point: {
    pixelSize: 14,
    color: Cesium.Color.CYAN,
    outlineColor: Cesium.Color.BLACK,
    outlineWidth: 2,
  },
});

viewer.flyTo(viewer.entities.values[0]);
```

## 2. Read a position back as longitude and latitude

```javascript
function describePosition(position) {
  // fromCartesian returns a Cartographic whose fields are RADIANS.
  const carto = Cesium.Cartographic.fromCartesian(position);
  if (!Cesium.defined(carto)) {
    throw new Error("Position is at the ellipsoid center; no lon/lat exists.");
  }
  return {
    longitude: Cesium.Math.toDegrees(carto.longitude),
    latitude: Cesium.Math.toDegrees(carto.latitude),
    height: carto.height, // already meters, no conversion
  };
}

const info = describePosition(Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 8.0));
// info.longitude is ~4.9041, info.latitude is ~52.3676
```

## 3. Build a polygon ring and a flight path

```javascript
// Flat [lon, lat, ...] pairs. All vertices land at height 0.
const ring = Cesium.Cartesian3.fromDegreesArray([
  -75.17, 39.95,
  -75.16, 39.95,
  -75.16, 39.96,
  -75.17, 39.96,
]);

viewer.entities.add({
  polygon: {
    hierarchy: ring,
    material: Cesium.Color.ORANGE.withAlpha(0.5),
  },
});

// Flat [lon, lat, height, ...] triples for an elevated path.
const flightPath = Cesium.Cartesian3.fromDegreesArrayHeights([
  -75.17, 39.95, 150.0,
  -75.16, 39.96, 320.0,
  -75.15, 39.95, 150.0,
]);

viewer.entities.add({
  polyline: { positions: flightPath, width: 3, material: Cesium.Color.RED },
});
```

## 4. Convert with the ellipsoid directly

```javascript
const carto = Cesium.Cartographic.fromDegrees(13.4050, 52.5200, 34.0);

// Cartographic -> Cartesian3
const position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);

// Cartesian3 -> Cartographic (guard the undefined-at-center case)
const back = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
if (Cesium.defined(back)) {
  console.log(Cesium.Math.toDegrees(back.longitude));
}
```

## 5. Place an oriented 3D model with a local frame

```javascript
async function addOrientedModel(scene, url) {
  const origin = Cesium.Cartesian3.fromDegrees(-75.1652, 39.9526, 0.0);

  // 90 degree heading: model faces east. Pitch and roll are 0.
  const hpr = Cesium.HeadingPitchRoll.fromDegrees(90.0, 0.0, 0.0);

  // headingPitchRollToFixedFrame builds the ECEF modelMatrix.
  const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(origin, hpr);

  // ALWAYS use the async factory; never `new Model()`.
  const model = await Cesium.Model.fromGltfAsync({ url, modelMatrix });
  return scene.primitives.add(model);
}
```

## 6. East-North-Up frame and a local offset

```javascript
// Compute where a point 50 m east and 20 m up of an origin lands in ECEF.
const origin = Cesium.Cartesian3.fromDegrees(-75.1652, 39.9526, 0.0);
const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin);

const localOffset = new Cesium.Cartesian3(50.0, 0.0, 20.0); // east, north, up
const ecefPoint = Cesium.Matrix4.multiplyByPoint(
  enuMatrix,
  localOffset,
  new Cesium.Cartesian3(),
);

viewer.entities.add({
  position: ecefPoint,
  point: { pixelSize: 10, color: Cesium.Color.LIME },
});
```

## 7. A non-ENU frame with the generator

```javascript
// Build a north-west-up frame builder, then a matrix at an origin.
const nwuFromFixedFrame = Cesium.Transforms.localFrameToFixedFrameGenerator(
  "north",
  "west",
);
const origin = Cesium.Cartesian3.fromDegrees(2.3522, 48.8566, 0.0);
const nwuMatrix = nwuFromFixedFrame(origin);
```

## 8. Distance and midpoint between two positions

```javascript
const a = Cesium.Cartesian3.fromDegrees(-75.17, 39.95, 0.0);
const b = Cesium.Cartesian3.fromDegrees(-75.15, 39.96, 0.0);

const straightLineMeters = Cesium.Cartesian3.distance(a, b);
const mid = Cesium.Cartesian3.midpoint(a, b, new Cesium.Cartesian3());
```

`Cartesian3.distance` is the straight-line ECEF chord length, NOT the
ground-following geodesic distance. For surface distance use
`EllipsoidGeodesic`.

## 9. ES6 named imports with the Math alias

```javascript
import { Cartesian3, HeadingPitchRoll, Transforms, Math as CesiumMath } from "cesium";

const heading = CesiumMath.toRadians(45.0);
const hpr = new HeadingPitchRoll(heading, 0.0, 0.0);
const origin = Cartesian3.fromDegrees(-75.1652, 39.9526, 0.0);
const modelMatrix = Transforms.headingPitchRollToFixedFrame(origin, hpr);
```

The `Math` namespace ALWAYS collides with the JavaScript global under named
imports. NEVER import it as bare `Math`.
