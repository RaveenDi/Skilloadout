# Anti-Patterns : The 8 CesiumJS Rendering Errors

Each entry has a symptom, a root cause, a prevention, and a recovery. Issue
numbers refer to the `CesiumGS/cesium` GitHub issue tracker listed in
`SOURCES.md`. CesiumJS 1.124+ renders exclusively on WebGL2.

## E1 : Blank globe from an unset or wrong CESIUM_BASE_URL

**Symptom.** The canvas element exists, the page layout is correct, but the
globe never appears. The Console shows HTTP 404 for files under `Workers/`,
`Assets/`, and `Widgets/`, in both the dev server and the production build.

**Root cause.** CesiumJS loads Web Workers, baked assets, and widget CSS at
runtime from the URL in `window.CESIUM_BASE_URL`. When the global is unset or
points at the wrong directory, every one of those requests returns 404 and the
renderer has no workers to decode terrain and imagery.

**Prevention.** ALWAYS assign `window.CESIUM_BASE_URL` before the `cesium`
module is imported, OR let the bundler plugin define it. The value points at
the served directory that contains `Workers/`, `ThirdParty/`, `Assets/`, and
`Widgets/`.

**Recovery.** Set `window.CESIUM_BASE_URL` to the correct served path. Open the
Network tab and confirm one `Workers/` file resolves with HTTP 200. Verify the
assignment runs before the import; a late assignment is read after the asset
URLs are already fixed. Issue references: #11 class of base-URL faults,
vooronderzoek anti-pattern 12.

## E2 : Blank globe in the production build only

**Symptom.** The globe renders under the dev server, then the production build
shows a blank globe. The Console shows 404 for `Workers/` files and worker
load failures, only in the built output.

**Root cause.** The dev server resolves CesiumJS static files on the fly. The
production bundler does not copy `Workers/`, `ThirdParty/`, `Assets/`, and
`Widgets/` into the output directory unless a plugin is configured to do it.

**Prevention.** ALWAYS add the asset-copy plugin. For Vite, add
`vite-plugin-cesium`. For webpack, add `CopyWebpackPlugin` for the four
directories and `DefinePlugin` for `CESIUM_BASE_URL`. NEVER ship a build that
relies on dev-server behavior.

**Recovery.** Add the plugin, rebuild, and confirm the four directories exist
inside `dist/` (or the configured output). Verified plugin configuration is in
`examples.md` sections 4 and 5. Issue reference: vooronderzoek anti-pattern 13.

## E3 : Black globe and HTTP 401 from a missing or invalid ion token

**Symptom.** The globe is black or blank. The Network tab shows HTTP 401 from
`api.cesium.com` or `assets.cesium.com`. Cesium World Terrain, Cesium OSM
Buildings, and ion imagery never load.

**Root cause.** `Cesium.Ion.defaultAccessToken` is unset, expired, or lacks the
scope for the requested asset. Every ion-backed request is rejected with 401,
and the default `Viewer` base imagery is an ion asset.

**Prevention.** ALWAYS set `Cesium.Ion.defaultAccessToken` before constructing
a `Viewer` that uses any ion asset. For an application with no ion token, pass
`baseLayer: false` to the `Viewer` constructor and supply a non-ion imagery
provider. NEVER ship a Sandcastle demo token; demo tokens rotate and then
return 401.

**Recovery.** Set a valid account token from `cesium.com/ion`, or remove the
ion dependency by passing `baseLayer: false` plus a non-ion provider and by
not requesting World Terrain. Issue references: #8590, #4012; vooronderzoek
anti-pattern 1.

## E4 : WebGL context lost, CONTEXT_LOST_WEBGL

**Symptom.** The globe rendered correctly, then freezes or turns black
mid-session. The Console reports `WebGL: CONTEXT_LOST_WEBGL`. It appears most
on memory-constrained mobile devices after sustained 3D Tiles interaction, or
after the tab is backgrounded.

**Root cause.** The GPU or driver reclaimed the WebGL context (GPU
out-of-memory, a driver reset, or a backgrounded tab). CesiumJS does not
rebuild its GPU resources automatically, and the default uncaught path throws
ungracefully instead of recovering.

**Prevention.** ALWAYS attach a `webglcontextlost` listener to
`viewer.scene.canvas` and call `event.preventDefault()` inside it, so the
browser keeps the canvas restorable. Lower GPU pressure to prevent the loss:
reduce `resolutionScale`, raise tileset `maximumScreenSpaceError`, lower
tileset `cacheBytes`.

