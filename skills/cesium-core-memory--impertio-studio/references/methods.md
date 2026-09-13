# Memory API Reference

All signatures and defaults below are verified against the CesiumJS API
reference (`cesium.com/learn/cesiumjs/ref-doc/`) and CHANGES.md for the 1.124+
release line.

## The destroy / isDestroyed contract

Every object that holds WebGL resources implements the same two-method
contract.

| Method | Signature | Behavior |
|--------|-----------|----------|
| `destroy()` | `destroy()` | "Destroys the WebGL resources held by this object. Destroying an object allows for deterministic release of WebGL resources, instead of relying on the garbage collector." |
| `isDestroyed()` | `isDestroyed() → boolean` | Returns `true` once destroyed. The ONLY method safe to call after `destroy()`. |

Verified rule from the reference: "Once an object is destroyed, it should not be
used; calling any function other than `isDestroyed` will result in a
`DeveloperError` exception. Therefore, assign the return value (`undefined`) to
the object."

Objects implementing this contract include `Viewer`, `CesiumWidget`, `Scene`,
`Cesium3DTileset`, `Primitive`, `PrimitiveCollection`, `DataSourceCollection`,
and `ScreenSpaceEventHandler`.

## Viewer

| Member | Signature | Notes |
|--------|-----------|-------|
| `destroy()` | `destroy()` | "Destroys the widget. Should be called if permanently removing the widget from layout." Call before removing the container from the DOM. |
| `isDestroyed()` | `isDestroyed() → boolean` | `true` if destroyed. |
| `contextOptions` | constructor option, type `ContextOptions` | "Context and WebGL creation properties passed to Scene." |

`viewer.destroy()` tears down the `Scene` and its primitive collections. A
tileset or primitive that lives in `scene.primitives` is freed by
`viewer.destroy()`.

## Cesium3DTileset

| Member | Signature / Default | Notes |
|--------|---------------------|-------|
| `destroy()` | `destroy()` | Destroys the WebGL resources. After it, only `isDestroyed()` is safe. |
| `isDestroyed()` | `isDestroyed() → boolean` | `true` once destroyed. |
| `cacheBytes` | default `536870912` (512 MiB) | "The amount of GPU memory (in bytes) used to cache tiles." |
| `maximumCacheOverflowBytes` | default `536870912` (512 MiB) | Extra memory allowed beyond `cacheBytes` when the current view requires it. |

ALWAYS create a tileset with `Cesium3DTileset.fromUrl` or
`Cesium3DTileset.fromIonAssetId`. NEVER use `new Cesium3DTileset({url})`.

Removed property: `maximumMemoryUsage`. Deprecated in CesiumJS 1.107, removed in
1.110. The CHANGES.md note: "Cesium3DTileset.maximumMemoryUsage has been
deprecated in CesiumJS 1.107. It will be removed in 1.110. Use
Cesium3DTileset.cacheBytes and Cesium3DTileset.maximumCacheOverflowBytes
instead." NEVER emit `maximumMemoryUsage` for 1.124+.

## Primitive

| Member | Signature / Default | Notes |
|--------|---------------------|-------|
| `destroy()` | `destroy()` | Destroys the WebGL resources held by this object. |
| `isDestroyed()` | `isDestroyed() → boolean` | `true` once destroyed. |
| `asynchronous` | constructor option, boolean, default `true` | "Determines if the primitive will be created asynchronously or block until ready." |
| `allowPicking` | constructor option, boolean, default `true` | "When `false`, GPU memory is saved." A memory lever for non-interactive geometry. |

## PrimitiveCollection

`scene.primitives` is a `PrimitiveCollection`.

| Method | Signature | Notes |
|--------|-----------|-------|
| `add` | `add(primitive, index?) → object` | Adds a primitive. |
| `remove` | `remove(primitive) → boolean` | `true` if removed. Destroys the primitive when `destroyPrimitives` is `true`. |
| `removeAll` | `removeAll()` | Removes all primitives; destroys them when `destroyPrimitives` is `true`. |
| `contains` | `contains(primitive) → boolean` | Membership test. |
| `destroy()` | `destroy()` | "Destroys the WebGL resources held by each primitive in this collection." |
| `isDestroyed()` | `isDestroyed() → boolean` | `true` once destroyed. |

`destroyPrimitives` : boolean constructor option, default `true`. "Determines if
primitives in the collection are destroyed when they are removed by `remove` or
implicitly by `removeAll`." When `true` (default), `remove` and `removeAll`
destroy the primitives. When `false`, the caller must destroy them.

## DataSourceCollection

`viewer.dataSources` is a `DataSourceCollection`.

| Method | Signature | Notes |
|--------|-----------|-------|
| `add` | `add(dataSource) → Promise<DataSource>` | Adds a data source. |
| `remove` | `remove(dataSource, destroy?) → boolean` | `destroy` defaults to `false`. |
| `removeAll` | `removeAll(destroy?)` | `destroy` defaults to `false`. |
| `destroy()` | `destroy()` | Destroys the resources held by all data sources. |
| `isDestroyed()` | `isDestroyed() → boolean` | `true` once destroyed. |

CRITICAL: `remove` and `removeAll` default `destroy` to `false`. A bare
`viewer.dataSources.remove(ds)` removes the data source from the display but
does NOT free its resources. ALWAYS pass `true`:
`viewer.dataSources.remove(ds, true)`.

This is the opposite default of `PrimitiveCollection`, which destroys on remove.

## Scene context loss API

| Member | Signature / Type | Description (verified) |
|--------|------------------|------------------------|
| `renderError` | `Event` | "Gets the event that will be raised when an error is thrown inside the `render` function. The Scene instance and the thrown error are the only two parameters passed to the event handler." |
| `rethrowRenderErrors` | boolean property | "If this property is true, the error is rethrown after the event is raised. If this property is false, the `render` function returns normally after raising the event." |
| `destroy()` / `isDestroyed()` | standard contract | The `Scene` is destroyed by `viewer.destroy()`. |

The standard DOM `webglcontextlost` event fires on `viewer.canvas`. Call
`event.preventDefault()` in the handler to allow a later context restore.

## ScreenSpaceEventHandler

Any `ScreenSpaceEventHandler` you construct yourself implements `destroy()` and
`isDestroyed()`. ALWAYS destroy a handler you created before destroying the
`Viewer`. The handler owned by the `Viewer` is torn down by `viewer.destroy()`.
