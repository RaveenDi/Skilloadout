# CesiumJS Build and Deployment Reference

Verified against the CesiumJS quickstart at `https://cesium.com/learn`, the
official `CesiumGS/cesium-webpack-example` repository, and the
`vite-plugin-cesium` package, for the 1.124+ release line.

## The cesium npm package

```bash
npm install cesium
```

The package installs a prebuilt distribution at
`node_modules/cesium/Build/Cesium`. The JavaScript entry point is resolved by
the bare specifier `cesium`, so application code imports from `"cesium"`.

An engine-only package, `@cesium/engine`, ships the renderer without the
default widgets. Its widget CSS path differs; see the CSS section.

## The four static directories

Inside `node_modules/cesium/Build/Cesium`:

| Directory | Contents | Loaded as |
|-----------|----------|-----------|
| `Workers` | Web Worker scripts | Fetched at runtime relative to the base URL |
| `ThirdParty` | Third-party worker dependencies | Fetched at runtime |
| `Assets` | Textures, IAU data, default imagery | Fetched at runtime |
| `Widgets` | Widget CSS and images | `widgets.css` imported, images fetched |

These are NOT part of the JavaScript bundle. The build MUST copy them into the
deployed output, and they MUST be served as static files.

## The CESIUM_BASE_URL global

CesiumJS computes the URL of every worker and asset by joining the request
path onto a base URL. It reads that base URL from the `CESIUM_BASE_URL` global
identifier during module initialization.

| Context | How the base URL is provided |
|---------|------------------------------|
| No bundler | Assign `window.CESIUM_BASE_URL` before importing CesiumJS |
| Vite with `vite-plugin-cesium` | The plugin configures it |
| webpack | `webpack.DefinePlugin` replaces the `CESIUM_BASE_URL` identifier |

The value MUST point at the directory that contains `Workers`, `ThirdParty`,
`Assets`, and `Widgets`. It MUST be set before the first CesiumJS import; a
later assignment is ignored.

## vite-plugin-cesium

```bash
npm install cesium
npm install --save-dev vite-plugin-cesium
```

```js
import { defineConfig } from "vite";
import cesium from "vite-plugin-cesium";

export default defineConfig({
  plugins: [cesium()],
});
```

The plugin copies the static directories into the build and configures the
base URL, so application code does not assign `window.CESIUM_BASE_URL`.

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `rebuildCesium` | boolean | `false` | When `false`, copies the prebuilt minified CesiumJS; when `true`, rebuilds CesiumJS from source |

## webpack configuration

The reference is `CesiumGS/cesium-webpack-example`, directory `webpack-5`.

Path variables:

```js
const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumBaseUrl = "cesiumStatic";
```

`copy-webpack-plugin` copies the four directories under the shared base-URL
path:

```js
new CopyWebpackPlugin({
  patterns: [
    { from: path.join(cesiumSource, "Workers"), to: `${cesiumBaseUrl}/Workers` },
    { from: path.join(cesiumSource, "ThirdParty"), to: `${cesiumBaseUrl}/ThirdParty` },
    { from: path.join(cesiumSource, "Assets"), to: `${cesiumBaseUrl}/Assets` },
    { from: path.join(cesiumSource, "Widgets"), to: `${cesiumBaseUrl}/Widgets` },
  ],
});
```

`webpack.DefinePlugin` injects the same value as the `CESIUM_BASE_URL`
identifier:

```js
new webpack.DefinePlugin({
  CESIUM_BASE_URL: JSON.stringify(cesiumBaseUrl),
});
```

Required output and module settings:

| Setting | Value | Reason |
|---------|-------|--------|
| `output.sourcePrefix` | `""` | Prevents webpack from indenting and breaking worker code |
| CSS rule | `["style-loader", "css-loader"]` | Lets `widgets.css` be imported from JavaScript |

The `CopyWebpackPlugin` `to` path and the `DefinePlugin` value MUST be the
same string. A mismatch routes asset requests to a path that does not exist.

## ES6 named imports

```js
import { Ion, Viewer, Cartesian3 } from "cesium";
```

Named imports let the bundler tree-shake unused CesiumJS code. A namespace
import (`import * as Cesium from "cesium"`) pulls the whole library into the
bundle.

## Widget CSS

| Package | CSS import path |
|---------|-----------------|
| `cesium` | `cesium/Build/Cesium/Widgets/widgets.css` |
| `@cesium/engine` | `@cesium/engine/Source/Widget/CesiumWidget.css` |

The CSS import is mandatory for any application that constructs a `Viewer`.

## Sandcastle

Sandcastle at `sandcastle.cesium.com` is the official live example gallery.
Each example runs in a scaffold that auto-provides the `Cesium` global, the
HTML page, and a shared demo ion token. None of those exist in a production
build. The conversion steps are listed in `SKILL.md` and worked through in
`references/examples.md`.
