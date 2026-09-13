# Imagery Syntax : Anti-Patterns

Each entry lists the symptom, the root cause, the prevention, and the recovery. All
failure modes are verified against the CesiumJS API reference and the CesiumGS/cesium
issue tracker.

## 1. Calling new on an async provider

Symptom: `new Cesium.BingMapsImageryProvider(...)` or `new
Cesium.IonImageryProvider(...)` yields a provider that never serves tiles, or throws.

Root cause: `BingMapsImageryProvider`, `IonImageryProvider`,
`ArcGisMapServerImageryProvider`, `TileMapServiceImageryProvider`, and
`SingleTileImageryProvider` fetch server metadata. Their direct constructors are
documented as not-to-be-called.

Prevention: ALWAYS create these through the async factory: `fromUrl`, `fromAssetId`,
or `fromBasemapType`.

Recovery: Replace the `new` call with the matching factory and `await` it, or wrap it
with `ImageryLayer.fromProviderAsync`.

## 2. Using readyPromise or a ready poll loop

Symptom: Code reads `provider.readyPromise` and gets `undefined`, or loops on
`provider.ready` and never proceeds.

Root cause: `readyPromise` was removed in CesiumJS 1.107. The async-factory promise
resolving IS the readiness signal.

Prevention: ALWAYS `await` the factory promise, or pass it to
`ImageryLayer.fromProviderAsync`. NEVER reference `readyPromise`.

Recovery: Delete the `readyPromise` and poll code. Use the resolved factory promise.

## 3. Passing a provider Promise to new ImageryLayer

Symptom: A layer is added but never draws any tiles.

Root cause: `new Cesium.ImageryLayer(provider)` expects a resolved provider INSTANCE.
A Promise passed in is not a provider, so the layer has no tile source.

Prevention: ALWAYS use `ImageryLayer.fromProviderAsync(providerPromise)` for an async
provider, or `await` the provider first and then call `new ImageryLayer(provider)`.

Recovery: Switch to `fromProviderAsync`, or add an `await` before the constructor.

## 4. Imagery tiles return 401 or 403

Symptom: The globe shows no imagery; the network panel shows 401 or 403 on tile
requests.

Root cause: A required access token is missing or invalid. ion imagery needs
`Cesium.Ion.defaultAccessToken`; ArcGIS image tile services need an ArcGIS access
token; Bing Maps needs a key.

Prevention: ALWAYS set `Cesium.Ion.defaultAccessToken` before constructing a `Viewer`
that uses ion imagery. ALWAYS pass the ArcGIS token and the Bing key to their
factories.

Recovery: Set the missing token. Confirm the token has not expired and covers the
asset.

## 5. Layer hidden behind another layer

Symptom: An overlay layer was added but the layer beneath it still covers the view.

Root cause: `viewer.imageryLayers` is ordered with index `0` as the BOTTOM layer. A
layer added below an opaque layer is hidden.

Prevention: ALWAYS treat index `0` as the bottom. ALWAYS call `raiseToTop` on an
overlay that must be visible above the basemap.

Recovery: Call `viewer.imageryLayers.raiseToTop(overlay)`, or lower the `alpha` of the
layer that is covering it.

## 6. Expecting a MapTiler provider class

Symptom: `Cesium.MapTilerImageryProvider` is `undefined`.

Root cause: CesiumJS has no dedicated MapTiler class. MapTiler is an XYZ or WMTS tile
source.

Prevention: ALWAYS consume MapTiler through `UrlTemplateImageryProvider` with the XYZ
tile URL, or `WebMapTileServiceImageryProvider` for a WMTS endpoint.

Recovery: Replace the imagined class with `UrlTemplateImageryProvider`.

## 7. Custom tile server blocked by CORS

Symptom: Tiles fail to load from a custom server; the console shows a cross-origin
error.

Root cause: WebGL imagery requires the tile server to send permissive CORS headers.
A server without `Access-Control-Allow-Origin` blocks the tiles.

Prevention: ALWAYS serve custom tiles from an endpoint that returns
`Access-Control-Allow-Origin`. NEVER load tiles over `file://`; the browser treats it
as cross-origin.

Recovery: Add CORS headers to the tile server, or proxy the tiles through a same-origin
endpoint.

## 8. removeAll destroys layers still in use

Symptom: After `imageryLayers.removeAll()`, a layer reference held elsewhere throws on
use.

Root cause: `remove` and `removeAll` default the `destroy` argument to `true`, which
frees the layer resources.

Prevention: ALWAYS pass `false` as the `destroy` argument when a removed layer will be
re-added later.

Recovery: Recreate the destroyed layer from its provider. Pass `destroy` as `false` on
future removals of layers that are retained.
