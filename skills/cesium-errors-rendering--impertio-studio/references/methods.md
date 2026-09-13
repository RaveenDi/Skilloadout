# Methods : APIs for Diagnosing and Recovering Rendering Failures

All identifiers below are verified against the CesiumJS API Reference
(`https://cesium.com/learn/cesiumjs/ref-doc/`) and the official
`cesium-webpack-example` repository, both listed in `SOURCES.md`. CesiumJS
1.124+ renders exclusively on WebGL2.

## window.CESIUM_BASE_URL

A global string that tells CesiumJS where to fetch its runtime static assets:
the Web Workers, third-party libraries, baked assets, and widget CSS.

- ALWAYS assign it before the `cesium` module is imported. The import triggers
  asset URL resolution; a late assignment is read after the URLs are already
  fixed.
- The value is a URL path to the directory that contains `Workers/`,
  `ThirdParty/`, `Assets/`, and `Widgets/`.
- A bundler plugin can define it at build time instead of a runtime assignment.

```js
window.CESIUM_BASE_URL = "/cesium/";
```

Source: `cesium-webpack-example` (SOURCES.md, Official Build Reference);
CesiumJS Learn build tutorial.

## Cesium.Ion.defaultAccessToken

Static property. The default Cesium ion access token used by every ion-backed
request (World Terrain, Cesium OSM Buildings, ion imagery, the ion geocoder).

- ALWAYS set it before constructing a `Viewer` that uses any ion asset. A
  missing or invalid token produces HTTP 401 and a black globe.
- `Cesium.Ion.defaultServer` is the companion property; it defaults to
  `https://api.cesium.com`.

```js
Cesium.Ion.defaultAccessToken = "<your account token>";
```

Source: `Ion` class, CesiumJS API Reference.

## Viewer constructor options relevant to rendering failures

`new Cesium.Viewer(container, options)`. Options that affect failure diagnosis:

| Option | Type | Default | Role in failures |
|--------|------|---------|------------------|
| `showRenderLoopErrors` | boolean | `true` | When `true`, a render-loop exception is shown in an HTML error panel over the canvas. Set `false` to suppress the panel and handle errors through `scene.renderError`. |
| `requestRenderMode` | boolean | `false` | When `true`, frames render only on change; a missed `scene.requestRender()` call looks like a frozen globe. |
| `contextOptions` | object | none | Raw WebGL context creation flags, including `requestWebgl2` and `powerPreference`. |
| `baseLayer` | `ImageryLayer` or `false` | ion base imagery | When `false`, no default imagery provider is added; the globe is a flat solid color until a layer is attached. |
| `terrain` | `Terrain` | none | A `Terrain` object; when absent the globe uses the flat `EllipsoidTerrainProvider`. |
| `msaaSamples` | number | `4` | Multisample anti-aliasing sample count. |
| `scene3DOnly` | boolean | `false` | Restricts geometry to the 3D `SceneMode`. |

Source: `Viewer` class, CesiumJS API Reference.

## Scene.renderError

Event raised when an error is thrown inside the `render` function. Exceptions
in `render` are always caught so this event can be raised.

- ALWAYS subscribe to it to log render-loop failures; a silent render exception
  produces a frozen frame with no console trace otherwise.
- The listener receives the `Scene` and the thrown error.

```js
viewer.scene.renderError.addEventListener((scene, error) => {
  console.error("Cesium render error:", error);
});
```

Source: `Scene#renderError`, CesiumJS API Reference.

## Scene.rethrowRenderErrors

Boolean property. Exceptions in `render` are always caught to raise
`renderError`. When `rethrowRenderErrors` is `true`, the error is rethrown
after the event is raised, so an external error boundary or logger sees it.

```js
viewer.scene.rethrowRenderErrors = true;
```

Source: `Scene#rethrowRenderErrors`, CesiumJS API Reference.

## Scene.requestRender

Method that requests a single new rendered frame. It has effect only when
`Scene#requestRenderMode` is `true`. A globe that looks frozen under
`requestRenderMode` is a missing `requestRender()` call, not a render failure.

