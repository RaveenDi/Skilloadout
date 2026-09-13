# Core Performance : Examples

Every example targets CesiumJS 1.124+ and WebGL2. All APIs are verified against the
CesiumJS API reference (https://cesium.com/learn/cesiumjs/ref-doc/).

## 1. Measure the baseline

ALWAYS measure before applying any lever.

```js
const viewer = new Cesium.Viewer("cesiumContainer");

// Overlay shows frames per second and milliseconds per frame.
viewer.scene.debugShowFramesPerSecond = true;

// Read the overlay, record the numbers, then apply ONE lever and re-read.
```

## 2. requestRenderMode for a static scene

```js
const viewer = new Cesium.Viewer("cesiumContainer", {
  requestRenderMode: true,
  maximumRenderTimeChange: Infinity, // no time-dynamic data, never auto-render on time
});

// A change Cesium cannot detect needs an explicit request.
someMaterial.uniforms.color = Cesium.Color.RED;
viewer.scene.requestRender();
```

When the scene has clock-driven data, use a finite value instead of `Infinity`:

```js
const viewer = new Cesium.Viewer("cesiumContainer", {
  requestRenderMode: true,
  maximumRenderTimeChange: 1.0, // allow 1 simulation second before an auto-render
});
```

## 3. Tileset level-of-detail tuning

The tileset is the bottleneck. Raise the screen-space error budget first.

```js
const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
viewer.scene.primitives.add(tileset);

// Default is 16. A value of 32 roughly halves the tile count.
tileset.maximumScreenSpaceError = 32;

// Do NOT keep loading tiles while the tileset is hidden.
tileset.preloadWhenHidden = false;
```

Progressive coarse-to-fine refinement, accepted only when explicitly wanted:

```js
tileset.skipLevelOfDetail = true; // increases peak memory and request bursts
tileset.preferLeaves = true;
```

## 4. Per-frame render-cost tuning on a low-end GPU

```js
const scene = viewer.scene;

// MSAA defaults to 4 samples. Lower it when the millisecond count is high.
scene.msaaSamples = 1; // disables MSAA

// Keep fog enabled; it culls distant terrain tiles and requests.
scene.fog.enabled = true;
scene.fog.density = 0.0008; // slightly denser fog culls more distant geometry
```

## 5. RequestScheduler per-server override

Raise concurrency for one CDN that allows it, instead of raising the global limit.

```js
// RequestScheduler is static: configure it, never instantiate it.
Cesium.RequestScheduler.requestsByServer["tiles.example.com:443"] = 30;

// Keep global throttling on so other servers stay protected.
Cesium.RequestScheduler.throttleRequests = true;
```

## 6. Offloading work to a TaskProcessor

```js
// Move heavy computation off the main thread. At most 5 tasks run concurrently.
const processor = new Cesium.TaskProcessor("myWorker.js", 5);

function runTask(payload) {
  const promise = processor.scheduleTask({ payload }, [payload.buffer]);
  if (!Cesium.defined(promise)) {
    // undefined means the queue is full: back-pressure, not an error. Retry later.
    return undefined;
  }
  return promise;
}

// During teardown, terminate the worker so it does not leak.
processor.destroy();
```

## 7. A complete measured tuning pass

```js
const viewer = new Cesium.Viewer("cesiumContainer", {
  requestRenderMode: true,
  maximumRenderTimeChange: Infinity,
});
viewer.scene.debugShowFramesPerSecond = true;

const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
viewer.scene.primitives.add(tileset);

// Lever applied one at a time; re-read the FPS overlay after each line.
tileset.maximumScreenSpaceError = 24;  // step 1: re-measure
viewer.scene.msaaSamples = 2;          // step 2: re-measure
viewer.scene.fog.density = 0.0008;     // step 3: re-measure
```
