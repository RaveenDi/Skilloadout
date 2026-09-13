# Examples: Versioning and Migration

Companion to `SKILL.md`. Every modern snippet uses async factories and runs on
CesiumJS 1.124+. Every legacy snippet is labelled and is shown ONLY to teach
detection; NEVER ship the legacy form.

## 1. Tileset: Sync Constructor to Async Factory

```js
// LEGACY : removed in CesiumJS 1.107. Throws on a 1.124+ target.
const tileset = new Cesium.Cesium3DTileset({
  url: Cesium.IonResource.fromAssetId(75343),
});
viewer.scene.primitives.add(tileset);
tileset.readyPromise
  .then(function () {
    viewer.zoomTo(tileset);
  })
  .catch(function (error) {
    console.error(error);
  });
```

```js
// MODERN : async factory, await, structured error handling.
try {
  const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(75343);
  viewer.scene.primitives.add(tileset);
  await viewer.zoomTo(tileset);
} catch (error) {
  console.error("Tileset failed to load:", error);
}
```

## 2. Tileset From a Self-Hosted URL

```js
// LEGACY : removed 1.107.
const tileset = new Cesium.Cesium3DTileset({ url: "/tiles/city/tileset.json" });
viewer.scene.primitives.add(tileset);
```

```js
// MODERN : fromUrl points straight at tileset.json.
const tileset = await Cesium.Cesium3DTileset.fromUrl("/tiles/city/tileset.json");
viewer.scene.primitives.add(tileset);
```

## 3. glTF Model: fromGltf to fromGltfAsync

```js
// LEGACY : the synchronous Model.fromGltf path was removed.
const model = viewer.scene.primitives.add(
  Cesium.Model.fromGltf({ url: "./aircraft.glb" }),
);
model.readyPromise.then(function () {
  model.activeAnimations.addAll();
});
```

```js
// MODERN : fromGltfAsync resolves to a ready Model.
const model = await Cesium.Model.fromGltfAsync({ url: "./aircraft.glb" });
viewer.scene.primitives.add(model);
model.activeAnimations.addAll();
```

## 4. Terrain: createWorldTerrain to createWorldTerrainAsync

```js
// LEGACY : createWorldTerrain removed in 1.107.
viewer.terrainProvider = Cesium.createWorldTerrain();
```

```js
// MODERN : await the async helper, or pass it through the Viewer option.
viewer.terrainProvider = await Cesium.createWorldTerrainAsync();

// Equivalent at construction time:
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
});
```

## 5. Custom Terrain Provider

```js
// LEGACY : direct construction removed 1.107.
const provider = new Cesium.CesiumTerrainProvider({
  url: "https://example.com/tiles",
});
```

```js
// MODERN : fromUrl factory.
const provider = await Cesium.CesiumTerrainProvider.fromUrl(
  "https://example.com/tiles",
  { requestVertexNormals: true },
);
viewer.terrainProvider = provider;
```

## 6. Imagery Provider

```js
// LEGACY : sync construction + readyPromise removed 1.107.
const provider = new Cesium.IonImageryProvider({ assetId: 3954 });
const layer = viewer.imageryLayers.addImageryProvider(provider);
```

```js
// MODERN : fromAssetId factory.
const provider = await Cesium.IonImageryProvider.fromAssetId(3954);
const layer = viewer.imageryLayers.addImageryProvider(provider);
```

## 7. defaultValue to Nullish Coalescing

```js
// LEGACY : defaultValue removed in 1.134.
function placeMarker(options) {
  options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);
  const height = Cesium.defaultValue(options.height, 0);
  const color = Cesium.defaultValue(options.color, Cesium.Color.YELLOW);
  return { height, color };
}
```

```js
// MODERN : ?? operator and Frozen.EMPTY_OBJECT.
function placeMarker(options) {
  options = options ?? Cesium.Frozen.EMPTY_OBJECT;
  const height = options.height ?? 0;
  const color = options.color ?? Cesium.Color.YELLOW;
  return { height, color };
}
```

## 8. Cartesian Factory: Drop the new Keyword

```js
// LEGACY : throws since 1.139. fromDegrees is a static factory.
const a = new Cesium.Cartesian3.fromDegrees(-75.0, 40.0);
const b = new Cesium.Cartesian3.fromRadians(-1.3, 0.7);
```

```js
// MODERN : call the static factory with no new keyword.
const a = Cesium.Cartesian3.fromDegrees(-75.0, 40.0);
const b = Cesium.Cartesian3.fromRadians(-1.3, 0.7);

// The real constructor with raw components stays valid:
const c = new Cesium.Cartesian3(1.0, 2.0, 3.0);
```

## 9. Vertical Exaggeration

```js
// LEGACY : Globe-based exaggeration removed in 1.113.
viewer.scene.globe.terrainExaggeration = 3.0;
viewer.scene.globe.terrainExaggerationRelativeHeight = 0.0;
```

```js
// MODERN : a Scene property that also exaggerates 3D Tiles.
viewer.scene.verticalExaggeration = 3.0;
viewer.scene.verticalExaggerationRelativeHeight = 0.0;
```

## 10. Full Legacy Bootstrap Rewrite

A complete pre-2023 startup sequence ported to the modern async era.

```js
// LEGACY : every network resource here uses a removed pattern.
Cesium.Ion.defaultAccessToken = "<token>";
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrainProvider: Cesium.createWorldTerrain(),
});
const tileset = new Cesium.Cesium3DTileset({
  url: Cesium.IonResource.fromAssetId(96188),
});
viewer.scene.primitives.add(tileset);
tileset.readyPromise.then(function () {
  viewer.zoomTo(tileset);
});
```

```js
// MODERN : async factories awaited inside an async bootstrap function.
async function startApp() {
  Cesium.Ion.defaultAccessToken = "<token>";

  const viewer = new Cesium.Viewer("cesiumContainer", {
    terrain: Cesium.Terrain.fromWorldTerrain(),
  });

  try {
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
    viewer.scene.primitives.add(tileset);
    await viewer.zoomTo(tileset);
  } catch (error) {
    console.error("Tileset failed to load:", error);
  }

  return viewer;
}

startApp();
```

## 11. Reading CHANGES.md Before an Upgrade

```js
// Fetch the raw changelog, NEVER the rendered GitHub blob page.
const url = "https://raw.githubusercontent.com/CesiumGS/cesium/main/CHANGES.md";
const text = await (await fetch(url)).text();

// Isolate the Breaking Changes blocks to review before bumping the version.
const breaking = text
  .split(/^### /m)
  .filter((block) => block.startsWith("Breaking Changes"));
console.log(breaking.join("\n\n"));
```

Resolve every entry above the current version and up to the target version
before changing the pinned `cesium` dependency.
