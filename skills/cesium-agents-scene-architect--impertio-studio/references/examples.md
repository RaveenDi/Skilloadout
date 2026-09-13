# Scene Architect Worked Plans

Three worked applications of the six-decision path. Each produces a setup plan,
not raw code; the named skill supplies the verified code. Target version
1.124+. CesiumJS is WebGL2 only.

## Plan A : Static AEC site viewer

A digital-twin viewer for one construction site: terrain, a streamed
photogrammetry mesh, a georeferenced BIM model, no animation.

1. **Viewer class** : `Viewer`. The team wants the geocoder and infobox.
   `Ion.defaultAccessToken` set first.
2. **Imagery** : `ImageryLayer.fromWorldImagery`. Realistic context imagery.
3. **Terrain** : `Terrain.fromWorldTerrain()`. The site has real elevation.
4. **Data representation** :
   - Photogrammetry mesh : `Cesium3DTileset` (`cesium-syntax-3d-tiles`).
   - BIM model exported to glb : `Model.fromGltfAsync`, placed with a
     `modelMatrix` from `cesium-impl-aec-georef`.
   - Site boundary from GeoJSON : `GeoJsonDataSource` with
     `clampToGround: true`.
5. **requestRenderMode** : `true`. The scene only changes when the user moves
   the camera or toggles a layer.
6. **Teardown** : one `viewer.destroy()`; the tileset and model live in
   `scene.primitives` and are covered by it.

Result: a low-power, static-friendly scene. Hand each item to its skill.

## Plan B : Time-dynamic vehicle tracking app

A live operations dashboard showing up to 2000 moving vehicles over time.

1. **Viewer class** : `Viewer`. The timeline and animation widgets drive the
   clock.
2. **Imagery** : `OpenStreetMapImageryProvider`. No ion imagery quota needed.
3. **Terrain** : `EllipsoidTerrainProvider`, the default. Flat is acceptable
   for a 2D-style operational view.
4. **Data representation** : Entity API. 2000 features is well under the
   ~10000 guideline, and the data is time-dynamic. Each vehicle is an `Entity`
   with a `SampledPositionProperty` (`cesium-syntax-entity`,
   `cesium-syntax-time`).
5. **requestRenderMode** : leave continuous rendering. Positions advance every
   frame from the clock, so on-demand rendering would gain nothing.
6. **Teardown** : one `viewer.destroy()`; remove the `clock.onTick` listener
   if one was added.

Result: a smooth animated scene using the high-level Entity API at a safe
scale.

## Plan C : Minimal custom-UI globe

An embedded globe inside a React product with its own design system, no Cesium
widgets.

1. **Viewer class** : `CesiumWidget`. The product supplies all UI; no default
   widgets are wanted.
2. **Imagery** : a custom XYZ basemap via `UrlTemplateImageryProvider` to match
   the product style.
3. **Terrain** : `EllipsoidTerrainProvider`.
4. **Data representation** : a few hundred interactive markers as `Entity`
   objects.
5. **requestRenderMode** : `true`. The globe is static between user actions.
6. **Teardown** : ONE `CesiumWidget`, created once in a React effect, destroyed
   on unmount. React wiring via `cesium-impl-resium`. This avoids exhausting
   the browser 16-context WebGL budget across route changes.

Result: a minimal, embeddable globe with no widget overhead.

## How to Use a Plan

For each numbered item, open the governing skill named in
`references/methods.md` and request the verified code for that one decision.
The plan is the contract; the skills fill it in.
