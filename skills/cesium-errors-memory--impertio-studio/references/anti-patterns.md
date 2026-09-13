# Memory Anti-Patterns

Each entry lists symptom, root cause, prevention, and recovery. Failures are
traced to the CesiumGS GitHub issues recorded in the project research base and
verified against the API reference on the approved sources.

## 1. Dropped reference without destroy()

**Symptom:** GPU and heap memory climb every time a tileset, model, or
primitive loads. The tab eventually slows or throws `CONTEXT_LOST_WEBGL`.

**Root cause:** WebGL buffers, textures, and shaders held by a CesiumJS object
are NOT garbage collected. Setting the variable to `null` or letting it leave
scope frees the JavaScript wrapper but leaves the GPU resources allocated. Only
`destroy()` releases them.

**Prevention:** ALWAYS pair object creation with a `destroy()` call on the
matching teardown path. Objects inside `viewer.scene.primitives` are covered by
a single `viewer.destroy()`; destroy side-channel objects explicitly.

**Recovery:** List every object created since startup. For each, confirm a
`destroy()` runs on teardown, add the missing call, and assert `isDestroyed()`
returns `true`.

## 2. Reusing an object after destroy()

**Symptom:** `DeveloperError: This object was destroyed and should not be used.`
thrown when a method runs on a tileset, primitive, viewer, or handler.

**Root cause:** The object was destroyed, then a method was called on it. A
common trigger is `scene.primitives.remove(primitive)`, which destroys the
primitive because `PrimitiveCollection.destroyPrimitives` defaults to `true`,
while stale code keeps and reuses the reference. The same happens after
`viewer.destroy()`.

**Prevention:** After `remove()` or `destroy()`, set the reference to `null`
immediately. Guard any potential reuse with `if (!obj.isDestroyed())`.

**Recovery:** Stop reusing the destroyed instance. Recreate it through its
async factory (`Cesium3DTileset.fromUrl`, `Model.fromGltfAsync`).

## 3. Silent leak with destroyPrimitives set to false

**Symptom:** Heap grows across add and remove cycles even though `remove()` or
`removeAll()` is called every time.

**Root cause:** A `PrimitiveCollection` constructed with
`{ destroyPrimitives: false }` does NOT destroy its members on `remove`,
`removeAll`, or `destroy`. The caller owns destruction and skipped it.

**Prevention:** Keep `destroyPrimitives` at its default `true` unless
primitives are deliberately shared between collections. When it must be
`false`, call `destroy()` on each primitive after removing it.

**Recovery:** Track members in an array. On clear, call `destroy()` on each
member, then `removeAll()`.

## 4. Memory retained after entity removal

**Symptom:** After `viewer.entities.removeAll()`, CPU memory stays high. With
very large entity counts the app stutters every tick.

**Root cause:** `EntityCollection` has no `destroy()` method. Entity
visualizers free the underlying GPU primitives lazily on the next render pass,
and the per-tick visualizer loop scales with entity count. Historically about
100 MB per 5000 entities. Verified against issues #6534 and #8767.

**Prevention:** Cap entity count. Above roughly 10000 features migrate to
`Cesium3DTileset` or batched `Primitive` plus `GeometryInstance`. Reuse
entities instead of churning remove and add.

**Recovery:** Call `removeAll()`, then allow one render pass so visualizers
release primitives. For a hard reset, call `viewer.destroy()` and create one
fresh viewer.

## 5. Lost reference mistaken for a leak

**Symptom:** A Chrome heap snapshot diff shows CesiumJS objects surviving an
add and remove cycle even though `destroy()` was called.

**Root cause:** CesiumJS pools and reuses memory, so modest steady-state growth
is expected. A genuinely retained object is almost always held by application
code: a closure, a module-level array, an un-removed event listener
(`clock.onTick`, `scene.preRender`, `camera.changed`), a
`requestAnimationFrame` callback, or framework state. A pending `Request` can
also retain an XHR response. Verified against issue #8843.

