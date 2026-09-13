# Examples : Memory-Safe CesiumJS Teardown

All code uses ES6 named imports and async factories, verified against the
CesiumJS API Reference (1.124+).

## 1. Complete teardown function

```js
import {
  Viewer,
  Cesium3DTileset,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from "cesium";

let viewer = new Viewer("cesiumContainer");
let handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
let removeTick;

async function loadScene() {
  const tileset = await Cesium3DTileset.fromUrl("/tiles/tileset.json");
  viewer.scene.primitives.add(tileset);

  handler.setInputAction((movement) => {
    // pick logic
  }, ScreenSpaceEventType.LEFT_CLICK);

  // addEventListener returns a remover function. Keep it.
  removeTick = viewer.clock.onTick.addEventListener(() => {
    // per-tick logic
  });
}

function teardown() {
  // 1. Remove event listeners.
  if (removeTick) {
    removeTick();
    removeTick = undefined;
  }

  // 2. Destroy side-channel objects the viewer does not own.
  if (handler && !handler.isDestroyed()) {
    handler.destroy();
  }
  handler = undefined;

  // 3. Destroy the viewer LAST. It cascades to scene.primitives, which
  //    destroys the tileset because destroyPrimitives is true by default.
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}
```

## 2. React useEffect cleanup

```jsx
import { useEffect, useRef } from "react";
import { Viewer } from "cesium";

export function CesiumMap() {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    // Create the viewer exactly once.
    const viewer = new Viewer(containerRef.current);
    viewerRef.current = viewer;

    return () => {
      // Cleanup runs on unmount AND on every StrictMode double-mount.
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, []); // empty deps : never re-create the viewer

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
  );
}
```

Without the cleanup return, every mount leaks one WebGL context. React
StrictMode mounts twice in development, so the leak appears immediately as the
console warning `Too many active WebGL contexts`.

## 3. destroyPrimitives false requires manual destruction

```js
import { PrimitiveCollection } from "cesium";

// A collection that must NOT auto-destroy its members, for example because
// the primitives are shared with another collection.
const shared = new PrimitiveCollection({ destroyPrimitives: false });
viewer.scene.primitives.add(shared);

// Track members yourself, because removeAll() will not destroy them.
const tracked = [];

function addTracked(primitive) {
  tracked.push(primitive);
  shared.add(primitive);
}

function clearShared() {
  shared.removeAll(); // does NOT destroy members : destroyPrimitives is false
  for (const primitive of tracked) {
    if (primitive && !primitive.isDestroyed()) {
      primitive.destroy();
    }
  }
  tracked.length = 0;
}
```

## 4. Tileset memory budget

```js
import { Cesium3DTileset } from "cesium";

const tileset = await Cesium3DTileset.fromUrl("/tiles/tileset.json", {
  cacheBytes: 256 * 1024 * 1024,               // 256 MiB target (default 512)
  maximumCacheOverflowBytes: 128 * 1024 * 1024, // 128 MiB overflow
});
viewer.scene.primitives.add(tileset);

// Measure live GPU usage instead of guessing.
console.log("tileset GPU bytes:", tileset.totalMemoryUsageInBytes);
```

## 5. Heap-snapshot diagnosis workflow

A leak that survives `destroy()` is a lost reference. Confirm it like this:

1. Open Chrome DevTools and select the Memory panel.
2. Take a heap snapshot (snapshot A).
3. Run one full add-then-teardown cycle in the app.
4. Force garbage collection, then take a second heap snapshot (snapshot B).
5. In snapshot B, set the filter to "Objects allocated between A and B".
6. Search for the CesiumJS class name. Any surviving instance is leaked.
7. Select a surviving instance and read the "Retainers" view to see what still
   references it.
8. Follow the retainer chain to the application code holding the object and
   remove that reference. The retainer is usually a closure, a module-level
   array, or an un-removed event listener, NOT CesiumJS itself.
