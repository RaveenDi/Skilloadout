# Cesium ion : Examples

> CesiumJS 1.124+. All snippets verified against cesium.com ref-doc on
> 2026-05-20. Asset ids shown as `123456` are placeholders for your own ids.

## Set the ion token before the Viewer

```js
// Token from an environment variable, never hardcoded in committed source.
Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
const viewer = new Cesium.Viewer("cesiumContainer");
```

## Load an ion 3D Tiles asset

```js
const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(123456);
viewer.scene.primitives.add(tileset);
await viewer.zoomTo(tileset);
```

## Load ion terrain

```js
viewer.scene.terrainProvider =
  await Cesium.CesiumTerrainProvider.fromIonAssetId(123456);
```

## Load an ion imagery asset

```js
const layer = Cesium.ImageryLayer.fromProviderAsync(
  Cesium.IonImageryProvider.fromAssetId(123456)
);
viewer.imageryLayers.add(layer);
```

## Cesium-hosted base assets

```js
// World Terrain and OSM Buildings, no raw asset ids needed.
viewer.scene.terrainProvider = await Cesium.createWorldTerrainAsync({
  requestWaterMask: true,
  requestVertexNormals: true,
});
viewer.scene.primitives.add(await Cesium.createOsmBuildingsAsync());
```

## The IonResource bridge

```js
// Use IonResource only when no type-specific fromIonAssetId shortcut fits.
const resource = await Cesium.IonResource.fromAssetId(123456);
const tileset = await Cesium.Cesium3DTileset.fromUrl(resource);
viewer.scene.primitives.add(tileset);
```

## Per-call token override

```js
// IonResource and IonImageryProvider accept a per-call accessToken.
const resource = await Cesium.IonResource.fromAssetId(123456, {
  accessToken: scopedToken,
});
const tileset = await Cesium.Cesium3DTileset.fromUrl(resource);

const provider = await Cesium.IonImageryProvider.fromAssetId(123456, {
  accessToken: scopedToken,
});
```

## Self-host a tileset without ion

```js
// 3D Tiles served from a static CDN with CORS enabled.
const tileset = await Cesium.Cesium3DTileset.fromUrl(
  "https://cdn.example.com/tilesets/city/tileset.json"
);
viewer.scene.primitives.add(tileset);

// Quantized-mesh terrain from a self-hosted terrain server.
viewer.scene.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(
  "https://cdn.example.com/terrain/"
);
```

## Point at an ion Self-Hosted server

```js
// Override the server before setting the token and building the Viewer.
Cesium.Ion.defaultServer = "https://ion.internal.example.com";
Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
const viewer = new Cesium.Viewer("cesiumContainer");
```
