# Core Architecture : Verified API Reference

All signatures below are verified against the CesiumJS API reference
(https://cesium.com/learn/cesiumjs/ref-doc/) for CesiumJS 1.124+.

## Viewer

```
new Cesium.Viewer(container, options)
```

- `container` : an `Element` or the string `id` of a DOM element.
- `options` : a `Viewer.ConstructorOptions` object.

### Viewer widget toggle options (boolean)

| Option | Default | Effect |
|--------|---------|--------|
| `animation` | `true` | animation (clock) widget |
| `baseLayerPicker` | `true` | imagery and terrain picker |
| `fullscreenButton` | `true` | fullscreen toggle |
| `vrButton` | `false` | VR mode toggle |
| `geocoder` | `IonGeocodeProviderType.DEFAULT` | search box |
| `homeButton` | `true` | reset-view button |
| `infoBox` | `true` | selected-feature panel |
| `sceneModePicker` | `true` | 3D / 2D / Columbus picker |
| `selectionIndicator` | `true` | selection crosshair |
| `timeline` | `true` | time scrubber |
| `navigationHelpButton` | `true` | navigation help overlay |

### Viewer rendering options

| Option | Default | Effect |
|--------|---------|--------|
| `scene3DOnly` | `false` | restrict geometry to `SCENE3D`, save GPU memory |
| `requestRenderMode` | `false` | render only on detected change |
| `maximumRenderTimeChange` | `0.0` | max simulation seconds before an auto-render |
| `contextOptions` | `undefined` | raw WebGL context flags |
| `sceneMode` | `SceneMode.SCENE3D` | initial scene mode |
| `msaaSamples` | `4` | multisample anti-aliasing sample count |

### Viewer members

| Member | Type | Notes |
|--------|------|-------|
| `scene` | `Scene` | forwarded from `cesiumWidget` |
| `camera` | `Camera` | same object as `scene.camera` |
| `clock` | `Clock` | simulation clock |
| `cesiumWidget` | `CesiumWidget` | the wrapped foundational widget |
| `entities` | `EntityCollection` | entities not tied to a data source |
| `dataSources` | `DataSourceCollection` | loaded data sources |

### Viewer methods

| Method | Returns | Notes |
|--------|---------|-------|
| `zoomTo(target, offset)` | `Promise<boolean>` | instant framing of a target |
| `flyTo(target, options)` | `Promise<boolean>` | animated flight to a target |
| `destroy()` | `void` | release all resources |
| `isDestroyed()` | `boolean` | true after `destroy()` |

## CesiumWidget

```
new Cesium.CesiumWidget(container, options)
```

The foundational rendering widget. `Viewer` wraps exactly one `CesiumWidget`.

### CesiumWidget members

| Member | Type | Notes |
|--------|------|-------|
| `scene` | `Scene` | the 3D scene |
| `camera` | `Camera` | same object as `scene.camera` |
| `clock` | `Clock` | simulation clock |
| `canvas` | `HTMLCanvasElement` | the WebGL canvas |
| `screenSpaceEventHandler` | `ScreenSpaceEventHandler` | input handler |
| `useDefaultRenderLoop` | `boolean` | when true, the widget drives the loop |
| `resolutionScale` | `number` | render-resolution scaling factor |
| `entities` | `EntityCollection` | entities not tied to a data source |
| `dataSources` | `DataSourceCollection` | loaded data sources |

### CesiumWidget methods

| Method | Returns | Notes |
|--------|---------|-------|
| `zoomTo()` | `Promise<boolean>` | instant framing |
| `flyTo()` | `Promise<boolean>` | animated flight |
| `render()` | `void` | render a single frame |
| `destroy()` | `void` | release all resources |
| `isDestroyed()` | `boolean` | true after `destroy()` |

`entities`, `dataSources`, `zoomTo`, and `flyTo` moved onto `CesiumWidget` in
CesiumJS 1.123, so they are available on both `CesiumWidget` and `Viewer`.

## Scene

`Scene` is the container for all 3D state. Reached as `viewer.scene` or
`widget.scene`. There is NO `scene.viewer` back-reference.

### Scene members

| Member | Type | Notes |
|--------|------|-------|
| `globe` | `Globe` | depth-test ellipsoid: terrain and imagery |
| `camera` | `Camera` | the scene camera |
| `primitives` | `PrimitiveCollection` | primitive content |
| `screenSpaceCameraController` | `ScreenSpaceCameraController` | camera input |
| `skyAtmosphere` | `SkyAtmosphere` | atmosphere drawn around the globe |
| `skyBox` | `SkyBox` | star field |
| `sun` | `Sun` | the sun |
| `moon` | `Moon` | the moon |
| `light` | `Light` | shading light, `SunLight` by default |
| `fog` | `Fog` | distance fog |
| `postProcessStages` | `PostProcessStageCollection` | post-processing effects |
| `mode` | `SceneMode` | current scene mode |
| `requestRenderMode` | `boolean` | render-on-change toggle |
| `maximumRenderTimeChange` | `number` | max simulation seconds before auto-render |
| `pickPositionSupported` | `boolean` | true if `pickPosition` is supported |

### Scene methods

| Method | Notes |
|--------|-------|
| `render(time)` | update and render one frame |
| `requestRender()` | request the next frame while in `requestRenderMode` |
| `morphTo3D(duration)` | morph to `SCENE3D` over `duration` seconds |
| `morphTo2D(duration)` | morph to `SCENE2D` over `duration` seconds |
| `morphToColumbusView(duration)` | morph to `COLUMBUS_VIEW` over `duration` seconds |

### Scene per-frame events

Fired in this fixed order each frame. Attach with `addEventListener`.

| Order | Event | Fires |
|-------|-------|-------|
| 1 | `preUpdate` | before the scene is updated for the frame |
| 2 | `postUpdate` | after update, before rendering |
| 3 | `preRender` | after update, immediately before rendering |
| 4 | `postRender` | immediately after the frame is rendered |

## SceneMode

| Value | View |
|-------|------|
| `SceneMode.SCENE3D` | 3D perspective view of the globe |
| `SceneMode.SCENE2D` | top-down orthographic map |
| `SceneMode.COLUMBUS_VIEW` | 2.5D flat map, non-zero heights drawn above it |
| `SceneMode.MORPHING` | transient state during a mode transition |

## requestRenderMode summary

| Property | On | Effect |
|----------|----|----|
| `requestRenderMode` | `Viewer`, `CesiumWidget`, `Scene` | render only on detected change |
| `maximumRenderTimeChange` | `Viewer`, `CesiumWidget`, `Scene` | seconds of simulation time allowed before an auto-render; set `Infinity` to never auto-render from time alone |

Cesium auto-requests a render for: camera movement, imagery and tileset loads, entity
property changes, and a simulation-time change beyond `maximumRenderTimeChange`. For
any change Cesium cannot detect, call `scene.requestRender()` explicitly.