```js
viewer.scene.requestRender();
```

Source: `Scene#requestRender`, CesiumJS API Reference.

## Scene.canvas

Readonly property. The `HTMLCanvasElement` the scene is bound to. It is the
element to attach the WebGL context-loss listeners to.

```js
const canvas = viewer.scene.canvas;
canvas.addEventListener("webglcontextlost", handler, false);
```

Source: `Scene#canvas`, CesiumJS API Reference.

## webglcontextlost and webglcontextrestored

Standard HTML canvas events, not CesiumJS APIs. The browser fires
`webglcontextlost` when the GPU drops the WebGL context (driver reset, GPU
out-of-memory, backgrounded tab) and `webglcontextrestored` when it becomes
available again. The associated WebGL error constant is `CONTEXT_LOST_WEBGL`.

- ALWAYS call `event.preventDefault()` in the `webglcontextlost` listener;
  without it the browser will not restore the context.
- CesiumJS does not rebuild its GPU resources automatically. Recovery is to
  `destroy()` the dead `Viewer` and construct a new one.

Source: HTML Living Standard; CesiumGS/cesium issues #10017 and #5991
(SOURCES.md, Real-world Anti-patterns).

## ImageryLayer.errorEvent and ImageryProvider.errorEvent

Event raised when an imagery provider hits an asynchronous error (bad URL,
CORS rejection, HTTP 401 or 403). Listeners receive a `TileProviderError`
instance. `ImageryLayer` and `ImageryProvider` both expose `errorEvent`.

```js
imageryLayer.errorEvent.addEventListener((tileProviderError) => {
  console.error("Imagery failed:", tileProviderError);
});
```

Source: `ImageryLayer#errorEvent`, `ImageryProvider#errorEvent`, CesiumJS API
Reference.

## ImageryLayer.fromWorldImagery and ImageryLayer.fromProviderAsync

Async static factories for imagery layers, used to recover a globe that has no
imagery:

- `ImageryLayer.fromWorldImagery(options)` : a layer for ion's default global
  base imagery. Requires a valid ion token.
- `ImageryLayer.fromProviderAsync(imageryProviderPromise, options)` : a layer
  from any asynchronous imagery provider, including non-ion providers.

```js
const layer = ImageryLayer.fromWorldImagery({});
viewer.imageryLayers.add(layer);
```

Source: `ImageryLayer` class, CesiumJS API Reference.

## ImageryLayerCollection

`viewer.imageryLayers` is the `ImageryLayerCollection` for the globe.

- `add(layer, index)` : adds an imagery layer.
- `removeAll(destroy)` : removes every layer; recovery starts from a clean
  collection.

Source: `ImageryLayerCollection` class, CesiumJS API Reference.

## Terrain.fromWorldTerrain and createWorldTerrainAsync

Cesium World Terrain loaders, used to recover a globe with no elevation:

- `Terrain.fromWorldTerrain(options)` : returns a `Terrain` helper that wraps
  async provider loading; pass it as the `Viewer` `terrain` option.
- `createWorldTerrainAsync(options)` : the global async function that returns a
  Promise of the World Terrain provider.
- `Terrain.errorEvent` is raised when the terrain provider fails to load;
  `Terrain.readyEvent` is raised when it loads successfully.

```js
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
});
```

Source: `Terrain` class and `createWorldTerrainAsync`, CesiumJS API Reference.

## Build plugins that copy the static directories

CesiumJS ships four static directories (`Workers`, `ThirdParty`, `Assets`,
`Widgets`) that the bundler must copy into the output, and a base URL the
bundler must define:

- Vite : `vite-plugin-cesium` copies the directories and sets the base URL.
- webpack : `CopyWebpackPlugin` copies the four directories;
  `DefinePlugin` sets `CESIUM_BASE_URL` at build time.

Source: `cesium-webpack-example` (SOURCES.md, Official Build Reference);
CesiumJS Learn build tutorial.
