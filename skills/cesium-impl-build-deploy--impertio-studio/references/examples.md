# CesiumJS Build and Deployment Examples

Complete, runnable setups. Verified against the CesiumJS quickstart, the
`cesium-webpack-example` repository, and `vite-plugin-cesium`.

## 1. Vite project, full setup

```bash
npm create vite@latest cesium-app -- --template vanilla
cd cesium-app
npm install cesium
npm install --save-dev vite-plugin-cesium
```

```js
// vite.config.js
import { defineConfig } from "vite";
import cesium from "vite-plugin-cesium";

export default defineConfig({
  plugins: [cesium()],
});
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Cesium App</title>
    <style>
      html,
      body,
      #cesiumContainer {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="cesiumContainer"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>
```

```js
// main.js
import { Ion, Viewer } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

Ion.defaultAccessToken = "<your ion token>";
const viewer = new Viewer("cesiumContainer");
```

`vite-plugin-cesium` copies the static directories and configures the base
URL, so `main.js` never assigns `window.CESIUM_BASE_URL`.

## 2. Webpack 5 project, full setup

```bash
npm install cesium
npm install --save-dev webpack webpack-cli copy-webpack-plugin \
  style-loader css-loader html-webpack-plugin
```

```js
// webpack.config.js
const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumBaseUrl = "cesiumStatic";

module.exports = {
  context: __dirname,
  entry: "./src/index.js",
  output: {
    filename: "app.js",
    path: path.resolve(__dirname, "dist"),
    sourcePrefix: "",
  },
  resolve: {
    fallback: { https: false, zlib: false, http: false, url: false },
    mainFiles: ["index", "Cesium"],
  },
  module: {
    rules: [
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
      {
        test: /\.(png|gif|jpg|jpeg|svg|xml|json)$/,
        use: ["url-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: "src/index.html" }),
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
  mode: "development",
};
```

```js
// src/index.js
import { Ion, Viewer } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

Ion.defaultAccessToken = "<your ion token>";
const viewer = new Viewer("cesiumContainer");
```

The `CopyWebpackPlugin` destination and the `DefinePlugin` value are the same
string, `cesiumStatic`.

## 3. No bundler, plain HTML with a local copy

Copy `node_modules/cesium/Build/Cesium` into a served folder, for example
`public/cesiumStatic`, then:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="/cesiumStatic/Widgets/widgets.css" />
    <script>
      // Set before any CesiumJS code runs.
      window.CESIUM_BASE_URL = "/cesiumStatic";
    </script>
  </head>
  <body>
    <div id="cesiumContainer"></div>
    <script type="module">
      import { Ion, Viewer } from "/cesiumStatic/index.js";

      Ion.defaultAccessToken = "<your ion token>";
      const viewer = new Viewer("cesiumContainer");
    </script>
  </body>
</html>
```

The inline script sets `window.CESIUM_BASE_URL` before the module import runs.

## 4. Sandcastle to production conversion

A Sandcastle example as it appears in the gallery:

```js
// Sandcastle: Cesium global is implicit, token and HTML are provided.
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
});

const buildings = await Cesium.createOsmBuildingsAsync();
viewer.scene.primitives.add(buildings);
```

The same logic as production code in a bundled project:

```js
// src/index.js in a Vite or webpack project.
import {
  Ion,
  Viewer,
  Terrain,
  createOsmBuildingsAsync,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// 1. Own ion token, never the Sandcastle demo token.
Ion.defaultAccessToken = "<your ion token>";

// 2. Named imports replace the Cesium global.
const viewer = new Viewer("cesiumContainer", {
  terrain: Terrain.fromWorldTerrain(),
});

const buildings = await createOsmBuildingsAsync();
viewer.scene.primitives.add(buildings);
```

```html
<!-- src/index.html: real container and a height. -->
<div id="cesiumContainer"></div>
<style>
  html,
  body,
  #cesiumContainer {
    width: 100%;
    height: 100%;
    margin: 0;
  }
</style>
```

The bundler setup from recipe 1 or 2 supplies `CESIUM_BASE_URL` and copies the
static directories.

## 5. Verifying a deployed build

After deploying, open the browser developer tools Network tab and reload.

- Requests under the base-URL path for `Workers`, `Assets`, and `Widgets`
  return `200`. A `404` there means the asset copy or the base URL is wrong.
- No `Cesium is not defined` error. That error means Sandcastle global code
  was shipped without converting to named imports.
- The widgets are styled. Unstyled widgets mean `widgets.css` was not imported.
