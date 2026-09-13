# Tileset Loading Examples

Complete, correct loading code for CesiumJS 1.124+. Every example uses the
async factory pattern, adds the tileset to the scene, brings it into view, and
handles failures. All API names are verified against the approved sources in
`SOURCES.md`.

## Example 1: Load an ion tileset with full error handling

This is the recommended baseline for any ion-hosted tileset. It sets the token
first, awaits the factory inside a `try`/`catch`, adds the result to the
scene, attaches a `tileFailed` listener, and flies the camera to it.

```js
import { Ion, Viewer, Cesium3DTileset } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

Ion.defaultAccessToken = "<your ion token>";

const viewer = new Viewer("cesiumContainer");

async function loadTileset(assetId) {
  try {
    const tileset = await Cesium3DTileset.fromIonAssetId(assetId);

    viewer.scene.primitives.add(tileset);

    tileset.tileFailed.addEventListener((error) => {
      console.error(`Tile failed: ${error.url} : ${error.message}`);
    });

    await viewer.zoomTo(tileset);
    return tileset;
  } catch (error) {
    console.error(`Tileset ${assetId} failed to load: ${error}`);
    return undefined;
  }
}

await loadTileset(96188);
```

## Example 2: Load a self-hosted tileset from a URL

For a tileset hosted outside ion, use `fromUrl`. The host must serve a
`tileset.json` with CORS headers that permit the application origin.

```js
import { Viewer, Cesium3DTileset } from "cesium";

const viewer = new Viewer("cesiumContainer");

async function loadFromUrl(url) {
  try {
    const tileset = await Cesium3DTileset.fromUrl(url);

    viewer.scene.primitives.add(tileset);

    tileset.tileFailed.addEventListener((error) => {
      console.error(`Tile failed: ${error.url} : ${error.message}`);
    });

    await viewer.zoomTo(tileset);
    return tileset;
  } catch (error) {
    // A RuntimeError here means the tileset version or a required
    // extension is unsupported. Re-tile to 3D Tiles 1.0 or 1.1.
    console.error(`Tileset at ${url} failed to load: ${error}`);
    return undefined;
  }
}

await loadFromUrl("https://example.com/tilesets/city/tileset.json");
```

## Example 3: Load Google Photorealistic 3D Tiles

Set the Google credential before the factory call. When
`GoogleMaps.defaultApiKey` is unset, CesiumJS routes the tiles through ion, in
which case `Ion.defaultAccessToken` must be valid instead.

```js
import {
  Ion,
  GoogleMaps,
  Viewer,
  createGooglePhotorealistic3DTileset,
} from "cesium";

// Option A: use a Google Map Tiles API key directly.
GoogleMaps.defaultApiKey = "<your google api key>";

// Option B: leave GoogleMaps.defaultApiKey unset and stream through ion.
// Ion.defaultAccessToken = "<your ion token>";

const viewer = new Viewer("cesiumContainer", {
  globe: false,
});

async function loadGoogleTiles() {
  try {
    const tileset = await createGooglePhotorealistic3DTileset();
    viewer.scene.primitives.add(tileset);
    return tileset;
  } catch (error) {
    // A 403 here means the Google key is missing, restricted, or expired.
    console.error(`Google Photorealistic 3D Tiles failed: ${error}`);
    return undefined;
  }
}

await loadGoogleTiles();
```

## Example 4: Diagnostic harness

Attach all loading and failure events to see exactly where a tileset stops.
Use this when a tileset does not appear and the cause is not obvious from the
console.

```js
function instrumentTileset(tileset) {
  tileset.initialTilesLoaded.addEventListener(() => {
    console.log("initialTilesLoaded: initial view is ready");
  });

  tileset.allTilesLoaded.addEventListener(() => {
    console.log("allTilesLoaded: every required tile is loaded");
  });

  tileset.tileLoad.addEventListener(() => {
    console.log("tileLoad: a tile loaded");
  });

  tileset.tileFailed.addEventListener((error) => {
    console.error(`tileFailed: ${error.url} : ${error.message}`);
  });

  tileset.loadProgress.addEventListener((pending, processing) => {
    console.log(`loadProgress: ${pending} pending, ${processing} processing`);
  });

  // Verify the tileset is actually placed and in the scene.
  console.log("show:", tileset.show);
  console.log("modelMatrix is identity:", tileset.modelMatrix);
  console.log("boundingSphere:", tileset.boundingSphere);
}

const tileset = await Cesium3DTileset.fromUrl(url);
viewer.scene.primitives.add(tileset);
instrumentTileset(tileset);
await viewer.zoomTo(tileset);
```

## Example 5: Serve files locally to avoid file protocol CORS

A page opened over the `file` protocol blocks every tile request as
cross-origin. ALWAYS run a local HTTP server during development and load the
app from `http://localhost`.

```bash
# Node, from the project directory
npx http-server -p 8080 --cors

# Python 3, from the project directory
python3 -m http.server 8080
```

Then open `http://localhost:8080` in the browser, never the `file` URL.

## What every example has in common

1. The async factory `fromUrl`, `fromIonAssetId`, or
   `createGooglePhotorealistic3DTileset` is awaited; no synchronous
   constructor is used.
2. The `await` is wrapped in `try`/`catch` so a `RuntimeError` is handled.
3. The resolved tileset is added to `viewer.scene.primitives`.
4. A `tileFailed` listener is attached to surface per-tile failures.
5. The camera is flown to the tileset with `viewer.zoomTo`.
6. Credentials are set before the factory call, not after.
