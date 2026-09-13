# Imagery Syntax : Verified API Reference

All signatures, members, and defaults below are verified against the CesiumJS API
reference (https://cesium.com/learn/cesiumjs/ref-doc/) for CesiumJS 1.124+.

## ImageryLayer

```
new Cesium.ImageryLayer(imageryProvider, options)
```

Synchronous constructor. `imageryProvider` MUST be a resolved provider instance, NEVER
a Promise.

### Static factories

```
Cesium.ImageryLayer.fromProviderAsync(imageryProviderPromise, options)
Cesium.ImageryLayer.fromWorldImagery(options)
```

`fromProviderAsync` accepts a Promise of a provider and returns an `ImageryLayer` at
once, drawing tiles when the promise resolves. `fromWorldImagery` creates a layer for
Cesium ion global base imagery.

### Adjustable members

| Member | Default | Notes |
|--------|---------|-------|
| `alpha` | `1.0` | opacity, `0.0` to `1.0` |
| `dayAlpha` | `1.0` | opacity on the lit side |
| `nightAlpha` | `1.0` | opacity on the dark side |
| `brightness` | `1.0` | `1.0` is unchanged |
| `contrast` | `1.0` | `1.0` is unchanged |
| `hue` | `0.0` | hue shift in radians |
| `saturation` | `1.0` | `1.0` is unchanged |
| `gamma` | `1.0` | gamma correction |
| `show` | `true` | visibility |
| `splitDirection` | `SplitDirection.NONE` | slider side |
| `minimumTerrainLevel` | `undefined` | lowest terrain level the layer shows on |
| `maximumTerrainLevel` | `undefined` | highest terrain level the layer shows on |
| `colorToAlpha` | a `Color` | color treated as transparent |
| `colorToAlphaThreshold` | `0.004` | tolerance for `colorToAlpha` |

There is NO `readyPromise`. The class exposes `ready` (readonly boolean) and
`readyEvent`.

## ImageryLayerCollection

Reached as `viewer.imageryLayers`. An ordered collection; index `0` is the bottom
layer, the last index is the top layer.

| Method | Returns | Notes |
|--------|---------|-------|
| `add(layer, index)` | `void` | adds an existing `ImageryLayer` |
| `addImageryProvider(provider, index)` | `ImageryLayer` | builds and adds a layer |
| `get(index)` | `ImageryLayer` | layer at an index |
| `indexOf(layer)` | `number` | index of a layer |
| `remove(layer, destroy)` | `boolean` | `destroy` defaults to `true` |
| `removeAll(destroy)` | `void` | `destroy` defaults to `true` |
| `raise(layer)` | `void` | move up one step |
| `lower(layer)` | `void` | move down one step |
| `raiseToTop(layer)` | `void` | move to the top |
| `lowerToBottom(layer)` | `void` | move to the bottom |

The `length` property gives the layer count.

## Asynchronous providers (async factory required)

The direct constructor on each of these classes is documented as not-to-be-called.

```
Cesium.IonImageryProvider.fromAssetId(assetId, options)
Cesium.BingMapsImageryProvider.fromUrl(url, options)        // options.key required
Cesium.ArcGisMapServerImageryProvider.fromUrl(url, options)
Cesium.ArcGisMapServerImageryProvider.fromBasemapType(style, options)
Cesium.TileMapServiceImageryProvider.fromUrl(url, options)
Cesium.SingleTileImageryProvider.fromUrl(url, options)
```

Each returns a `Promise` resolving to the provider.

`ArcGisBaseMapType` values for `fromBasemapType`: `SATELLITE`, `OCEANS`, `HILLSHADE`.
An ArcGIS access token is required to authenticate ArcGIS image tile services.

`createWorldImageryAsync(options)` is a global function returning a Promise of the
Cesium ion world imagery provider.

## Synchronous providers (plain constructor)

```
new Cesium.OpenStreetMapImageryProvider(options)
new Cesium.UrlTemplateImageryProvider(options)
new Cesium.WebMapServiceImageryProvider(options)
new Cesium.WebMapTileServiceImageryProvider(options)
```

### OpenStreetMapImageryProvider options

`url` (default `https://tile.openstreetmap.org`), `fileExtension` (default `png`),
`minimumLevel` (default `0`), `maximumLevel`, `rectangle`, `credit`. Extends
`UrlTemplateImageryProvider`.

### UrlTemplateImageryProvider options

`url` (required, supports `{z}` `{x}` `{y}` `{s}` `{reverseX}` `{reverseY}` and
geographic bound tags), `subdomains` (default `abc`), `tilingScheme` (default
`WebMercatorTilingScheme`), `minimumLevel` (default `0`), `maximumLevel`, `rectangle`,
`credit`, `customTags`.

### WebMapServiceImageryProvider options

`url` (the WMS service URL), `layers` (comma-separated layer names), `parameters`
(GetMap parameters), `tilingScheme` (default `GeographicTilingScheme`), `rectangle`,
`minimumLevel` (default `0`), `maximumLevel`, `tileWidth` and `tileHeight` (default
`256`).

### WebMapTileServiceImageryProvider options

`url` (KVP base URL or RESTful tile template), `layer`, `style`, `format` (default
`image/jpeg`), `tileMatrixSetID`, `tilingScheme`, `tileMatrixLabels`. Supports KVP and
RESTful GetTile, not SOAP.
