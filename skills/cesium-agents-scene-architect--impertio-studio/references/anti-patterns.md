# Scene Architecture Anti-Patterns

Each entry lists symptom, root cause, prevention, and recovery. These are the
recurring structural mistakes the six-decision path exists to prevent.

## 1. Tens of thousands of Entity objects

**Symptom:** The app stutters, frame rate collapses, and with very large counts
the tab runs out of memory.

**Root cause:** The Entity API is retained-mode and visualized by a per-tick
loop over every entity. It is built for interactive, time-dynamic data at
modest scale, not for bulk static geometry.

**Prevention:** Apply Decision 4. Above roughly 10000 features use batched
`Primitive` plus `GeometryInstance`, or stream the dataset as a
`Cesium3DTileset`.

**Recovery:** Re-represent the dataset. Convert the entities to batched
primitives, or tile the source data into 3D Tiles.

## 2. Streaming a city as individual models

**Symptom:** Network requests explode, memory climbs, and the scene never
fully loads.

**Root cause:** A large urban or photogrammetry dataset was added as many
separate `Model` or `Entity` objects instead of one streamed tileset. Nothing
performs level-of-detail or culling across them.

**Prevention:** Apply Decision 4. Cities, point clouds, and photogrammetry are
`Cesium3DTileset` work; the tileset format handles streaming and
level-of-detail.

**Recovery:** Tile the source data to 3D Tiles and load it with
`Cesium3DTileset.fromUrl` or `fromIonAssetId`.

## 3. Continuous rendering on a static scene

**Symptom:** The app drains battery and keeps the GPU busy even when nothing
moves on screen.

**Root cause:** Decision 5 was skipped. CesiumJS renders every animation frame
by default, including on a scene that only changes on user action.

**Prevention:** Enable `requestRenderMode: true` for any static or
rarely-changing scene, and call `scene.requestRender()` after a manual change
Cesium cannot detect.

**Recovery:** Set `requestRenderMode` in the viewer options; audit manual
mutations and add `scene.requestRender()` calls.

## 4. No ion token, blank globe

**Symptom:** The globe is blank or black. The network tab shows `401` on ion
requests.

**Root cause:** An ion asset (world imagery, world terrain, an ion tileset)
was used without setting `Ion.defaultAccessToken` first.

**Prevention:** Decision 1 precondition: set `Ion.defaultAccessToken` before
constructing anything that touches an ion asset.

**Recovery:** Set a valid ion token. If no ion asset is actually needed, switch
to non-ion providers such as `OpenStreetMapImageryProvider`.

## 5. One viewer per route in a single-page app

**Symptom:** Memory grows on every navigation; eventually the console warns
`Too many active WebGL contexts`.

**Root cause:** Decision 6 was skipped. Each route or component mount built a
new `Viewer`, each holding a WebGL context, while old ones were not destroyed.
The browser allows only about 16 contexts.

**Prevention:** Plan ONE long-lived viewer. In React hold it in a `useRef` and
create it once; destroy it only on final unmount.

**Recovery:** Consolidate to a single viewer instance; destroy every stray
viewer. See `cesium-errors-memory`.

## 6. Choosing the API tier before knowing the dataset

**Symptom:** The codebase mixes Entity, Primitive, and tileset code without a
rule, and some datasets are in the wrong tier.

**Root cause:** Decision 4 was made once, globally, instead of per dataset.
Representation is a property of each dataset, not of the app.

**Prevention:** Run Decision 4 separately for every dataset the scene loads.

**Recovery:** List each dataset, re-run Decision 4 for it, and migrate the ones
in the wrong tier.

## 7. Ground-bound data placed without a clamping plan

**Symptom:** With terrain enabled, markers float in the air or sink into
hillsides.

**Root cause:** Terrain was enabled in Decision 3 but no ground-clamping plan
was made for the datasets that must sit on the surface.

**Prevention:** When Decision 3 selects real terrain, decide per dataset
whether it clamps (`heightReference`, GeoJSON `clampToGround`) or carries true
heights. See `cesium-errors-coordinates`.

**Recovery:** Add `heightReference` or `clampToGround`, or supply sampled
terrain heights.

## 8. Building Viewer when no widgets are used

**Symptom:** A minimal embedded globe ships more code than needed and the
default toolbar must be hidden with many boolean options.

**Root cause:** `Viewer` was chosen by habit even though the app supplies its
own UI and uses no default widget.

**Prevention:** Decision 1: when no default widget is used, choose
`CesiumWidget` directly. It is the foundational renderer without the widget
layer.

**Recovery:** Replace the `Viewer` with a `CesiumWidget`; move any needed
behavior onto the widget's `scene`, `camera`, and `clock`.
