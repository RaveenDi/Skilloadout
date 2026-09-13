# Cesium ion : Verified API Reference

> CesiumJS 1.124+. Every signature verified via WebFetch against
> cesium.com/learn/cesiumjs/ref-doc on 2026-05-20. ion REST endpoint paths are
> deliberately not quoted: they were not verifiable from the public docs and
> are versioned.

## Ion

| Member | Type | Notes |
|--------|------|-------|
| `Ion.defaultAccessToken` | string | the default ion access token; required for any ion API |
| `Ion.defaultServer` | string or `Resource` | the ion API server, default `https://api.cesium.com` |

Both are static members. Set them before loading ion assets.

## IonResource

`IonResource` is a `Resource` subclass. The docs state it is "normally not
instantiated directly, use `IonResource.fromAssetId`".

`static IonResource.fromAssetId(assetId, options) -> Promise<IonResource>`

| Option | Type | Default |
|--------|------|---------|
| `accessToken` | string | `Ion.defaultAccessToken` |
| `server` | string or `Resource` | `Ion.defaultServer` |

## Cesium3DTileset

`static Cesium3DTileset.fromIonAssetId(assetId, options) -> Promise<Cesium3DTileset>`
- `assetId` (number): the Cesium ion asset id.
- `options` (`Cesium3DTileset.ConstructorOptions`, optional).

`static Cesium3DTileset.fromUrl(url, options) -> Promise<Cesium3DTileset>`
- `url` (`Resource` or string): a tileset JSON URL, or an `IonResource`.

## IonImageryProvider

The docs state: "To construct a IonImageryProvider, call
`IonImageryProvider.fromAssetId`. Do not call the constructor directly."

`static IonImageryProvider.fromAssetId(assetId, options) -> Promise<IonImageryProvider>`

| Option | Type | Default |
|--------|------|---------|
| `accessToken` | string | `Ion.defaultAccessToken` |
| `server` | string or `Resource` | `Ion.defaultServer` |

## CesiumTerrainProvider

`static CesiumTerrainProvider.fromIonAssetId(assetId, options) -> Promise<CesiumTerrainProvider>`

`static CesiumTerrainProvider.fromUrl(url, options) -> Promise<CesiumTerrainProvider>`

`CesiumTerrainProvider.ConstructorOptions`:

| Option | Type | Default |
|--------|------|---------|
| `requestVertexNormals` | boolean | `false` |
| `requestWaterMask` | boolean | `false` |
| `requestMetadata` | boolean | `true` |
| `ellipsoid` | `Ellipsoid` | optional |
| `credit` | `Credit` or string | optional |

## Cesium-hosted Base Asset Helpers

| Function | Returns | ion asset |
|----------|---------|-----------|
| `createWorldTerrainAsync(options)` | `Promise<CesiumTerrainProvider>` | Cesium World Terrain |
| `createWorldImageryAsync(options)` | `Promise<IonImageryProvider>` | ion default base imagery (Bing Maps) |
| `createOsmBuildingsAsync(options)` | `Promise<Cesium3DTileset>` | Cesium OSM Buildings |

Each helper wraps an ion asset id and still requires `Ion.defaultAccessToken`.

## ion REST API

Base server: `https://api.cesium.com` (the value of `Ion.defaultServer`), or
the private server for an ion Self-Hosted deployment. Requests authenticate
with a Bearer token in the `Authorization` header.

The REST API covers asset listing, asset creation, source-data upload, and
asset status polling. Exact endpoint paths are versioned and were not
verifiable from the public docs at research time; confirm them against the
current ion REST API reference before scripting against them.

The CesiumJS browser SDK consumes finished assets only. It does not perform
uploads; run upload scripts server-side or use the ion web UI.
