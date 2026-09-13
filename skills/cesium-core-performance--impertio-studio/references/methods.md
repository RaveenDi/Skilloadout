# Core Performance : Verified API Reference

All members, defaults, and signatures below are verified against the CesiumJS API
reference (https://cesium.com/learn/cesiumjs/ref-doc/) for CesiumJS 1.124+.

## Scene render-frequency and frame-cost members

| Member | Default | Notes |
|--------|---------|-------|
| `requestRenderMode` | `false` | render only on a detected change |
| `maximumRenderTimeChange` | `0.0` | max simulation seconds before an auto-render; set `Infinity` to never auto-render from time alone |
| `debugShowFramesPerSecond` | `false` | overlay of frames per second and ms per frame |
| `logarithmicDepthBuffer` | enabled where supported | reduces multi-frustum depth passes |
| `msaaSamples` | `4` | multisample anti-aliasing sample count; `1` disables MSAA |
| `farToNearRatio` | `1000.0` | controls multi-frustum splitting |
| `fog` | a `Fog` instance | distance fog, see below |

### Scene.requestRender()

```
scene.requestRender()
```

Requests one new rendered frame. Has effect ONLY while `requestRenderMode` is `true`.
Call it after any manual change Cesium cannot detect.

## Fog

Accessed as `scene.fog`. Distance fog blends far geometry and culls distant terrain
tiles and their requests.

| Member | Default | Notes |
|--------|---------|-------|
| `enabled` | `true` | master toggle |
| `renderable` | `true` | whether fog is drawn |
| `density` | `0.0006` | higher density culls more distant geometry |
| `visualDensityScalar` | `0.15` | scales the visual density |
| `screenSpaceErrorFactor` | `2.0` | error factor for fogged tiles |
| `minimumBrightness` | `0.03` | floor for fogged-surface brightness |
| `heightScalar` | `0.001` | height contribution to density |
| `maxHeight` | `800000.0` | camera height above which fog stops |

## Cesium3DTileset performance members

`Cesium3DTileset` is created with the async factories `Cesium3DTileset.fromUrl(url,
options)` and `Cesium3DTileset.fromIonAssetId(assetId, options)`. There is NO
`readyPromise`; the boundingSphere and other state are valid once the factory promise
resolves. Load progress is observed through the `initialTilesLoaded` and
`allTilesLoaded` events.

| Member | Default | Effect |
|--------|---------|--------|
| `maximumScreenSpaceError` | `16` | LOD budget; higher is coarser and faster |
| `foveatedScreenSpaceError` | `true` | allows higher error away from screen center |
| `foveatedConeSize` | `0.3` | size of the full-detail cone |
| `foveatedTimeDelay` | `0.2` | seconds before deferred foveated tiles load |
| `dynamicScreenSpaceError` | `true` | relaxes error for distant tiles |
| `skipLevelOfDetail` | `false` | when true, skips intermediate LOD levels |
| `skipScreenSpaceErrorFactor` | `16` | multiplier used while skipping |
| `skipLevels` | `1` | levels to skip when `skipLevelOfDetail` is true |
| `baseScreenSpaceError` | `1024` | error before skipping begins |
| `immediatelyLoadDesiredLevelOfDetail` | `false` | load only the final LOD |
| `loadSiblings` | `false` | load sibling tiles while skipping |
| `preferLeaves` | `false` | request leaf tiles sooner |
| `preloadWhenHidden` | `false` | keep loading while `show` is false |
| `preloadFlightDestinations` | `true` | preload tiles at a `flyTo` destination |
| `cullRequestsWhileMoving` | `true` | drop requests for tiles soon out of view |
| `cacheBytes` | `536870912` (512 MiB) | GPU cache target size |
| `maximumCacheOverflowBytes` | `536870912` (512 MiB) | allowed overflow above `cacheBytes` |

## RequestScheduler

A static utility class. Configure its static members directly; NEVER instantiate it.

| Static member | Default | Effect |
|---------------|---------|--------|
| `maximumRequests` | `50` | total simultaneous active requests |
| `maximumRequestsPerServer` | `18` | simultaneous active requests per server |
| `requestsByServer` | object | per-server overrides keyed by `host:port` |
| `throttleRequests` | `true` | when false, the browser queues requests instead |

## TaskProcessor

```
new Cesium.TaskProcessor(workerPath, maximumActiveTasks)
```

- `workerPath` : URL of the worker, absolute or relative to the Cesium `Workers` folder.
- `maximumActiveTasks` : optional, defaults to `Number.POSITIVE_INFINITY`.

| Method | Returns | Notes |
|--------|---------|-------|
| `scheduleTask(parameters, transferableObjects)` | `Promise` or `undefined` | `undefined` when active tasks exceed `maximumActiveTasks` |
| `isDestroyed()` | `boolean` | true after `destroy()` |
| `destroy()` | `void` | terminates the worker immediately |

`scheduleTask` returns `undefined` as a back-pressure signal, not an error. After
`destroy()`, only `isDestroyed()` may be called.
