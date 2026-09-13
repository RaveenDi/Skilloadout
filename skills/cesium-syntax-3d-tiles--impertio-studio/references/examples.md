# 3D Tiles Examples

Complete, runnable recipes for CesiumJS 1.124+. Every recipe assumes a
`viewer` created with `new Cesium.Viewer(container)`.

## Load a Tileset From a URL

```js
async function loadCityTileset(viewer, tilesetJsonUrl) {
  try {
    const tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetJsonUrl);
    viewer.scene.primitives.add(tileset);
    await viewer.zoomTo(tileset);
    return tileset;
  } catch (error) {
    console.error("Tileset failed to load:", error);
    return undefined;
  }
}
```

The factory rejects on a network, CORS, or unsupported-version failure, so
the `try / catch` is mandatory. The resolved tileset is a primitive and
ALWAYS goes into `viewer.scene.primitives`.

## Load a Tileset From a Cesium ion Asset

```js
async function loadIonTileset(viewer, assetId) {
  Cesium.Ion.defaultAccessToken = "<your-ion-token>";
  try {
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(assetId);
    viewer.scene.primitives.add(tileset);
    await viewer.zoomTo(tileset);
    return tileset;
  } catch (error) {
    console.error("ion tileset failed to load:", error);
    return undefined;
  }
}
```

ALWAYS set `Cesium.Ion.defaultAccessToken` before the factory call when the
asset is ion-hosted. A missing or expired token rejects the promise with a
401 or 403.

## Frame the Camera On a Tileset

```js
const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
viewer.scene.primitives.add(tileset);

// boundingSphere is valid only after the promise resolves.
const sphere = tileset.boundingSphere;
viewer.camera.viewBoundingSphere(
  sphere,
  new Cesium.HeadingPitchRange(0.0, -0.5, sphere.radius * 2.0),
);
viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
```

`viewer.zoomTo(tileset)` does the same framing with one call and returns a
promise. Use `viewBoundingSphere` when an exact heading, pitch, and range are
needed.

## Tune Detail and Memory

```js
const tileset = await Cesium.Cesium3DTileset.fromUrl(url, {
  maximumScreenSpaceError: 24, // coarser tiles, faster frames
  cacheBytes: 1024 * 1024 * 1024, // 1 GiB target tile cache
  maximumCacheOverflowBytes: 512 * 1024 * 1024, // 512 MiB overflow
});
viewer.scene.primitives.add(tileset);

// The same values are writable on the live instance.
tileset.maximumScreenSpaceError = 16; // back to the default, more detail
```

A LOWER `maximumScreenSpaceError` loads more detail and costs more memory and
bandwidth; a HIGHER value renders faster. The default is `16`.

## Position a Whole Tileset With a Model Matrix

```js
const tileset = await Cesium.Cesium3DTileset.fromUrl(url);

// Move and reorient a tileset that has no georeferencing of its own.
const origin = Cesium.Cartesian3.fromDegrees(4.9, 52.37, 0.0);
tileset.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin);

viewer.scene.primitives.add(tileset);
```

A correctly georeferenced tileset already sits in the right place; leave
`modelMatrix` at its default `Matrix4.IDENTITY`. Use `modelMatrix` only to
place a tileset authored in a local frame. See `cesium-impl-aec-georef`.

## Pick a Feature and Read Its Metadata

```js
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
let highlighted;

handler.setInputAction((movement) => {
  if (Cesium.defined(highlighted)) {
    highlighted.color = Cesium.Color.WHITE; // clear the previous highlight
    highlighted = undefined;
  }
  const picked = viewer.scene.pick(movement.position);
  if (picked instanceof Cesium.Cesium3DTileFeature) {
    for (const id of picked.getPropertyIds()) {
      console.log(id, picked.getProperty(id));
    }
    picked.color = Cesium.Color.YELLOW;
    highlighted = picked;
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

A pick against a tileset returns a `Cesium3DTileFeature`, not an `Entity`.
`getProperty` reads structured metadata; `color` highlights the feature.

## Track Load Progress

```js
const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
viewer.scene.primitives.add(tileset);

tileset.initialTilesLoaded.addEventListener(() => {
  console.log("Initial view is ready");
});

tileset.allTilesLoaded.addEventListener(() => {
  console.log("All tiles for the current view are loaded");
});

tileset.tileFailed.addEventListener((error) => {
  console.error("Tile failed:", error.url, error.message);
});
```

`initialTilesLoaded` fires once; `allTilesLoaded` fires every time the
visible set settles after a camera move.

## Toggle a Tileset and Free Its Memory

```js
// Hide without unloading.
tileset.show = false;

// Remove and destroy when the tileset is no longer needed.
viewer.scene.primitives.remove(tileset); // destroys the tileset by default
```

`scene.primitives.remove` destroys the tileset and releases its WebGL
resources. Call `tileset.destroy()` directly only when the tileset was never
added to a collection. See `cesium-core-memory`.
