# Cesium3DTileset API Reference

Verified against the CesiumJS API reference (cesium.com/learn/cesiumjs/ref-doc)
and the 3D Tiles specification (github.com/CesiumGS/3d-tiles) for CesiumJS
1.124+.

## Static Factory Methods

A `Cesium3DTileset` is ALWAYS created through one of these. Both return a
`Promise<Cesium3DTileset>` that resolves once the tileset JSON is loaded and
the tileset is ready. Both reject on a network, CORS, token, or unsupported
version failure.

| Factory | Signature | Purpose |
|---------|-----------|---------|
| `Cesium3DTileset.fromUrl` | `fromUrl(url, options?)` | Load from a `tileset.json` URL |
| `Cesium3DTileset.fromIonAssetId` | `fromIonAssetId(assetId, options?)` | Load from a Cesium ion asset |

- `url` : `Resource | string`. The location of the `tileset.json` file.
- `assetId` : `number`. The Cesium ion asset id.
- `options` : `Cesium3DTileset.ConstructorOptions`, optional.

The synchronous `new Cesium3DTileset({ url })` constructor path and the
`readyPromise` and `.ready` members were removed in CesiumJS 1.107. NEVER use
them.

## Constructor Options

`options` passed to either factory. Selected fields:

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `show` | boolean | `true` | Whether the tileset renders |
| `modelMatrix` | `Matrix4` | `Matrix4.IDENTITY` | Transform applied to the whole tileset |
| `maximumScreenSpaceError` | number | `16` | Detail threshold in pixels |
| `cacheBytes` | number | `536870912` | Target tile cache size (512 MiB) |
| `maximumCacheOverflowBytes` | number | `536870912` | Extra cache allowed on demand |
| `style` | `Cesium3DTileStyle` | `undefined` | Feature styling expression |
| `clippingPlanes` | `ClippingPlaneCollection` | `undefined` | Plane clipping |
| `clippingPolygons` | `ClippingPolygonCollection` | `undefined` | Polygon clipping |
| `customShader` | `CustomShader` | `undefined` | Custom GLSL shading |
| `enableCollision` | boolean | `false` | Camera collision against the tileset |
| `preloadWhenHidden` | boolean | `false` | Keep loading while `show` is false |
| `preloadFlightDestinations` | boolean | `true` | Preload tiles at a camera-flight target |
| `skipLevelOfDetail` | boolean | `false` | Skip intermediate LOD tiles |
| `foveatedScreenSpaceError` | boolean | `true` | Lower detail toward the screen edges |

## Instance Properties

| Property | Type | Access | Notes |
|----------|------|--------|-------|
| `show` | boolean | read / write | Visibility toggle |
| `modelMatrix` | `Matrix4` | read / write | Tileset transform |
| `maximumScreenSpaceError` | number | read / write | Detail threshold, default `16` |
| `cacheBytes` | number | read / write | Tile cache target |
| `maximumCacheOverflowBytes` | number | read / write | Cache overflow bound |
| `style` | `Cesium3DTileStyle` | read / write | Set `undefined` to clear |
| `clippingPlanes` | `ClippingPlaneCollection` | read / write | Plane clipping |
| `clippingPolygons` | `ClippingPolygonCollection` | read / write | Polygon clipping |
| `boundingSphere` | `BoundingSphere` | read-only | Valid only after the promise resolves |
| `root` | `Cesium3DTile` | read-only | Root tile of the tree |
| `tilesLoaded` | boolean | read-only | True when the current view is fully loaded |
| `properties` | object | read-only | 3D Tiles 1.0 metadata, deprecated in 1.1 |

## Events

Add a listener with `tileset.<event>.addEventListener(callback)`.

| Event | Fires when | Callback argument |
|-------|-----------|-------------------|
| `tileLoad` | A tile's content finished loading | the tile |
| `tileFailed` | A tile's content failed to load | `{ url, message }` |
| `tileVisible` | Once for each visible tile in a frame | the tile |
| `allTilesLoaded` | Every tile meeting screen-space error this frame is loaded | none |
| `initialTilesLoaded` | The initial-view tiles finished loading (fired once) | none |
| `tileUnload` | A tile's content was unloaded from the cache | the tile |

## Methods

| Method | Signature | Purpose |
|--------|-----------|---------|
| `makeStyleDirty` | `makeStyleDirty()` | Force features to re-evaluate the style next frame |
| `isDestroyed` | `isDestroyed()` returns `boolean` | Whether `destroy` has been called |
| `destroy` | `destroy()` | Release the WebGL resources held by the tileset |

ALWAYS call `tileset.destroy()` before dropping the last reference to a
tileset that is not destroyed with its viewer; WebGL resources are not
garbage-collected. Removing a tileset from `scene.primitives` with
`scene.primitives.remove(tileset)` destroys it by default. See
`cesium-core-memory`.

## Cesium3DTileFeature

A `scene.pick` or `scene.drillPick` against a tileset returns a
`Cesium3DTileFeature`. It is created by the runtime, never with `new`.

### Properties

| Property | Type | Default | Notes |
|----------|------|---------|-------|
| `show` | boolean | `true` | Whether the feature renders |
| `color` | `Color` | `Color.WHITE` | Highlight color multiplied with the feature color |
| `tileset` | `Cesium3DTileset` | read-only | The owning tileset |
| `primitive` | `Cesium3DTileset` | read-only | The owning tileset (primitive alias) |
| `featureId` | number | read-only | Batch id (1.0) or feature id (`EXT_mesh_features`) |

### Methods

| Method | Signature | Purpose |
|--------|-----------|---------|
| `getProperty` | `getProperty(name)` returns the value | Copy of one metadata property |
| `getPropertyIds` | `getPropertyIds(results?)` returns `string[]` | All property names |
| `hasProperty` | `hasProperty(name)` returns `boolean` | Whether the feature has the property |
| `setProperty` | `setProperty(name, value)` | Set a metadata property value |

## Tile Content Formats

| Format | Spec version | Content |
|--------|--------------|---------|
| `b3dm` | 3D Tiles 1.0 | Batched 3D Model |
| `i3dm` | 3D Tiles 1.0 | Instanced 3D Model |
| `pnts` | 3D Tiles 1.0 | Point cloud |
| `cmpt` | 3D Tiles 1.0 | Composite of other formats |
| `.gltf` / `.glb` | 3D Tiles 1.1 | glTF directly as tile content |

In 3D Tiles 1.1 the four binary formats are deprecated in favor of glTF
content. CesiumJS 1.124+ reads both 1.0 and 1.1 tilesets. The runtime detects
the content format automatically; it is not a runtime option.
