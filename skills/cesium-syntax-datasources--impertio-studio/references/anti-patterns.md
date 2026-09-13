# DataSources : Anti-Patterns

> Each entry: symptom, root cause, prevention, recovery.
> Verified against CesiumGS/cesium GitHub issues and cesium.com ref-doc on
> 2026-05-20.

## 1. Instance load wipes existing entities

Symptom: a second `load` call makes every previously shown entity vanish.

Root cause: instance `load` on `CzmlDataSource` and `GeoJsonDataSource` CLEARS
the data source before loading. It is a replace operation, not an append.

Prevention: ALWAYS use `process` to add CZML packets to a live data source.
Reserve instance `load` for deliberately swapping one dataset for another.

Recovery: change the second `load` to `process`. For data that should coexist,
load each dataset into a SEPARATE data source instead.

## 2. GeoJSON or KML geometry floats or sinks

Symptom: polygons and lines hover above the hills, or disappear under terrain.

Root cause: `clampToGround` defaults to `false`. Unclamped geometry renders at
ellipsoid height 0, which is below or above real terrain.

Prevention: ALWAYS pass `clampToGround: true` for vector data shown over
terrain.

Recovery: reload with `clampToGround: true`. The option is read at load time;
there is no post-load toggle on the data source.

## 3. Reading entities before the promise resolves

Symptom: `dataSource.entities.values` is empty right after `load()`.

Root cause: `load` is asynchronous. The entities exist only after the returned
promise resolves.

Prevention: ALWAYS `await` the loader, or `await viewer.dataSources.add(...)`,
before touching `entities`.

Recovery: move entity access inside a `.then()` callback or after the `await`.

## 4. KML network links and overlays do nothing

Symptom: a KML with NetworkLink or ScreenOverlay nodes loads but stays static,
or shows no overlay.

Root cause: `camera` and `canvas` were not passed. KML uses the camera view and
canvas size to build network-link request parameters and to size overlays.

Prevention: ALWAYS pass `camera: viewer.scene.camera` and
`canvas: viewer.scene.canvas` to `KmlDataSource.load`.

Recovery: reload with both options set.

## 5. Data sources leak GPU memory

Symptom: memory climbs as data sources are swapped; the tab slows down.

Root cause: `remove` and `removeAll` default `destroy` to `false`, so the
removed data source keeps its entity primitives and WebGL buffers.

Prevention: ALWAYS call `remove(ds, true)` or `removeAll(true)` when the data
is gone for good.

Recovery: re-add the data source, then remove it again with `destroy` set to
`true`. Otherwise its primitives are released only when the viewer itself is
destroyed.

## 6. CZML rejected for a bad version

Symptom: `CzmlDataSource.load` rejects with `RuntimeError`, "Cesium only
supports CZML version 1." or "CZML version information invalid."

Root cause: the CZML array is missing its document packet, or the document
packet has no `version`, or it declares a major version other than `1`.

Prevention: ALWAYS make the first array element the document packet:
`{ "id": "document", "version": "1.0" }`.

Recovery: prepend the document packet to the CZML array.

## 7. Hand-building entities a file format already describes

Symptom: long imperative code parsing GeoJSON features into `Entity` objects
one by one.

Root cause: the data-source loader is overlooked.

Prevention: ALWAYS load GeoJSON, TopoJSON, CZML, KML, and KMZ through their
data source. They produce styled, pickable entities in one call.

Recovery: replace the manual parser with `GeoJsonDataSource.load`,
`CzmlDataSource.load`, or `KmlDataSource.load`.
