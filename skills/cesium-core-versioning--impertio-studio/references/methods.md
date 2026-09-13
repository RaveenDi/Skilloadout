# Methods Reference: Versioning and Migration

Companion to `SKILL.md`. All signatures and version facts verified against the
CesiumJS API reference (`cesium.com/learn/cesiumjs/ref-doc/`) and the official
`CHANGES.md` on 2026-05-20.

## 1. Async Factory Catalog

Every network-backed resource on a 1.124+ target loads through one of the
static factories below. Each factory returns a `Promise`. ALWAYS `await` it.
NEVER call the bare constructor and NEVER read `.ready` or `.readyPromise`.

### 3D Tiles

| Factory | Signature | Returns |
|---------|-----------|---------|
| `Cesium3DTileset.fromUrl` | `fromUrl(url, options?)` | `Promise<Cesium3DTileset>` |
| `Cesium3DTileset.fromIonAssetId` | `fromIonAssetId(assetId, options?)` | `Promise<Cesium3DTileset>` |

### Models

| Factory | Signature | Returns |
|---------|-----------|---------|
| `Model.fromGltfAsync` | `fromGltfAsync(options)` | `Promise<Model>` |

`options.url` (or `options.gltf`) carries the glTF or glb source.
`ModelExperimental` was merged into `Model` and no longer exists.

### Terrain

| Factory | Signature | Returns |
|---------|-----------|---------|
| `CesiumTerrainProvider.fromUrl` | `fromUrl(url, options?)` | `Promise<CesiumTerrainProvider>` |
| `CesiumTerrainProvider.fromIonAssetId` | `fromIonAssetId(assetId, options?)` | `Promise<CesiumTerrainProvider>` |
| `ArcGISTiledElevationTerrainProvider.fromUrl` | `fromUrl(url, options?)` | `Promise<ArcGISTiledElevationTerrainProvider>` |
| `createWorldTerrainAsync` | `createWorldTerrainAsync(options?)` | `Promise<CesiumTerrainProvider>` |

`EllipsoidTerrainProvider` has no network load and is constructed synchronously
with `new EllipsoidTerrainProvider(options?)`. It is the only terrain provider
that is not an async factory.

### Imagery

| Factory | Signature | Returns |
|---------|-----------|---------|
| `IonImageryProvider.fromAssetId` | `fromAssetId(assetId, options?)` | `Promise<IonImageryProvider>` |
| `BingMapsImageryProvider.fromUrl` | `fromUrl(url, options?)` | `Promise<BingMapsImageryProvider>` |
| `ArcGisMapServerImageryProvider.fromUrl` | `fromUrl(url, options?)` | `Promise<ArcGisMapServerImageryProvider>` |
| `TileMapServiceImageryProvider.fromUrl` | `fromUrl(url, options?)` | `Promise<TileMapServiceImageryProvider>` |
| `SingleTileImageryProvider.fromUrl` | `fromUrl(url, options?)` | `Promise<SingleTileImageryProvider>` |
| `ImageryLayer.fromProviderAsync` | `fromProviderAsync(imageryProviderPromise, options?)` | `ImageryLayer` |
| `ImageryLayer.fromWorldImagery` | `fromWorldImagery(options?)` | `ImageryLayer` |

`UrlTemplateImageryProvider`, `WebMapServiceImageryProvider`,
`WebMapTileServiceImageryProvider`, and `OpenStreetMapImageryProvider` build
their tile URLs from a template and are constructed synchronously with `new`.
They have no `from*` factory because they perform no readiness load.

### OSM Buildings

| Factory | Signature | Returns |
|---------|-----------|---------|
| `createOsmBuildingsAsync` | `createOsmBuildingsAsync(options?)` | `Promise<Cesium3DTileset>` |

## 2. Full Version Matrix With CHANGES.md Quotes

