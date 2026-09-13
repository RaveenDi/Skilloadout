# Memory Examples

Complete, runnable teardown and memory-management patterns. All code is verified
against the CesiumJS 1.124+ API reference. Examples use the `Cesium.` namespace
prefix.

## 1. Full Viewer teardown

```javascript
function destroyViewer(viewer) {
  // The isDestroyed guard makes teardown safe from multiple code paths.
  if (Cesium.defined(viewer) && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  return undefined;
}

// Usage: capture the return value so the variable can never be reused.
viewer = destroyViewer(viewer);
```

`viewer.destroy()` tears down the `Scene`, its primitive collections, and the
`ScreenSpaceEventHandler` the `Viewer` owns. Call it before removing the
container element from the DOM.

## 2. Tracked teardown of self-owned resources

```javascript
// Track only what you constructed yourself and intend to remove individually.
const owned = { handler: null, tilesets: [], listenerRemovers: [] };

function startSession(viewer) {
  // A handler you create yourself is yours to destroy.
  owned.handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

  // Cesium Event subscriptions return a remover function. Keep it.
  owned.listenerRemovers.push(
    viewer.scene.preUpdate.addEventListener(() => {}),
  );
}

function endSession(viewer) {
  owned.listenerRemovers.forEach((remove) => remove());
  owned.listenerRemovers.length = 0;

  if (owned.handler && !owned.handler.isDestroyed()) {
    owned.handler.destroy();
  }
  owned.handler = null;

  // Tilesets in scene.primitives are freed by viewer.destroy(); do not
  // destroy them here as well. Just drop the references.
  owned.tilesets.length = 0;

  destroyViewer(viewer);
}
```

## 3. Remove a tileset mid-session

```javascript
// scene.primitives has destroyPrimitives = true, so remove() destroys it.
function removeTileset(scene, tileset) {
  scene.primitives.remove(tileset); // destroys the tileset
  return undefined;                 // never call tileset.destroy() after this
}

tileset = removeTileset(viewer.scene, tileset);
```

## 4. Remove a data source mid-session

```javascript
// dataSources.remove defaults destroy to FALSE. The `true` is mandatory.
async function removeDataSource(viewer, dataSource) {
  viewer.dataSources.remove(dataSource, true); // true = also free resources
  return undefined;
}
```

```javascript
// Free every data source at once.
viewer.dataSources.removeAll(true);
```

## 5. Cap tileset GPU memory on a constrained device

```javascript
const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188, {
  cacheBytes: 256 * 1024 * 1024,             // 256 MiB instead of the 512 default
  maximumCacheOverflowBytes: 128 * 1024 * 1024,
});
viewer.scene.primitives.add(tileset);
```

Lower `cacheBytes` whenever the target is mobile or an embedded kiosk. Higher
values keep more tiles resident and reduce re-streaming at the cost of GPU
memory.

## 6. WebGL context loss handler

```javascript
function installContextLossHandlers(viewer) {
  // The standard DOM event. preventDefault allows a later restore.
  viewer.canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      console.warn("WebGL context lost; the scene must be rebuilt.");
    },
    false,
  );

  // The CesiumJS render-loop error event.
  viewer.scene.renderError.addEventListener((scene, error) => {
    console.error("Render error raised:", error);
  });

  // Keep render errors caught so one bad frame does not stop the loop.
  viewer.scene.rethrowRenderErrors = false;
}
```

## 7. React: reuse one Viewer, destroy on unmount

```javascript
import { useEffect, useRef } from "react";
import * as Cesium from "cesium";

function CesiumMap() {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    // Construct exactly one Viewer for the lifetime of this mount.
    viewerRef.current = new Cesium.Viewer(containerRef.current);

    return () => {
      // Unmount cleanup: destroy so the WebGL context is released.
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, []); // empty deps: never reconstruct on re-render

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
```

Skipping the cleanup function leaks one WebGL context per mount. After roughly
16 mounts the browser refuses new contexts and the map renders blank.

## 8. Confirm a real leak before chasing it

```javascript
// Run this cycle, then in DevTools: force GC, take a heap snapshot, compare.
async function leakProbeCycle() {
  const probe = new Cesium.Viewer("probeContainer");
  const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
  probe.scene.primitives.add(tileset);
  await new Promise((resolve) => setTimeout(resolve, 3000));
  probe.destroy(); // tileset is freed with the scene
}
```

If a heap snapshot taken after forced GC still retains the destroyed `Viewer`,
follow the retainer chain in DevTools. The retainer is almost always a closure,
an array, or an event listener in application code, not a CesiumJS bug.
