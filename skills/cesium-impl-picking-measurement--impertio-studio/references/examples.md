# CesiumJS Picking and Measurement Examples

Complete, runnable recipes. Each assumes a `Viewer` exists as `viewer`.

## 1. Pick an object on left click

```js
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

handler.setInputAction((click) => {
  const picked = viewer.scene.pick(click.position);
  if (!Cesium.defined(picked)) {
    console.log("nothing picked");
    return;
  }
  if (picked.id instanceof Cesium.Entity) {
    console.log("entity:", picked.id.id);
  } else if (picked instanceof Cesium.Cesium3DTileFeature) {
    console.log("3D Tiles feature:", picked.getProperty("name"));
  } else {
    console.log("primitive:", picked.primitive);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// Teardown when the tool is removed.
// handler.destroy();
```

## 2. Pick the ground position under the cursor

`globe.pick` intersects a pick ray with the rendered terrain surface.

```js
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

handler.setInputAction((click) => {
  const ray = viewer.camera.getPickRay(click.position);
  if (!Cesium.defined(ray)) {
    return;
  }
  const groundPosition = viewer.scene.globe.pick(ray, viewer.scene);
  if (Cesium.defined(groundPosition)) {
    const carto = Cesium.Cartographic.fromCartesian(groundPosition);
    console.log(
      "lon",
      Cesium.Math.toDegrees(carto.longitude),
      "lat",
      Cesium.Math.toDegrees(carto.latitude),
      "height",
      carto.height,
    );
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

## 3. Pick a position on a model or 3D Tileset

`scene.pickPosition` reads any rendered geometry through the depth buffer.

```js
handler.setInputAction((click) => {
  if (!viewer.scene.pickPositionSupported) {
    console.warn("pickPosition is not supported on this device");
    return;
  }
  const cartesian = viewer.scene.pickPosition(click.position);
  if (Cesium.defined(cartesian)) {
    console.log("surface position:", cartesian);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

## 4. Live coordinate readout on hover

A `MOUSE_MOVE` callback receives `startPosition` and `endPosition`, never
`position`.

```js
const readout = document.getElementById("readout");

handler.setInputAction((movement) => {
  const ray = viewer.camera.getPickRay(movement.endPosition);
  const position = Cesium.defined(ray)
    ? viewer.scene.globe.pick(ray, viewer.scene)
    : undefined;
  if (Cesium.defined(position)) {
    const carto = Cesium.Cartographic.fromCartesian(position);
    readout.textContent = `${Cesium.Math.toDegrees(carto.longitude).toFixed(
      5,
    )}, ${Cesium.Math.toDegrees(carto.latitude).toFixed(5)}`;
  } else {
    readout.textContent = "off globe";
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
```

## 5. Open the InfoBox for a picked entity

```js
handler.setInputAction((click) => {
  const picked = viewer.scene.pick(click.position);
  viewer.selectedEntity =
    Cesium.defined(picked) && picked.id instanceof Cesium.Entity
      ? picked.id
      : undefined;
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

## 6. Polyline distance tool

Each click adds a vertex; the running total uses geodesic surface distance.

```js
const vertices = [];
const distanceHandler = new Cesium.ScreenSpaceEventHandler(
  viewer.scene.canvas,
);

viewer.entities.add({
  polyline: {
    positions: new Cesium.CallbackProperty(() => vertices, false),
    width: 3,
    material: Cesium.Color.YELLOW,
    clampToGround: true,
  },
});

function totalDistance() {
  let total = 0;
  for (let i = 1; i < vertices.length; i++) {
    const geodesic = new Cesium.EllipsoidGeodesic(
      Cesium.Cartographic.fromCartesian(vertices[i - 1]),
      Cesium.Cartographic.fromCartesian(vertices[i]),
    );
    total += geodesic.surfaceDistance;
  }
  return total;
}

distanceHandler.setInputAction((click) => {
  const ray = viewer.camera.getPickRay(click.position);
  const position = Cesium.defined(ray)
    ? viewer.scene.globe.pick(ray, viewer.scene)
    : undefined;
  if (Cesium.defined(position)) {
    vertices.push(position);
    console.log("total:", totalDistance().toFixed(1), "m");
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// Right click clears the measurement.
distanceHandler.setInputAction(() => {
  vertices.length = 0;
}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
```

## 7. Polygon area from picked vertices

CesiumJS has no geodesic polygon-area function. Project the vertices into a
local east-north-up plane anchored at the first vertex, then apply the
shoelace formula in that plane.

```js
function polygonArea(cartesians) {
  if (cartesians.length < 3) {
    return 0;
  }
  // Local frame anchored at the first vertex.
  const fixedFrame = Cesium.Transforms.eastNorthUpToFixedFrame(cartesians[0]);
  const toLocal = Cesium.Matrix4.inverse(fixedFrame, new Cesium.Matrix4());

  const planar = cartesians.map((c) =>
    Cesium.Matrix4.multiplyByPoint(toLocal, c, new Cesium.Cartesian3()),
  );

  // Shoelace formula on the local east-north plane.
  let twiceArea = 0;
  for (let i = 0; i < planar.length; i++) {
    const current = planar[i];
    const next = planar[(i + 1) % planar.length];
    twiceArea += current.x * next.y - next.x * current.y;
  }
  return Math.abs(twiceArea) / 2; // square meters
}
```

This is application tooling built on the verified `Transforms` and `Matrix4`
API; it is correct for areas small enough that the local plane approximation
holds.

## 8. Sample surface height without a screen pixel

```js
const positions = [
  Cesium.Cartographic.fromDegrees(4.9, 52.37),
  Cesium.Cartographic.fromDegrees(4.95, 52.4),
];

// Asynchronous, loads the finest level of detail before sampling.
const updated = await viewer.scene.sampleHeightMostDetailed(positions);
for (const carto of updated) {
  console.log("height:", carto.height);
}
```
