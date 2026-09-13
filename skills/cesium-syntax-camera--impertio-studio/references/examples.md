# Camera Syntax : Examples

Every example targets CesiumJS 1.124+ and WebGL2. All APIs are verified against the
CesiumJS API reference (https://cesium.com/learn/cesiumjs/ref-doc/).

## 1. Instant placement with setView

```js
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 4000),
  orientation: new Cesium.HeadingPitchRoll(
    Cesium.Math.toRadians(20),   // heading from north
    Cesium.Math.toRadians(-35),  // pitch, negative looks down
    0                            // roll
  ),
});
// The view is final on this frame: safe to screenshot or assert here.
```

## 2. Animated flight with the complete callback

`Camera.flyTo` returns void. Post-arrival code runs from the `complete` callback.

```js
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 4000),
  orientation: {
    heading: Cesium.Math.toRadians(0),
    pitch: Cesium.Math.toRadians(-45),
    roll: 0,
  },
  duration: 3,
  complete: function () {
    // The flight has finished; camera state is now final.
    const arrived = Cesium.Cartesian3.clone(viewer.camera.position);
  },
  cancel: function () {
    // The flight was interrupted by another camera command or by user input.
  },
});
```

To interrupt or finish a running flight:

```js
viewer.camera.cancelFlight();   // stop without firing complete
viewer.camera.completeFlight(); // jump to the end and fire complete
```

## 3. Flying to an entity with viewer.flyTo (Promise)

`viewer.flyTo` targets entities and returns a Promise, unlike `camera.flyTo`.

```js
const entity = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(4.9041, 52.3676),
  point: { pixelSize: 12 },
});

const flewSuccessfully = await viewer.flyTo(entity);
if (flewSuccessfully) {
  // The viewer flight resolved; the entity is framed.
}
```

## 4. lookAt with a HeadingPitchRange, then release the lock

```js
const center = Cesium.Cartesian3.fromDegrees(4.9041, 52.3676);

// Lock the camera onto the target. heading and pitch are radians, range is meters.
viewer.camera.lookAt(
  center,
  new Cesium.HeadingPitchRange(
    Cesium.Math.toRadians(0),
    Cesium.Math.toRadians(-30),
    1500
  )
);

// Release the reference-frame lock so free navigation works again.
viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
```

## 5. Framing a loaded tileset by its bounding sphere

```js
const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
viewer.scene.primitives.add(tileset);

// boundingSphere is valid once the async factory promise has resolved.
viewer.camera.flyToBoundingSphere(tileset.boundingSphere, {
  duration: 2,
  complete: function () {
    // the tileset now fills the view
  },
});
```

For an instant frame instead of an animation:

```js
viewer.camera.viewBoundingSphere(
  tileset.boundingSphere,
  new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 0)
);
```

## 6. Switching to an orthographic projection

```js
viewer.camera.switchToOrthographicFrustum();
// ... later, return to perspective:
viewer.camera.switchToPerspectiveFrustum();
```

## 7. Constraining user camera input

```js
const controller = viewer.scene.screenSpaceCameraController;

// Stop the camera zooming through the ground.
controller.minimumZoomDistance = 50;     // meters
controller.maximumZoomDistance = 2000000;

// Keep collision detection on so the camera stays above terrain.
controller.enableCollisionDetection = true;

// Lock out tilt while keeping rotation and zoom.
controller.enableTilt = false;
```

## 8. Reading current orientation

```js
const headingDeg = Cesium.Math.toDegrees(viewer.camera.heading);
const pitchDeg = Cesium.Math.toDegrees(viewer.camera.pitch);
const rollDeg = Cesium.Math.toDegrees(viewer.camera.roll);
```
