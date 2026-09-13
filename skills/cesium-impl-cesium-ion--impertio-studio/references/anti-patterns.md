# Cesium ion : Anti-Patterns

> Each entry: symptom, root cause, prevention, recovery.
> Verified against cesium.com docs and CesiumGS/cesium issues on 2026-05-20.

## 1. Missing ion token blanks the globe

Symptom: the globe is blank or black; the console shows 401 responses for
World Terrain, imagery, or an ion asset.

Root cause: `Ion.defaultAccessToken` was never set, so every ion request is
unauthenticated.

Prevention: ALWAYS set `Cesium.Ion.defaultAccessToken` before constructing a
`Viewer` that loads any ion asset, including the Cesium-hosted base layers.

Recovery: set the token, then reload; assets re-request on the next frame.

## 2. Token set too late

Symptom: the first asset fails with 401 even though the token is set somewhere
in the code.

Root cause: the `Viewer` constructor and the base-layer load fire ion requests
immediately. A token assigned after that point misses those requests.

Prevention: ALWAYS set `Ion.defaultAccessToken` BEFORE `new Cesium.Viewer(...)`.

Recovery: move the token assignment above the `Viewer` construction.

## 3. Write-scoped token leaked to the browser

Symptom: a security review finds an ion token in client JavaScript that can
modify the ion account.

Root cause: the default account token, or a token with `assets:write` or
`tokens:write` scope, was embedded in browser code shipped to every visitor.

Prevention: ALWAYS create a dedicated token with only `assets:read` (and
`geocode` if needed), scoped to the specific asset ids the app loads. NEVER
ship a write-capable token to the browser.

Recovery: revoke the leaked token in the ion dashboard, issue a restricted
token, and redeploy.

## 4. Sandcastle demo token in production

Symptom: an app works in development but throttles or fails for real users.

Root cause: the Sandcastle demo token was copied into the app. It is shared,
rate-limited, and not tied to your account or assets.

Prevention: ALWAYS use a token from your own ion account.

Recovery: replace the demo token with an account token.

## 5. Calling the IonResource constructor directly

Symptom: `new Cesium.IonResource(...)` yields an object that does not resolve
to a usable asset.

Root cause: `IonResource` is documented as not directly instantiable; it needs
the async `fromAssetId` factory to fetch the asset endpoint and token.

Prevention: ALWAYS create ion resources with `IonResource.fromAssetId(id)`, or
use the type-specific `fromIonAssetId` shortcut.

Recovery: replace the constructor call with the factory.

## 6. Valid token, asset still 401 or 403

Symptom: the token works for some assets but a specific asset returns 401 or
403.

Root cause: ion tokens carry an asset allow-list. A token that omits the
requested asset is rejected for it even though the token itself is valid.

Prevention: ALWAYS add every asset id the app loads to the token's allow-list,
or scope the token to all assets when that is appropriate.

Recovery: edit the token in the ion dashboard to include the asset id.

## 7. Self-hosted tiles never load

Symptom: a tileset moved off ion to a static CDN never appears; the console
shows CORS errors.

Root cause: the tile host does not send `Access-Control-Allow-Origin`, so the
browser blocks the cross-origin tile requests.

Prevention: ALWAYS configure CORS on the host serving self-hosted 3D Tiles or
terrain.

Recovery: enable CORS on the CDN or origin server, then reload.
