# Coordinate Examples

Working examples. Every API verified on 2026-05-20 against the CesiumJS API
Reference. Target version 1.124+. CesiumJS is WebGL2 only.

## 1. Correct placement from degrees

```js
// Amsterdam. Order is ALWAYS (longitude, latitude, height).
const position = Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 0);

viewer.entities.add({
  position,
  point: { pixelSize: 12, color: Cesium.Color.RED },
});
```

## 2. Degree to radian conversion

```js
// An API that needs radians, for example a raw Cartographic.
const lonRad = Cesium.Math.toRadians(4.9041);
const latRad = Cesium.Math.toRadians(52.3676);
const carto = new Cesium.Cartographic(lonRad, latRad, 0);

// The same point, more simply, with the degrees factory:
const cartoFromDeg = Cesium.Cartographic.fromDegrees(4.9041, 52.3676, 0);
```

## 3. Converting between the two types

```js
const cartesian = Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 100);

// Cartesian3 to Cartographic. Result fields are RADIANS.
const carto = Cesium.Cartographic.fromCartesian(cartesian);
console.log(Cesium.Math.toDegrees(carto.longitude)); // 4.9041
console.log(Cesium.Math.toDegrees(carto.latitude));  // 52.3676
console.log(carto.height);                            // 100

// Cartographic back to Cartesian3.
const backToCartesian = Cesium.Cartographic.toCartesian(carto);
```

## 4. Validating external input before building a position

```js
function safePosition(lon, lat, height) {
  if (![lon, lat, height].every(Number.isFinite)) {
    throw new Error(`Non-finite coordinate: ${lon}, ${lat}, ${height}`);
  }
  return Cesium.Cartesian3.fromDegrees(lon, lat, height);
}

// A missing JSON field becomes undefined, which Number.isFinite rejects,
// so the failure surfaces here instead of as a silent NaN position.
const pos = safePosition(feature.lon, feature.lat, feature.height ?? 0);
```

## 5. Clamping an entity to the ground

```js
// heightReference clamps the graphic to the surface. The position height is
// then ignored, so the longitude and latitude only need to be correct.
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(4.9041, 52.3676),
  billboard: {
    image: "/pin.png",
    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
  },
});
```

## 6. Sampling a real terrain height

```js
// Reading a height before terrain loads returns the ellipsoid height 0.
// sampleTerrainMostDetailed is async; await it.
async function placeOnTerrain(viewer, lonDeg, latDeg) {
  const carto = Cesium.Cartographic.fromDegrees(lonDeg, latDeg);
  const [sampled] = await Cesium.sampleTerrainMostDetailed(
    viewer.terrainProvider,
    [carto]
  );
  // sampled.height is now the terrain elevation in meters.
  return Cesium.Cartographic.toCartesian(sampled);
}

const groundPosition = await placeOnTerrain(viewer, 6.8651, 45.8326);
```

## 7. Ground-clamped GeoJSON

```js
// GeoJsonDataSource.load defaults clampToGround to false, which floats
// polygons at ellipsoid height 0. Opt in to drape on terrain.
const dataSource = await Cesium.GeoJsonDataSource.load("/parcels.geojson", {
  clampToGround: true,
  stroke: Cesium.Color.BLACK,
  fill: Cesium.Color.YELLOW.withAlpha(0.5),
});
viewer.dataSources.add(dataSource);
```

## 8. Placing and orienting a model

```js
// A position alone leaves the model in the default east-north-up frame.
// To orient it, build a modelMatrix from a HeadingPitchRoll in RADIANS.
const origin = Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 0);
const hpr = new Cesium.HeadingPitchRoll(
  Cesium.Math.toRadians(90), // heading: face east
  0,                          // pitch: level
  0                           // roll: upright
);
const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(origin, hpr);

const model = await Cesium.Model.fromGltfAsync({
  url: "/vehicle.glb",
  modelMatrix,
});
viewer.scene.primitives.add(model);
```

## 9. Diagnosing a NaN position

```js
const pos = Cesium.Cartesian3.fromDegrees(feature.lon, feature.lat);
if (Number.isNaN(pos.x) || Number.isNaN(pos.y) || Number.isNaN(pos.z)) {
  // A NaN component renders nothing and throws no error.
  console.error("NaN position from inputs:", feature.lon, feature.lat);
}
```
