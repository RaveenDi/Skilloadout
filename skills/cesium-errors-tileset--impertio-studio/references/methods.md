# Tileset Loading API Reference

All names and defaults verified against the CesiumJS API reference and
`CHANGES.md` on the approved sources in `SOURCES.md`, for CesiumJS 1.124+.

## Tileset factory methods

CesiumJS 1.124+ has no synchronous `Cesium3DTileset` constructor for loading.
Both factories return a promise and the tileset is fully ready once it
resolves.

### Cesium3DTileset.fromUrl

```
static Cesium3DTileset.fromUrl(url, options) -> Promise<Cesium3DTileset>
```

- `url`: a `Resource`, URL string, or a promise resolving to either, pointing
  at the `tileset.json`.
- `options`: a `Cesium3DTileset.ConstructorOptions` object, for example
  `maximumScreenSpaceError` or `modelMatrix`. The `url` key does NOT exist on
  this object; it was removed in 1.107.
- Rejects with `RuntimeError` when the tileset asset version is not `0.0`,
  `1.0`, or `1.1`, or when the tileset requires an unsupported extension.

### Cesium3DTileset.fromIonAssetId

```
static Cesium3DTileset.fromIonAssetId(assetId, options) -> Promise<Cesium3DTileset>
```

- `assetId`: the Cesium ion asset id number.
- Requires `Ion.defaultAccessToken` to be set, or an `accessToken` passed
  through the asset resource.
- Rejects with `RuntimeError` under the same conditions as `fromUrl`.

### createGooglePhotorealistic3DTileset

```
async createGooglePhotorealistic3DTileset(apiOptions, tilesetOptions) -> Promise<Cesium3DTileset>
```

- Streams Google Photorealistic 3D Tiles.
- `apiOptions` carries the Google credential, for example `key`. When
  `GoogleMaps.defaultApiKey` is unset, the tiles are provided through Cesium
  ion instead, which then requires a valid `Ion.defaultAccessToken`.

### createOsmBuildingsAsync

```
async createOsmBuildingsAsync(options) -> Promise<Cesium3DTileset>
```

- Resolves to the Cesium OSM Buildings tileset. Uses ion, so it requires a
  valid `Ion.defaultAccessToken`.

## Loading and failure events

Attach listeners with `event.addEventListener(callback)` on the resolved
tileset instance.

| Event | Fires when |
|-------|------------|
| `tileFailed` | A tile's content fails to load |
| `tileLoad` | A tile's content loads successfully |
| `allTilesLoaded` | All tiles meeting the screen space error are loaded |
| `initialTilesLoaded` | The initial view tiles have loaded, fires once |
| `loadProgress` | Reports the number of pending and processing requests |

The `tileFailed` listener receives an error object with two fields:

- `url`: the URL of the tile content that failed.
- `message`: a description of the failure.

`tileFailed` is the only signal for per-tile failures. The `fromUrl` promise
only covers `tileset.json`; tile content loads lazily as the camera moves, so
content failures occur after the promise has already resolved.

## Tileset properties used in diagnosis

| Property | Type | Default | Role in diagnosis |
|----------|------|---------|-------------------|
| `show` | boolean | `true` | When `false`, a loaded tileset is invisible |
| `modelMatrix` | `Matrix4` | `Matrix4.IDENTITY` | A wrong matrix places the tileset off the globe |
| `maximumScreenSpaceError` | number | `16` | High values render coarse, never invisible |
| `boundingSphere` | `BoundingSphere` | readonly | The target for a camera fly-to |
| `root` | `Cesium3DTile` | readonly | The root tile, valid once the promise resolves |
| `cacheBytes` | number | `536870912` | Tile cache budget, 512 MiB |
| `maximumCacheOverflowBytes` | number | `536870912` | Cache overflow allowance, 512 MiB |

## Authentication API

### Ion.defaultAccessToken

```
Ion.defaultAccessToken = "<token string>"
```

ALWAYS assign this before constructing anything that uses an ion asset,
including `Cesium3DTileset.fromIonAssetId`, `createOsmBuildingsAsync`, and a
`Viewer` with ion imagery or terrain. A missing or expired token returns 401.

### GoogleMaps.defaultApiKey

```
GoogleMaps.defaultApiKey = "<google api key>"
```

Holds the Google credential for `createGooglePhotorealistic3DTileset`. When it
is unset, CesiumJS streams Google tiles through Cesium ion instead. A key with
restrictions that exclude the Map Tiles API returns 403.

### IonResource.fromAssetId

```
static IonResource.fromAssetId(assetId, options) -> Promise<IonResource>
```

Bridges an ion asset to a streamable resource and refreshes ion access tokens
automatically. It does NOT refresh a non-ion underlying credential, such as a
Google API key behind a Google tileset.

## Bringing a tileset into view

```
viewer.scene.primitives.add(tileset)
viewer.zoomTo(tileset) -> Promise<boolean>
viewer.camera.flyToBoundingSphere(tileset.boundingSphere, options)
```

A tileset resolved by a factory is not displayed until it is added to
`scene.primitives`, and it is not in view until the camera is moved.
`viewer.zoomTo` accepts a tileset and flies to it once it is ready;
`flyToBoundingSphere` flies to an explicit `BoundingSphere`.

## Version history of the removed pattern

| Version | Change |
|---------|--------|
| 1.104 | `Cesium3DTileset.fromUrl` added; `options.url`, `Cesium3DTileset.ready`, and `Cesium3DTileset.readyPromise` deprecated |
| 1.105.1 | `createGooglePhotorealistic3DTileset` and the `GoogleMaps` credentials object added |
| 1.107 | `options.url`, `Cesium3DTileset.ready`, and `Cesium3DTileset.readyPromise` removed |
| 1.110 | Google tiles routed through ion when `GoogleMaps.defaultApiKey` is unset |
