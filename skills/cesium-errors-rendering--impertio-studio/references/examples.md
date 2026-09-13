# Examples : Verified Working Code

Every snippet uses async factories and WebGL2 only. Every identifier is
verified against the sources listed in `SOURCES.md`. No `readyPromise`, no
`.ready`, no `new Cesium3DTileset({url})`, no `ModelExperimental`, no
`defaultValue()`.

## 1. Correct bootstrap sequence

The fixed order: base URL, import, ion token, `Viewer`, awaited factories.
Skipping the base URL or the token is the dominant cause of a blank globe.

```js
// main.js : the first executed line sets the base URL.
window.CESIUM_BASE_URL = "/cesium/";

import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// Set the ion token before constructing a Viewer that uses ion assets.
Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

async function start() {
  const viewer = new Cesium.Viewer("cesiumContainer", {
    terrain: Cesium.Terrain.fromWorldTerrain(),
  });

  // Await every async factory inside try/catch so a failure is visible.
  try {
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
    viewer.scene.primitives.add(tileset);
    await viewer.zoomTo(tileset);
  } catch (error) {
    console.error("Tileset load failed:", error);
  }

  return viewer;
}

start();
```

## 2. Render-loop error handler

A render-loop exception otherwise produces a frozen frame. Subscribe to
`scene.renderError` to log it, and set `rethrowRenderErrors` so an external
error boundary sees it.

```js
const scene = viewer.scene;

scene.renderError.addEventListener((failedScene, error) => {
  console.error("Cesium render error:", error);
  // Report to the application error tracker here.
});

// Rethrow after the event so a top-level handler also receives it.
scene.rethrowRenderErrors = true;
```

To suppress the built-in HTML error panel and handle errors only in code, set
`showRenderLoopErrors: false` in the `Viewer` constructor options.

## 3. WebGL context-loss recovery

CesiumJS does not rebuild GPU resources after context loss. Recovery is to
destroy the dead `Viewer` and construct a new one. `event.preventDefault()` in
the `webglcontextlost` listener keeps the canvas restorable.

```js
function attachContextLossRecovery(getViewer, setViewer, containerId) {
  let viewer = getViewer();
  const canvas = viewer.scene.canvas;

  canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      // Required: without preventDefault the browser will not restore.
      event.preventDefault();
      console.warn("WebGL context lost. Waiting for restore.");
    },
    false,
  );

  canvas.addEventListener(
    "webglcontextrestored",
    () => {
      console.warn("WebGL context restored. Rebuilding the viewer.");
      const dead = getViewer();
      if (!dead.isDestroyed()) {
        dead.destroy();
      }
      const fresh = new Cesium.Viewer(containerId, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
      });
      setViewer(fresh);
    },
    false,
  );
}
```

To prevent the loss on memory-constrained devices, lower GPU pressure:
`viewer.resolutionScale = 0.7`, `tileset.maximumScreenSpaceError = 32`,
`tileset.cacheBytes = 256 * 1024 * 1024`.

## 4. Vite configuration

`vite-plugin-cesium` copies the four static directories and sets the base URL.
Without it the production build serves a blank globe.

```js
// vite.config.js
import { defineConfig } from "vite";
import cesium from "vite-plugin-cesium";

export default defineConfig({
  plugins: [cesium()],
});
```

With `vite-plugin-cesium` active, `window.CESIUM_BASE_URL` is set by the
plugin; a manual assignment is not required.

## 5. webpack configuration

`CopyWebpackPlugin` copies `Workers`, `ThirdParty`, `Assets`, and `Widgets`.
`DefinePlugin` defines `CESIUM_BASE_URL` at build time.

```js
// webpack.config.js
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumBaseUrl = "cesium";

module.exports = {
  output: { sourcePrefix: "" },
  amd: { toUrlUndefined: true },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: path.join(cesiumSource, "Workers"), to: `${cesiumBaseUrl}/Workers` },
        { from: path.join(cesiumSource, "ThirdParty"), to: `${cesiumBaseUrl}/ThirdParty` },
        { from: path.join(cesiumSource, "Assets"), to: `${cesiumBaseUrl}/Assets` },
        { from: path.join(cesiumSource, "Widgets"), to: `${cesiumBaseUrl}/Widgets` },
      ],
    }),
    new webpack.DefinePlugin({
      CESIUM_BASE_URL: JSON.stringify(cesiumBaseUrl),
    }),
  ],
};
```

## 6. Imagery error handler and fallback

When the globe is a flat solid color, no imagery layer is rendering tiles.
Subscribe to `errorEvent` to capture the cause, then attach a fallback layer.

```js
async function addImageryWithFallback(viewer) {
  try {
    const provider = new Cesium.OpenStreetMapImageryProvider({
      url: "https://tile.openstreetmap.org/",
    });
    const layer = Cesium.ImageryLayer.fromProviderAsync(
      Promise.resolve(provider),
      {},
    );
    layer.errorEvent.addEventListener((tileProviderError) => {
      console.error("Imagery tiles failed:", tileProviderError);
    });
    viewer.imageryLayers.add(layer);
  } catch (error) {
    console.error("Imagery provider rejected:", error);
    // Fallback: ion base imagery (requires a valid ion token).
    viewer.imageryLayers.add(Cesium.ImageryLayer.fromWorldImagery({}));
  }
}
```

## 7. Terrain with rejection handling

A globe with no elevation relief has no terrain provider, or its async load
rejected. Pass `terrain` at construction and watch the `Terrain` error event.

```js
function addTerrainWithDiagnostics(containerId) {
  const terrain = Cesium.Terrain.fromWorldTerrain();

  terrain.errorEvent.addEventListener((error) => {
    console.error("World Terrain failed to load:", error);
    // The globe falls back to the flat EllipsoidTerrainProvider.
  });

  return new Cesium.Viewer(containerId, { terrain });
}
```

## 8. Single-viewer reuse across routes

Each `Viewer` creates a WebGL context, and a browser tab caps live contexts
near 16. A single-page app that mounts a new `Viewer` per route exhausts the
budget. Reuse one `Viewer`, or destroy it on unmount.

```js
let sharedViewer = null;

function getSharedViewer(containerId) {
  if (sharedViewer === null || sharedViewer.isDestroyed()) {
    sharedViewer = new Cesium.Viewer(containerId, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
    });
  }
  return sharedViewer;
}

// Call on application teardown, not on every route change.
function disposeSharedViewer() {
  if (sharedViewer !== null && !sharedViewer.isDestroyed()) {
    sharedViewer.destroy();
    sharedViewer = null;
  }
}
```

When a component must own its `Viewer`, call `viewer.destroy()` in the
component unmount path. Teardown ordering for tilesets, data sources, and the
viewer is detailed in `cesium-errors-memory`.
