# Memory Anti-Patterns

Each entry: the broken code, the symptom, the root cause, and the fix. These
are the verified leak, crash, and context-budget failure modes from CesiumGS
GitHub issues and the API reference.

## 1. Dropping a Viewer reference without destroy()

```javascript
// BROKEN: the reference is gone but the WebGL context and GPU memory are not.
function closeMap() {
  viewer = null;
}
```

Symptom: GPU memory and the JavaScript heap climb every time the map is closed
and reopened. The tab slows down and eventually crashes.

Root cause: WebGL resources (textures, buffers, shaders, the context) are not
garbage-collected. Nulling the reference orphans them.

Fix:

```javascript
function closeMap() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}
```

## 2. A new Viewer per route or component mount

```javascript
// BROKEN: every navigation builds another Viewer and another WebGL context.
function showMapPage() {
  const viewer = new Cesium.Viewer("cesiumContainer");
  // previous Viewer was never destroyed
}
```

Symptom: after roughly 16 navigations the browser logs a warning about too many
active WebGL contexts and the newest `Viewer` renders a blank canvas.

Root cause: browsers cap WebGL contexts at about 16 per tab. Each `Viewer` owns
one, and `viewer.destroy()` does not always release it immediately (issue
#11533).

Fix: construct one long-lived `Viewer` and reuse it. Swap tilesets, data
sources, and the camera target instead of rebuilding. If a framework forces
remounts, destroy the previous `Viewer` in the unmount cleanup.

## 3. Removing a data source without the destroy flag

```javascript
// BROKEN: remove defaults destroy to false.
viewer.dataSources.remove(geoJsonSource);
```

Symptom: the data source disappears from the map but its memory is never
reclaimed; repeated load/remove cycles leak.

Root cause: `DataSourceCollection.remove(dataSource, destroy)` defaults `destroy`
to `false`. The data source is detached from the display but its resources stay
allocated.

Fix:

```javascript
viewer.dataSources.remove(geoJsonSource, true);
viewer.dataSources.removeAll(true); // same flag for the bulk form
```

## 4. Double-destroy after a collection remove

```javascript
// BROKEN: primitives.remove already destroyed the tileset.
scene.primitives.remove(tileset);
tileset.destroy(); // throws DeveloperError
```

Symptom: `DeveloperError: This object was destroyed, i.e., destroy() was
called.`

Root cause: `PrimitiveCollection.destroyPrimitives` defaults to `true`, so
`remove()` already destroyed the tileset. The second `destroy()` hits a
destroyed object.

Fix: remove OR destroy, never both. After `scene.primitives.remove(tileset)`
just reassign `tileset = undefined`.

## 5. Swallowing the double-destroy error with try/catch

```javascript
// BROKEN: hides an ownership bug instead of fixing it.
try {
  tileset.destroy();
} catch (e) {
  // ignore "already destroyed"
}
```

Symptom: no crash, but the real question (who owns this object) is never
answered, and the masked path can later use a destroyed object.

Root cause: a double-destroy is an ownership defect. One owner must destroy each
object exactly once. A catch turns a loud bug into a silent one.

Fix: establish a single owner. Guard with `isDestroyed()` only where teardown is
legitimately reachable from two paths (for example a React unmount and a manual
close button); never to absorb an unexplained error.

## 6. Using an object after destroy()

```javascript
// BROKEN: any call other than isDestroyed throws after destroy().
viewer.destroy();
viewer.scene.camera.flyTo({ destination });
```

Symptom: `DeveloperError` on the first method call after `destroy()`.

Root cause: after `destroy()` the object is dead. The reference reads as a live
object but every method except `isDestroyed()` throws.

Fix: reassign the reference to `undefined` immediately after `destroy()` so a
stale call fails fast at the property access rather than deep in CesiumJS.

## 7. Event listeners never removed

```javascript
// BROKEN: the listener closure keeps the whole viewer graph alive.
viewer.scene.preRender.addEventListener(updateOverlay);
// ... viewer.destroy() called later, but the listener was never removed
```

Symptom: a heap snapshot after teardown still retains the `Viewer`; memory does
not drop.

Root cause: a CesiumJS `Event` listener (and any DOM listener) holds a
reference to its callback, and the callback closure captures the `Viewer`. The
retained closure pins the entire object graph.

Fix: `addEventListener` on a CesiumJS `Event` returns a remover function. Keep
it and call it before teardown. For DOM events use `removeEventListener` with
the same handler reference.

```javascript
const removePreRender = viewer.scene.preRender.addEventListener(updateOverlay);
// teardown:
removePreRender();
```

## 8. Treating a pooled-memory plateau as a leak

```javascript
// MISDIAGNOSIS: heap did not shrink right after remove(), so "it leaks".
viewer.dataSources.remove(source, true);
// snapshot taken immediately shows the same heap size
```

Symptom: memory looks stuck right after a `remove()` or `destroy()`.

Root cause: CesiumJS pools and reuses memory, and the garbage collector runs
later. An immediate snapshot is not evidence of a leak.

Fix: run a full create-use-destroy cycle, force GC in DevTools, then compare
before/after snapshots. Only a destroyed object still showing in the retained
set is a real leak, and the retainer is usually application code.

## 9. Setting the removed maximumMemoryUsage property

```javascript
// BROKEN: maximumMemoryUsage was removed in CesiumJS 1.110.
tileset.maximumMemoryUsage = 512;
```

Symptom: no effect; the assignment writes a property CesiumJS never reads.

Root cause: `maximumMemoryUsage` was deprecated in 1.107 and removed in 1.110.
It was copied from old tutorials.

Fix: use the current properties, both in bytes.

```javascript
tileset.cacheBytes = 512 * 1024 * 1024;
tileset.maximumCacheOverflowBytes = 256 * 1024 * 1024;
```

## 10. Letting render errors stop the loop

```javascript
// RISKY: a single bad frame rethrows and kills the render loop.
viewer.scene.rethrowRenderErrors = true;
```

Symptom: one transient error (a bad tile, a brief context hiccup) freezes the
whole scene permanently.

Root cause: with `rethrowRenderErrors` set to `true`, the error is rethrown
after the `renderError` event and the loop does not continue.

Fix: keep `rethrowRenderErrors` at `false` in production so `render` returns
normally after raising `renderError`. Subscribe to `scene.renderError` for
logging, and rebuild the `Viewer` if the context is genuinely lost.