**Prevention:** Store each CesiumJS object in exactly one owner. For every
`addEventListener` on a CesiumJS `Event`, keep the returned remover function
and call it on teardown.

**Recovery:** Take two Chrome heap snapshots around one cycle, diff the
retainers, and follow the retaining path to the application code holding the
reference. Remove that path.

## 6. Too many active WebGL contexts

**Symptom:** Console warning `WARNING: Too many active WebGL contexts. Oldest
context will be lost.` An older Cesium view goes blank or throws
`CONTEXT_LOST_WEBGL`.

**Root cause:** A browser tab allows only about 16 live WebGL contexts. Each
`Viewer` and each `CesiumWidget` holds one. Single-page-app route changes,
React component re-mounts, and modal open and close cycles create new viewers
faster than old ones are destroyed. `viewer.destroy()` does not always release
the context immediately. Verified against issue #11533.

**Prevention:** Create exactly ONE `Viewer` and reuse it across routes and
components. ALWAYS call `viewer.destroy()` in the unmount or cleanup path.
NEVER construct a `Viewer` inside a function that runs on every render.

**Recovery:** Destroy every stray viewer, consolidate to a single long-lived
viewer, and in React hold the viewer in a `useRef` so it is created once.

## 7. New Viewer constructed on a repeating code path

**Symptom:** Memory climbs on every navigation or re-render. The 16-context
warning appears after a dozen route changes.

**Root cause:** A `Viewer` is constructed inside a React `render`, a
`useEffect` without a cleanup return, or a loop. Each invocation builds a new
viewer and its WebGL context while the previous one is never destroyed.

**Prevention:** Construct the `Viewer` once. In React, create it in a
`useEffect` with an empty dependency array and return a cleanup function that
calls `viewer.destroy()`.

**Recovery:** Move construction out of the repeating path. Add the cleanup that
destroys the viewer on unmount.

## 8. Event listeners left attached on teardown

**Symptom:** After teardown, callbacks still fire, or a heap snapshot shows the
viewer retained through an `Event` subscriber list.

**Root cause:** `addEventListener` on a CesiumJS `Event` such as
`clock.onTick`, `scene.preRender`, or `camera.changed` returns a remover
function. If the remover is never called, the subscriber list keeps the
callback, and the callback closure keeps every object it references alive.

**Prevention:** For every `addEventListener` on a CesiumJS `Event`, store the
returned remover and call it during teardown, before `viewer.destroy()`.

**Recovery:** Audit every `addEventListener` call. Pair each with its remover
on the cleanup path.

## 9. DataSource removed without the destroy flag

**Symptom:** Heap grows across data-source load and unload cycles even though
`viewer.dataSources.remove(ds)` is called every time.

**Root cause:** `DataSourceCollection.remove(dataSource, destroy)` takes a
second `destroy` parameter that defaults to `false`. With the default the data
source is detached but never destroyed, so its primitives stay on the GPU.

**Prevention:** ALWAYS pass `true` as the second argument:
`viewer.dataSources.remove(ds, true)`.

**Recovery:** Change every `remove(ds)` call to `remove(ds, true)`. For data
sources already leaked, call `removeAll(true)`.

## 10. Setting the removed maximumMemoryUsage property

**Symptom:** A `Cesium3DTileset` uses far more GPU memory than the value the
code tried to set, and no error is thrown.

**Root cause:** The `maximumMemoryUsage` property was removed. The GPU cache is
now bounded by `cacheBytes` (default 536870912, 512 MiB) plus
`maximumCacheOverflowBytes`. Assigning `maximumMemoryUsage` writes an ignored
property and silently does nothing.

**Prevention:** ALWAYS bound tileset memory with `cacheBytes`. Read live usage
from `tileset.totalMemoryUsageInBytes`.

**Recovery:** Replace every `maximumMemoryUsage` assignment with a `cacheBytes`
value passed to the `Cesium3DTileset.fromUrl` options or set on the tileset.
