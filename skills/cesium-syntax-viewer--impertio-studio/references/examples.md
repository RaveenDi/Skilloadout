# Examples: Viewer Construction

Companion to `SKILL.md`. Every snippet runs on CesiumJS 1.124+ and uses async
factories. No WebGPU path exists; CesiumJS is WebGL2 only.

## 1. Minimal Viewer

The smallest correct CesiumJS application.

```js
Cesium.Ion.defaultAccessToken = "<your-ion-token>";
const viewer = new Cesium.Viewer("cesiumContainer");
```

This produces a globe with World Imagery as the base layer and the full
default widget set.

## 2. Viewer With World Terrain

```js
Cesium.Ion.defaultAccessToken = "<your-ion-token>";

const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
});

viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(6.87, 45.83, 8000),
});
```

The `Terrain` helper handles the async terrain load. NEVER assign a
synchronously constructed terrain provider that relies on a removed
`readyPromise`.

## 3. Clean UI: All Widgets Off

```js
Cesium.Ion.defaultAccessToken = "<your-ion-token>";

const viewer = new Cesium.Viewer("cesiumContainer", {
  animation: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  navigationHelpButton: false,
  sceneModePicker: false,
  selectionIndicator: false,
  timeline: false,
  vrButton: false,
});
```

The result is a bare globe with no Cesium toolbar, timeline, or panels.

## 4. CesiumWidget for an Embedded Map

When no Cesium UI is needed at all, `CesiumWidget` is lighter than a `Viewer`
with every toggle disabled.

```js
Cesium.Ion.defaultAccessToken = "<your-ion-token>";

const widget = new Cesium.CesiumWidget("cesiumContainer", {
  scene3DOnly: true,
  msaaSamples: 4,
});

// CesiumWidget exposes the same Scene API as Viewer.
widget.scene.skyBox.show = false;
widget.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(2.29, 48.86, 3000),
});
```

## 5. High-Performance Context

```js
Cesium.Ion.defaultAccessToken = "<your-ion-token>";

const viewer = new Cesium.Viewer("cesiumContainer", {
  contextOptions: {
    requestWebgl2: true,
    webgl: {
      powerPreference: "high-performance",
      alpha: false,
    },
  },
  msaaSamples: 4,
});
```

## 6. Static Scene With requestRenderMode

For a scene that rarely changes, `requestRenderMode` cuts GPU and battery use.

```js
Cesium.Ion.defaultAccessToken = "<your-ion-token>";

const viewer = new Cesium.Viewer("cesiumContainer", {
  requestRenderMode: true,
  maximumRenderTimeChange: Infinity,
});

// After any change the engine cannot detect, request a frame explicitly.
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(4.9, 52.37),
  point: { pixelSize: 12, color: Cesium.Color.RED },
});
viewer.scene.requestRender();
```

## 7. Pure 3D Tiles Scene Without a Globe

When the scene shows only a streamed tileset, the globe can be removed to save
memory.

```js
Cesium.Ion.defaultAccessToken = "<your-ion-token>";

const viewer = new Cesium.Viewer("cesiumContainer", {
  globe: false,
  baseLayer: false,
});

try {
  const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
  viewer.scene.primitives.add(tileset);
  await viewer.zoomTo(tileset);
} catch (error) {
  console.error("Tileset failed to load:", error);
}
```

## 8. Custom Base Imagery

```js
Cesium.Ion.defaultAccessToken = "<your-ion-token>";

const viewer = new Cesium.Viewer("cesiumContainer", {
  baseLayerPicker: false,
  baseLayer: Cesium.ImageryLayer.fromProviderAsync(
    Cesium.ArcGisMapServerImageryProvider.fromUrl(
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
    ),
  ),
});
```

When `baseLayer` is set explicitly, disable `baseLayerPicker` so the UI cannot
override the chosen layer.

## 9. Full Application Bootstrap

A complete, ordered startup with terrain, a tileset, and a camera move,
wrapped in an async function so every factory is awaited.

```js
async function startApp() {
  // 1. Token first.
  Cesium.Ion.defaultAccessToken = "<your-ion-token>";

  // 2. Construct the Viewer.
  const viewer = new Cesium.Viewer("cesiumContainer", {
    timeline: false,
    animation: false,
    terrain: Cesium.Terrain.fromWorldTerrain(),
  });

  // 3. await async factories.
  try {
    const tileset = await Cesium.createOsmBuildingsAsync();
    viewer.scene.primitives.add(tileset);
  } catch (error) {
    console.error("OSM Buildings failed to load:", error);
  }

  // 4. Move the camera.
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-73.98, 40.74, 1500),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-30),
    },
  });

  return viewer;
}

startApp();
```

## 10. Teardown

```js
function disposeViewer(viewer) {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
}
```

ALWAYS guard with `isDestroyed()`. Calling `destroy()` twice, or using a
viewer after `destroy()`, throws.
