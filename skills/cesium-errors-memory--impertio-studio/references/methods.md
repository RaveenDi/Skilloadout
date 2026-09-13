# Methods : Memory and Teardown APIs

All signatures verified via WebFetch on 2026-05-20 against the CesiumJS API
Reference at https://cesium.com/learn/cesiumjs/ref-doc/ . Target : CesiumJS 1.124+.

## destroy() and isDestroyed()

These two methods appear together on several classes : `Viewer`, `Scene`,
`Cesium3DTileset`, `PrimitiveCollection`, `Primitive`, `Model`, and
`ScreenSpaceEventHandler`.

`destroy()` : "Destroys the WebGL resources held by this object. Destroying an
object allows for deterministic release of WebGL resources, instead of relying
on the garbage collector to destroy this object."

`isDestroyed() -> boolean` : returns `true` once the object has been destroyed,
`false` otherwise.

Contract : "Once an object is destroyed, it should not be used; calling any
function other than `isDestroyed` will result in a `DeveloperError` exception."

`Viewer.destroy()` : "Destroys the widget. Should be called if permanently
removing the widget from layout." It cascades to the `Scene` and the
collections the viewer owns.

`ScreenSpaceEventHandler.destroy()` : "Removes listeners held by this object."
The viewer does NOT own handlers you construct; destroy them yourself.

`EntityCollection` has NO `destroy()` method. Its API surface is `add`,
`remove`, `removeAll`, `removeById`, and `contains`. Entities are released by
`remove(entity)` or `removeAll()`; visualizers free the GPU primitives on the
next render pass.

## PrimitiveCollection

Verified method signatures :

- `add(primitive, index) -> object`
- `remove(primitive) -> boolean`
- `removeAll()`
- `contains(primitive) -> boolean`
- `destroy()`
- `isDestroyed() -> boolean`

Constructor option and property `destroyPrimitives` (boolean, default `true`) :
"Determines if primitives in the collection are destroyed when they are removed
by `PrimitiveCollection#destroy` or `PrimitiveCollection#remove` or implicitly
by `PrimitiveCollection#removeAll`."

- `true` (default) : `remove`, `removeAll`, and `destroy` destroy each member.
- `false` : the collection never destroys members; the caller must.

`viewer.scene.primitives` is a `PrimitiveCollection` documented as "Gets the
collection of primitives." Its `destroyPrimitives` is at the default `true`, so
removing a tileset or model from it destroys that object.

## DataSourceCollection

- `remove(dataSource, destroy) -> boolean` : `destroy` is optional, default
  `false`. Pass `true` to destroy the data source in addition to removing it.
  Returns `true` if the data source was in the collection and was removed.
- `removeAll(destroy)` : `destroy` optional, default `false`.

Because the default is `false`, `viewer.dataSources.remove(ds)` removes the
data source from the scene but does NOT free it. Use
`viewer.dataSources.remove(ds, true)`.

## Cesium3DTileset memory budget

- `static Cesium3DTileset.fromUrl(url, options) -> Promise<Cesium3DTileset>` :
  the only supported construction path. NEVER use `new Cesium3DTileset({url})`.
- `cacheBytes` (number, default `536870912`, 512 MiB) : GPU memory target for
  the tile cache.
- `maximumCacheOverflowBytes` (number, default `536870912`) : extra GPU memory
  allowed when the working set exceeds `cacheBytes`.
- `totalMemoryUsageInBytes` (readonly number) : estimated total GPU memory
  consumed by loaded tiles. Use it to measure, not to set.
- `maximumMemoryUsage` : REMOVED. The property no longer exists; assigning to
  it does nothing.

Lower `cacheBytes` to cap peak GPU memory; the tradeoff is more tile
refetching when the camera revisits an area.

## Scene render-error surface

- `renderError` event : "Gets the event that will be raised when an error is
  thrown inside the `render` function. The `Scene` instance and the thrown
  error are the only two parameters passed to the event handler."
- `rethrowRenderErrors` (boolean) : "If this property is true, the error is
  rethrown after the event is raised."
- `Scene.destroy()` : destroys the WebGL resources held by the scene.

A `CONTEXT_LOST_WEBGL` failure surfaces through `renderError`. Context-loss
recovery is not richly documented in CesiumJS and should be treated as a known
limitation : prevention (one reused viewer) beats recovery.

## ScreenSpaceEventHandler

- `setInputAction(action, type, modifier)` : `modifier` is optional.
- `removeInputAction(type, modifier)` : `modifier` is optional.
- `destroy()` and `isDestroyed()` as documented above.

## Source URLs

- https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html
- https://cesium.com/learn/cesiumjs/ref-doc/Scene.html
- https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html
- https://cesium.com/learn/cesiumjs/ref-doc/PrimitiveCollection.html
- https://cesium.com/learn/cesiumjs/ref-doc/DataSourceCollection.html
- https://cesium.com/learn/cesiumjs/ref-doc/EntityCollection.html
- https://cesium.com/learn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
