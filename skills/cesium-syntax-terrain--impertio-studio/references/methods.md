# Terrain API Reference

All signatures and defaults below are verified against the CesiumJS API
reference (`cesium.com/learn/cesiumjs/ref-doc/`) and the CesiumGS/cesium source
for the 1.124+ release line.

## CesiumTerrainProvider

Streams quantized-mesh terrain from a Cesium ion asset or a compatible server.

The reference states: "To construct a CesiumTerrainProvider, call
`CesiumTerrainProvider.fromIonAssetId` or `CesiumTerrainProvider.fromUrl`. Do
not call the constructor directly."

| Factory | Signature | Returns |
|---------|-----------|---------|
| `fromUrl` | `CesiumTerrainProvider.fromUrl(url, options)` | `Promise<CesiumTerrainProvider>` |
| `fromIonAssetId` | `CesiumTerrainProvider.fromIonAssetId(assetId, options)` | `Promise<CesiumTerrainProvider>` |

### Options (CesiumTerrainProvider.ConstructorOptions)

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `requestVertexNormals` | boolean | `false` | Request lighting normals from the server |
| `requestWaterMask` | boolean | `false` | Request per-tile water masks |
| `requestMetadata` | boolean | `true` | Request per-tile metadata |
| `ellipsoid` | `Ellipsoid` | `Ellipsoid.default` | The ellipsoid |
| `credit` | `Credit` or `string` | (none) | Attribution shown on the canvas |

## createWorldTerrainAsync

Cesium World Terrain, the global hosted terrain dataset on Cesium ion.

`createWorldTerrainAsync(options) → Promise<CesiumTerrainProvider>`

| Option | Type | Default |
|--------|------|---------|
| `requestVertexNormals` | boolean | `false` |
| `requestWaterMask` | boolean | `false` |

`createWorldBathymetryAsync(options) → Promise<CesiumTerrainProvider>` is the
ocean-floor equivalent; its options expose `requestVertexNormals`.

## Terrain (async helper class)

"A helper to manage async operations of a terrain provider." It accepts a
`Promise<TerrainProvider>` and is the value passed to the `Viewer` `terrain`
option and to `scene.setTerrain`.

| Member | Signature | Notes |
|--------|-----------|-------|
| constructor | `new Terrain(terrainProviderPromise)` | Wraps any provider promise |
| `Terrain.fromWorldTerrain` | `fromWorldTerrain(options)` | `options`: `requestVertexNormals` (false), `requestWaterMask` (false) |
| `Terrain.fromWorldBathymetry` | `fromWorldBathymetry(options)` | `options`: `requestVertexNormals` (false) |
| `readyEvent` | `Event` | Raised when the provider has been created successfully |
| `errorEvent` | `Event` | Raised on an asynchronous error |
| `ready` | readonly boolean | `true` once the provider is created |
| `provider` | readonly `TerrainProvider` | The provider, valid after `readyEvent` |

Subscribe to `errorEvent` to detect a failed terrain load; the `Terrain`
wrapper does not throw from the constructor.

## ArcGISTiledElevationTerrainProvider

Elevation from an ESRI `ImageServer` tiled elevation service.

The reference states the constructor must not be called directly; use the
factory.

`ArcGISTiledElevationTerrainProvider.fromUrl(url, options) → Promise<ArcGISTiledElevationTerrainProvider>`

| Option | Type | Notes |
|--------|------|-------|
| `token` | string | Authorization token for the service |
| `ellipsoid` | `Ellipsoid` | Default `Ellipsoid.default` |

## EllipsoidTerrainProvider

"A very simple TerrainProvider that produces geometry by tessellating an
ellipsoidal surface." It carries no elevation data and is constructed
synchronously.

`new Cesium.EllipsoidTerrainProvider(options)`

| Option | Type | Notes |
|--------|------|-------|
| `ellipsoid` | `Ellipsoid` | Default `Ellipsoid.default` |

This is the implicit default terrain of a globe and the correct way to remove
terrain that was set earlier.

## Attaching terrain

| API | Signature | Accepts |
|-----|-----------|---------|
| `Viewer` `terrain` option | constructor option | a `Terrain` instance |
| `scene.setTerrain` | `setTerrain(terrain) → Terrain` | a `Terrain` instance; "Update the terrain providing surface geometry for the globe." |
| `scene.terrainProvider` | settable property | a resolved `TerrainProvider`; "The terrain provider providing surface geometry for the globe." |
| `globe.terrainProvider` | settable property | a resolved `TerrainProvider` |

NEVER assign a `Promise` to `scene.terrainProvider` or `globe.terrainProvider`.
Those setters require a resolved provider. Use a `Terrain` wrapper, or `await`
the factory.

## Globe and Scene terrain properties

| Member | Type | Notes |
|--------|------|-------|
| `globe.depthTestAgainstTerrain` | boolean | "True if primitives such as billboards, polylines, labels, etc. should be depth-tested against the terrain surface, or false if such primitives should always be drawn on top of terrain unless they're on the opposite side of the globe." |
| `scene.verticalExaggeration` | number | Terrain relief multiplier; `1.0` applies no exaggeration |
| `scene.verticalExaggerationRelativeHeight` | number | Reference height; `0.0` exaggerates relative to the ellipsoid surface |

`Globe.terrainExaggeration` does not exist in 1.124+; exaggeration moved to
`Scene` in CesiumJS 1.113.

## Elevation sampling

Both functions mutate the input `Cartographic` array in place, updating each
`.height`, and resolve to that same array.

| Function | Signature | Notes |
|----------|-----------|-------|
| `sampleTerrain` | `sampleTerrain(terrainProvider, level, positions, rejectOnTileFail?)` | Samples at a fixed tile `level`. Returns `Promise<Cartographic[]>`. |
| `sampleTerrainMostDetailed` | `sampleTerrainMostDetailed(terrainProvider, positions, rejectOnTileFail?)` | Samples at the deepest available tile. Returns `Promise<Cartographic[]>`. Rejects if the provider's `availability` is undefined. |

`rejectOnTileFail` defaults to `false`. When `true`, the promise rejects on a
failed terrain tile request instead of leaving that point's height unchanged.
