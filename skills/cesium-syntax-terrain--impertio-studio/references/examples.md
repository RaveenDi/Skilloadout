# Terrain Examples

Complete, runnable patterns. All code is verified against the CesiumJS 1.124+
API reference. Examples use the `Cesium.` namespace prefix.

## 1. Cesium World Terrain at construction

```javascript
// The ion token must be set before a Viewer that loads an ion asset.
Cesium.Ion.defaultAccessToken = "<your-ion-token>";

const viewer = new Cesium.Viewer("cesiumContainer", {
  // The terrain option takes a Terrain instance, which manages the async load.
  terrain: Cesium.Terrain.fromWorldTerrain({
    requestVertexNormals: true, // shade slopes when lighting is enabled
  }),
});
```

## 2. Cesium World Terrain after construction

```javascript
const viewer = new Cesium.Viewer("cesiumContainer");

// setTerrain also takes a Terrain instance.
viewer.scene.setTerrain(Cesium.Terrain.fromWorldTerrain());
```

## 3. World Terrain by awaiting the provider

```javascript
async function loadWorldTerrain(viewer) {
  // Await the factory, then assign the resolved provider.
  const provider = await Cesium.createWorldTerrainAsync({
    requestVertexNormals: true,
    requestWaterMask: true,
  });
  viewer.scene.terrainProvider = provider;
  return provider;
}
```

Use this form when the provider value is needed later, for example to sample
elevation.

## 4. A custom quantized-mesh endpoint

```javascript
async function loadCustomTerrain(viewer, tilesUrl) {
  const provider = await Cesium.CesiumTerrainProvider.fromUrl(tilesUrl, {
    requestVertexNormals: true,
  });
  viewer.scene.terrainProvider = provider;
}

// Or, without awaiting, wrap the promise in a Terrain helper:
viewer.scene.setTerrain(
  new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl(tilesUrl)),
);
```

## 5. An ion-hosted terrain asset

```javascript
async function loadIonTerrain(viewer, assetId) {
  Cesium.Ion.defaultAccessToken = "<your-ion-token>";
  const provider = await Cesium.CesiumTerrainProvider.fromIonAssetId(assetId, {
    requestWaterMask: true,
  });
  viewer.scene.terrainProvider = provider;
}
```

## 6. An ESRI elevation service

```javascript
async function loadArcGisTerrain(viewer, serviceUrl, token) {
  const provider = await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
    serviceUrl,
    { token },
  );
  viewer.scene.terrainProvider = provider;
}
```

## 7. Removing terrain (back to a flat globe)

```javascript
// EllipsoidTerrainProvider is synchronous and carries no elevation.
viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();
```

## 8. Sampling elevation at coordinates

```javascript
async function getGroundHeights(viewer) {
  const provider = viewer.scene.terrainProvider;

  // sampleTerrainMostDetailed mutates this array in place.
  const positions = [
    Cesium.Cartographic.fromDegrees(86.925, 27.988), // Everest
    Cesium.Cartographic.fromDegrees(6.865, 45.833),  // Mont Blanc
  ];

  const updated = await Cesium.sampleTerrainMostDetailed(provider, positions);
  return updated.map((carto) => carto.height); // meters above the ellipsoid
}
```

`updated` is the same array reference as `positions`; each `carto.height` is
now the sampled ground height. ALWAYS run this after the provider promise has
resolved.

## 9. Sampling at a fixed level

```javascript
// sampleTerrain samples at an explicit tile level instead of the deepest one.
const positions = [Cesium.Cartographic.fromDegrees(11.3, 47.27)];
await Cesium.sampleTerrain(viewer.scene.terrainProvider, 11, positions);
const heightAtLevel11 = positions[0].height;
```

## 10. Terrain with lighting and water

```javascript
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain({
    requestVertexNormals: true, // required for terrain lighting
    requestWaterMask: true,     // required for the animated water effect
  }),
});

viewer.scene.globe.enableLighting = true;       // uses the vertex normals
viewer.scene.globe.depthTestAgainstTerrain = true; // markers hide behind hills
```

## 11. Vertical exaggeration

```javascript
// Exaggeration is a Scene property since CesiumJS 1.113.
viewer.scene.verticalExaggeration = 3.0;             // triple the relief
viewer.scene.verticalExaggerationRelativeHeight = 0; // relative to the ellipsoid
```

## 12. Detecting a failed terrain load

```javascript
const terrain = Cesium.Terrain.fromWorldTerrain();

terrain.readyEvent.addEventListener((provider) => {
  console.log("Terrain ready:", provider);
});
terrain.errorEvent.addEventListener((error) => {
  console.error("Terrain failed to load:", error);
});

const viewer = new Cesium.Viewer("cesiumContainer", { terrain });
```
