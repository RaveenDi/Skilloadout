# Scene Architect Decision Reference

This skill is an orchestration skill. Its "methods" are decision criteria, each
routed to the skill that holds the verified API detail. Verified against the
project research base on 2026-05-20.

## Decision 1 : Viewer class

| Criterion | Choose | Governing skill |
|-----------|--------|-----------------|
| App wants the default toolbar, timeline, animation, geocoder, infobox | `Viewer` | `cesium-syntax-viewer` |
| App wants one or two default widgets only | `Viewer` with the rest disabled via boolean options | `cesium-syntax-viewer` |
| App supplies its own UI, wants no default widgets | `CesiumWidget` | `cesium-core-architecture` |

Precondition for any ion asset: `Ion.defaultAccessToken` is set before
construction.

## Decision 2 : Imagery base layer

| Criterion | Choose | Governing skill |
|-----------|--------|-----------------|
| Cesium-hosted default imagery | `ImageryLayer.fromWorldImagery` | `cesium-syntax-imagery` |
| Free OpenStreetMap raster | `OpenStreetMapImageryProvider` | `cesium-syntax-imagery` |
| Bing Maps imagery | `BingMapsImageryProvider` | `cesium-syntax-imagery` |
| Esri / ArcGIS map service | `ArcGisMapServerImageryProvider` | `cesium-syntax-imagery` |
| Custom XYZ template, including MapTiler | `UrlTemplateImageryProvider` | `cesium-syntax-imagery` |
| OGC WMTS or WMS service | `WebMapTileServiceImageryProvider`, `WebMapServiceImageryProvider` | `cesium-syntax-imagery` |
| No imagery wanted | construct with `baseLayer: false` | `cesium-syntax-viewer` |

## Decision 3 : Terrain

| Criterion | Choose | Governing skill |
|-----------|--------|-----------------|
| Global realistic elevation | `Terrain.fromWorldTerrain()` or `createWorldTerrainAsync()` | `cesium-syntax-terrain` |
| Custom quantized-mesh server | `CesiumTerrainProvider.fromUrl(url)` | `cesium-syntax-terrain` |
| Esri elevation service | `ArcGISTiledElevationTerrainProvider.fromUrl(url)` | `cesium-syntax-terrain` |
| Flat ellipsoid, no elevation | `EllipsoidTerrainProvider` (the default) | `cesium-syntax-terrain` |

When terrain is enabled, every surface-bound dataset needs a ground-clamping
plan. See `cesium-errors-coordinates`.

## Decision 4 : Data representation

| Criterion | Choose | Governing skill |
|-----------|--------|-----------------|
| Streamed city, point cloud, photogrammetry, massive BIM | `Cesium3DTileset` | `cesium-syntax-3d-tiles` |
| Interactive or time-dynamic data, under roughly 10000 features | Entity API | `cesium-syntax-entity` |
| Large static geometry set, above roughly 10000 features | batched `Primitive` plus `GeometryInstance` | `cesium-syntax-primitive` |
| A single glTF or glb asset | `Model.fromGltfAsync` | `cesium-syntax-gltf-model` |
| File-based vector or time-dynamic data | `GeoJsonDataSource`, `KmlDataSource`, `CzmlDataSource` | `cesium-syntax-datasources` |
| Georeferencing a BIM or CityGML model | `Transforms` plus `modelMatrix` | `cesium-impl-aec-georef` |

The ~10000 threshold is a guideline. The hard rule: when the per-tick entity
visualizer loop dominates the frame budget, move to batched primitives or
3D Tiles.

## Decision 5 : requestRenderMode

| Criterion | Choose | Governing skill |
|-----------|--------|-----------------|
| Scene mostly static, changes on user action | `requestRenderMode: true`, call `scene.requestRender()` after manual changes | `cesium-core-performance` |
| Scene animates every frame (constant motion, video texture) | leave continuous rendering | `cesium-core-performance` |

## Decision 6 : Teardown

| Item | Plan | Governing skill |
|------|------|-----------------|
| The viewer | one `viewer.destroy()` on the cleanup path | `cesium-core-memory` |
| Event listeners | keep every remover, call on teardown | `cesium-core-memory` |
| `ScreenSpaceEventHandler` | `handler.destroy()` explicitly | `cesium-impl-picking-measurement` |
| Custom primitives and collections | `destroy()` each | `cesium-core-memory` |
| SPA or React routing | ONE long-lived viewer, never one per route | `cesium-impl-resium`, `cesium-errors-memory` |
