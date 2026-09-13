# Methods Reference: Viewer Construction

Companion to `SKILL.md`. All signatures, option names, and defaults verified
against the CesiumJS API reference (`cesium.com/learn/cesiumjs/ref-doc/`) on
2026-05-20.

## 1. Viewer Constructor

```js
new Cesium.Viewer(container, options);
```

| Argument | Type | Required | Meaning |
|----------|------|----------|---------|
| `container` | `Element` or `String` | yes | DOM element, or the `id` of an existing element |
| `options` | `Object` | no | Construction options; every field has a default |

If `container` resolves to no element, the constructor throws a
`DeveloperError`.

## 2. Full Constructor Option Catalog

### Widget toggle options

| Option | Type | Default |
|--------|------|---------|
| `animation` | boolean | `true` |
| `baseLayerPicker` | boolean | `true` |
| `fullscreenButton` | boolean | `true` |
| `vrButton` | boolean | `false` |
| `geocoder` | boolean or `IonGeocodeProviderType` or `GeocoderService[]` | `IonGeocodeProviderType.DEFAULT` |
| `homeButton` | boolean | `true` |
| `infoBox` | boolean | `true` |
| `sceneModePicker` | boolean | `true` |
| `selectionIndicator` | boolean | `true` |
| `timeline` | boolean | `true` |
| `navigationHelpButton` | boolean | `true` |

### Rendering options

| Option | Type | Default |
|--------|------|---------|
| `scene3DOnly` | boolean | `false` |
| `requestRenderMode` | boolean | `false` |
| `maximumRenderTimeChange` | number | `0.0` |
| `contextOptions` | `ContextOptions` | undefined |
| `sceneMode` | `SceneMode` | `SceneMode.SCENE3D` |
| `msaaSamples` | number | `4` |
| `useBrowserRecommendedResolution` | boolean | `true` |
| `targetFrameRate` | number | undefined |
| `orderIndependentTranslucency` | boolean | `true` |
| `shadows` | boolean | `false` |
| `mapProjection` | `MapProjection` | `new GeographicProjection()` |

### Data options

| Option | Type | Default |
|--------|------|---------|
| `baseLayer` | `ImageryLayer` or `false` | `ImageryLayer.fromWorldImagery()` |
| `terrain` | `Terrain` | undefined |
| `globe` | `Globe` or `false` | `new Globe(options.ellipsoid)` |
| `skyBox` | `SkyBox` or `false` | default star field on a WGS84 ellipsoid |
| `dataSources` | `DataSourceCollection` | `new DataSourceCollection()` |
| `shouldAnimate` | boolean | `false` |

## 3. contextOptions Structure

`contextOptions` is passed to WebGL context creation. CesiumJS uses WebGL2
only.

| Field | Type | Notes |
|-------|------|-------|
| `requestWebgl2` | boolean | Request a WebGL2 context |
| `webgl` | object | Raw WebGL context attributes |
| `webgl.alpha` | boolean | Canvas alpha blending with HTML behind it |
| `webgl.powerPreference` | string | `"high-performance"`, `"low-power"`, or `"default"` |
| `webgl.antialias` | boolean | Browser-level antialias hint |

## 4. Key Viewer Instance Properties

All are readonly unless noted.

| Property | Type | Meaning |
|----------|------|---------|
| `scene` | `Scene` | The 3D scene; container for globe, camera, primitives |
| `camera` | `Camera` | The scene camera |
| `clock` | `Clock` | Simulation clock |
| `entities` | `EntityCollection` | Entities not tied to a data source |
| `dataSources` | `DataSourceCollection` | Visualized data sources |
| `imageryLayers` | `ImageryLayerCollection` | Imagery layers on the globe |
| `terrainProvider` | `TerrainProvider` | Active terrain provider (writable) |
| `screenSpaceEventHandler` | `ScreenSpaceEventHandler` | Input event handler |
| `canvas` | `HTMLCanvasElement` | The rendering canvas |
| `selectedEntity` | `Entity` | Currently selected entity (writable) |
| `trackedEntity` | `Entity` | Entity the camera tracks (writable) |

## 5. Key Viewer Methods

| Method | Returns | Purpose |
|--------|---------|---------|
| `zoomTo(target, offset?)` | `Promise<boolean>` | Frame an entity, data source, or tileset |
| `flyTo(target, options?)` | `Promise<boolean>` | Animated camera flight to a target |
| `destroy()` | void | Release the WebGL context and GPU resources |
| `isDestroyed()` | boolean | Report whether `destroy()` has run |
| `render()` | void | Render a single frame |
| `forceResize()` | void | Recompute canvas size after a layout change |

## 6. CesiumWidget

```js
new Cesium.CesiumWidget(container, options);
```

`CesiumWidget` is the foundational rendering surface with no UI chrome. It
accepts the rendering and data options from the tables above (it does NOT
accept the widget toggle options, because it has no widgets) plus:

| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `useDefaultRenderLoop` | boolean | `true` | When `false`, the app drives the render loop |
| `resolutionScale` | number | `1.0` | Multiplier on the rendering resolution |
| `showRenderLoopErrors` | boolean | `true` | Show an HTML panel on a render-loop error |

Exposed instance members include `scene`, `camera`, `clock`, `canvas`, and
`screenSpaceEventHandler`. Since CesiumJS 1.123, `entities`, `dataSources`,
`zoomTo()`, and `flyTo()` are also available on `CesiumWidget`.

## 7. Ion Token API

```js
Cesium.Ion.defaultAccessToken = "<token>";
```

`Ion.defaultAccessToken` is a process-wide token read by every ion-backed
service: World Terrain, World Imagery, Cesium OSM Buildings, ion imagery, and
the ion geocoder. ALWAYS assign it before constructing a `Viewer` or
`CesiumWidget` that touches an ion asset. `Ion.defaultServer` holds the ion
server URL and rarely needs changing.