**Recovery.** On `webglcontextrestored`, call `viewer.destroy()` on the dead
viewer and construct a fresh `Viewer`. Recovery is recreation; CesiumJS cannot
repair a lost context in place. Verified handler in `examples.md` section 3.
Issue references: #10017, #5991; vooronderzoek anti-pattern 3.

## E5 : Too many active WebGL contexts, 16-context budget exhausted

**Symptom.** After navigating between pages or components that each build a
`Viewer`, the globe stops appearing. The Console reports `Too many active
WebGL contexts. Oldest context will be lost.`

**Root cause.** Each `Viewer` creates a WebGL context. A browser tab caps live
contexts near 16. `viewer.destroy()` does not always release the context
immediately, so a single-page app that mounts a new `Viewer` per route
exhausts the budget.

**Prevention.** ALWAYS call `viewer.destroy()` when a `Viewer` leaves the page.
NEVER create a `Viewer` per route or per component without destroying the
previous one. Reuse one shared `Viewer` instance across views where the
application allows it.

**Recovery.** Destroy every stray `Viewer`, then reuse a single instance.
Verified single-viewer pattern in `examples.md` section 8. Teardown ordering
for tilesets and data sources is detailed in `cesium-errors-memory`. Issue
reference: #11533; vooronderzoek anti-pattern 2.

## E6 : Exception inside Scene.render, the error panel

**Symptom.** An "An error occurred while rendering" panel covers the canvas, or
an exception is thrown from inside `render`. The globe stops updating.

**Root cause.** An exception was thrown inside `Scene.render`: a primitive with
a `NaN` position or a `NaN` model matrix, a shader that failed to compile, or
corrupt tile content. CesiumJS catches the exception to raise the `renderError`
event; the `showRenderLoopErrors` option drives the visible panel.

**Prevention.** Validate positions and matrices before adding a primitive; a
`NaN` coordinate is the most common trigger (see `cesium-errors-coordinates`).
ALWAYS subscribe to `scene.renderError` so the exception is logged rather than
producing a silent frozen frame.

**Recovery.** Read the error from the `scene.renderError` listener, identify
the offending primitive, and remove or fix it. Set `rethrowRenderErrors = true`
to forward the error to an external error boundary. Set
`showRenderLoopErrors: false` to suppress the panel once a code handler is in
place. Verified handler in `examples.md` section 2.

## E7 : No imagery, the globe is a flat solid color

**Symptom.** The globe geometry renders and the camera moves, but the surface
is a single flat color with no map tiles. There is no HTTP 4xx for asset
files.

**Root cause.** No imagery layer is producing tiles. Either `baseLayer: false`
was passed with no replacement provider, or the imagery provider's `errorEvent`
fired because of a bad URL, a CORS rejection, or HTTP 401 or 403.

**Prevention.** Supply a valid imagery layer. ALWAYS subscribe to the layer's
`errorEvent`, which passes a `TileProviderError`, so a tile-fetch failure is
visible instead of a silent blank surface.

**Recovery.** Attach a working layer through `viewer.imageryLayers.add(...)`.
Use `ImageryLayer.fromWorldImagery({})` for ion base imagery, or
`ImageryLayer.fromProviderAsync(...)` for a non-ion provider. Verified fallback
code in `examples.md` section 6. For provider-specific CORS and token faults,
see `cesium-errors-tileset`.

## E8 : No terrain, the globe surface is a smooth ellipsoid

**Symptom.** The globe renders with imagery, but mountains are flat and there
is no elevation relief. There is no HTTP 4xx for asset files.

**Root cause.** No terrain provider is set, so the globe uses the flat
`EllipsoidTerrainProvider` default. Or a terrain async factory rejected because
of a missing token or a wrong URL, leaving the flat fallback in place.

**Prevention.** Pass a `terrain` object to the `Viewer` constructor, such as
`terrain: Cesium.Terrain.fromWorldTerrain()`. ALWAYS subscribe to
`Terrain.errorEvent` so a failed terrain load is reported.

**Recovery.** Construct the `Viewer` with the `terrain` option, or load
`createWorldTerrainAsync()` inside `try/catch` and assign the result. Cesium
World Terrain requires a valid ion token; a 401 here is the E3 root cause.
Verified terrain code in `examples.md` section 7. Provider depth is owned by
`cesium-syntax-terrain`.

## Known non-errors

A single black frame for one render cycle directly after a large point cloud
or 3D Tileset finishes loading is expected behavior, not a rendering failure.
The frame clears on the next render. NEVER add a context-loss handler or a
viewer rebuild in response to a one-frame flash. Issue reference: #13055.
