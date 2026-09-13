# Core Architecture : Examples

Every example targets CesiumJS 1.124+ and WebGL2. All APIs are verified against the
CesiumJS API reference (https://cesium.com/learn/cesiumjs/ref-doc/).

## 1. Correct application bootstrap

The bootstrap order is fixed. `CESIUM_BASE_URL` first, then the ion token, then the
`Viewer`, then `await` any async factory, then add data and move the camera.

```js
// Set the base URL BEFORE importing or using CesiumJS, so the static
// Workers / Assets / Widgets directories resolve.
window.CESIUM_BASE_URL = "/cesium/";

import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// Set the ion token BEFORE constructing a Viewer that uses any ion asset.
Cesium.Ion.defaultAccessToken = "<your-ion-token>";

const viewer = new Cesium.Viewer("cesiumContainer", {
  requestRenderMode: true,
  maximumRenderTimeChange: Infinity,
});

// The containment graph: globe and camera live on the scene.
const scene = viewer.scene;
const globe = scene.globe;
const camera = scene.camera;

camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 4000),
});
```

## 2. Minimal setup with CesiumWidget

When the application supplies its own UI, use `CesiumWidget` and skip every default
`Viewer` widget.

```js
window.CESIUM_BASE_URL = "/cesium/";
import * as Cesium from "cesium";

Cesium.Ion.defaultAccessToken = "<your-ion-token>";

const widget = new Cesium.CesiumWidget("cesiumContainer", {
  requestRenderMode: true,
});

// CesiumWidget exposes the same core objects as Viewer.
const scene = widget.scene;
const camera = widget.camera;
const canvas = widget.canvas;
const handler = widget.screenSpaceEventHandler;
```

## 3. requestRenderMode with a manual change

In `requestRenderMode`, Cesium detects camera and load changes automatically. A direct
mutation it cannot detect requires an explicit `scene.requestRender()`.

```js
const viewer = new Cesium.Viewer("cesiumContainer", {
  requestRenderMode: true,
  maximumRenderTimeChange: Infinity,
});

const primitive = viewer.scene.primitives.add(
  new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance(),
  })
);

// A manual modelMatrix change is NOT auto-detected.
primitive.modelMatrix = newModelMatrix;
viewer.scene.requestRender(); // force the next frame, or the scene looks frozen
```

## 4. Hooking the render loop

Per-frame logic belongs on a `Scene` event, never on a separate
`requestAnimationFrame` loop, so it stays synchronised with Cesium's frame timing.

```js
const scene = viewer.scene;

function onPreUpdate(s, time) {
  // runs before each frame is updated
}

scene.preUpdate.addEventListener(onPreUpdate);

// During teardown, remove the listener before destroying the viewer.
scene.preUpdate.removeEventListener(onPreUpdate);
```

The four events fire in order each frame: `preUpdate`, `postUpdate`, `preRender`,
`postRender`.

## 5. Switching SceneMode

```js
const scene = viewer.scene;

// Read the current mode.
if (scene.mode === Cesium.SceneMode.SCENE3D) {
  // currently in 3D
}

// Morph over 2 seconds.
scene.morphTo2D(2.0);
scene.morphToColumbusView(2.0);
scene.morphTo3D(2.0);

// Morph instantly.
scene.morphTo2D(0.0);
```

When the application never leaves 3D, set `scene3DOnly` at construction instead:

```js
const viewer = new Cesium.Viewer("cesiumContainer", {
  scene3DOnly: true, // skips 2D and Columbus View geometry batches
});
```

## 6. Reading the containment graph

```js
const viewer = new Cesium.Viewer("cesiumContainer");

// Correct paths.
const globe = viewer.scene.globe;
const camera = viewer.scene.camera;          // also viewer.camera
const primitives = viewer.scene.primitives;
const widget = viewer.cesiumWidget;          // the wrapped CesiumWidget

// There is NO back-reference. Pass objects into functions explicitly.
function frameGlobe(scene) {
  scene.camera.flyHome(0);
}
frameGlobe(viewer.scene);
```

## 7. Camera state after an animated move

`flyTo` is animated and resolves on a later frame. ALWAYS wait for its promise before
reading the final camera state.

```js
await viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 4000),
});
// The camera has now arrived; reading position here is correct.
const arrived = Cesium.Cartesian3.clone(viewer.camera.position);
```