| Version | Verified change |
|---------|-----------------|
| 1.104 | Async `from*` factory constructors added across imagery, terrain, models, and tilesets "for better async flow and error handling". `readyPromise` deprecated with a removal notice for 1.107. |
| 1.107 | `ImageryProvider.ready` and `ImageryProvider.readyPromise` removed across all providers and tilesets. `createWorldTerrain` removed; use `createWorldTerrainAsync`. |
| 1.113 | Vertical exaggeration applied through the new `Scene.verticalExaggeration` and `Scene.verticalExaggerationRelativeHeight` properties, and now affects `Cesium3DTileset`. |
| 1.114 to 1.115 | `HeightReference` gains `CLAMP_TO_TERRAIN` and `CLAMP_TO_3D_TILE`; tileset collision changes from `disableCollision` to `enableCollision`. |
| 1.117 | `ClippingPolygon` and `ClippingPolygonCollection` added for multiple arbitrary-shape clipping regions. |
| 1.119 | `Ellipsoid.default` added as a central place to specify the default ellipsoid. |
| 1.121 | MSAA enabled by default with 4 samples ("To turn MSAA off set `scene.msaaSamples = 1`"). Default tonemapping switched from ACES to PBR Neutral. |
| 1.123 | `Viewer` functionality moved onto `CesiumWidget`: new properties `dataSourceDisplay`, `entities`, `dataSources` and new functions `zoomTo()`, `flyTo()`. |
| 1.127 | Voxel API: `VoxelProvider.requestData()` returns `Promise<VoxelContent>`; `EXT_primitive_voxels`. |
| 1.134 | `defaultValue` function removed ("Instead, use the nullish coalescing (`??`) operator"). `defaultValue.EMPTY_OBJECT` removed ("Instead, use `Frozen.EMPTY_OBJECT`"). |
| 1.135 to 1.142 | `EdgeDisplayMode` enum and `EXT_mesh_primitive_edge_visibility` added for CAD-style edge rendering. |
| 1.139 | `Cartesian2`, `Cartesian3`, and `Cartesian4` converted to ES6 classes; calling `new` on a static factory method now throws. |
| 1.142 | Current latest release at the time of verification. |

The async-factory migration at 1.104 and 1.107 is the single largest
cross-cutting break. Because the target floor is 1.124, the async pattern is
the ONLY valid pattern; the synchronous `new` + `readyPromise` pattern NEVER
works on any supported target.

## 3. CHANGES.md Section Structure

`CHANGES.md` lists releases newest-first. Each release block carries the
following subsections, in this order, and any of them may be absent for a
given release:

| Subsection | Meaning for a migration |
|------------|-------------------------|
| `### Breaking Changes` | Code that worked before this release now fails. Read first. |
| `### Deprecated` | API still works but names the version of its removal. Read second. |
| `### Additions` | New API. No migration action required. |
| `### Fixes` | Bug fixes. Rarely require action. |

ALWAYS fetch the raw form for an automated read:
`https://raw.githubusercontent.com/CesiumGS/cesium/main/CHANGES.md`. The
rendered GitHub blob page does not expose the changelog body to a fetch tool.

To plan an upgrade from version A to version B: collect every
`### Breaking Changes` and `### Deprecated` block for the releases strictly
above A and up to and including B, then resolve each entry before bumping the
`cesium` dependency.

## 4. Removed Utility: defaultValue

`defaultValue(a, b)` returned `a` when `a` was defined and `b` otherwise. It
was removed in 1.134. The replacement is the JavaScript nullish coalescing
operator `a ?? b`. The two differ in one way: `defaultValue` treated only
`undefined` as missing for its earliest behavior, while `??` falls through on
both `null` and `undefined` and NEVER on `0`, `false`, or `""`. The `??`
behavior is the intended one and avoids a class of falsy-value bugs.

`defaultValue.EMPTY_OBJECT`, a shared frozen empty object, moved to
`Frozen.EMPTY_OBJECT`.

## 5. Version Detection at Runtime

`Cesium.VERSION` is a string holding the running build version, for example
`"1.142"`. Use it to gate code or to log the active version, NEVER to branch
between a legacy and a modern path: a 1.124+ target supports only the modern
path.

```js
console.log("CesiumJS", Cesium.VERSION);
```

For a build-time check, read the `cesium` entry in `package.json`. ALWAYS pin
an exact version. NEVER pin `latest` or a broad caret range, because a CesiumJS
minor release can carry a breaking change.
