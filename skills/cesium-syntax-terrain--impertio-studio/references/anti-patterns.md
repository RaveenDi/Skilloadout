# Terrain Anti-Patterns

Each entry: the broken code, the symptom, the root cause, and the fix. These
are the verified failure modes behind a flat globe, terrain that never loads,
and elevation that reads wrong, drawn from the CesiumJS reference and CesiumGS
GitHub issues.

## 1. Calling the terrain provider constructor directly

```javascript
// BROKEN: the constructor must not be called directly.
const provider = new Cesium.CesiumTerrainProvider({ url: "https://host/tiles" });
viewer.scene.terrainProvider = provider;
```

Symptom: the provider never streams tiles; the globe stays a smooth ellipsoid.

Root cause: since CesiumJS 1.104 `CesiumTerrainProvider` fetches layer metadata
asynchronously. The reference states plainly: "Do not call the constructor
directly." The `url` option and the old `readyPromise` were removed.

Fix: use the async factory.

```javascript
const provider = await Cesium.CesiumTerrainProvider.fromUrl("https://host/tiles");
viewer.scene.terrainProvider = provider;
```

## 2. Assigning the factory promise to terrainProvider

```javascript
// BROKEN: fromUrl returns a Promise, not a provider.
viewer.scene.terrainProvider = Cesium.CesiumTerrainProvider.fromUrl(url);
```

Symptom: the globe stays flat. The terrain provider is a pending `Promise`
object, which the renderer cannot use.

Root cause: every terrain factory resolves asynchronously. The
`scene.terrainProvider` setter expects a resolved `TerrainProvider`.

Fix: `await` the factory, or wrap the promise in a `Terrain` helper.

```javascript
// Option A: await
viewer.scene.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(url);

// Option B: Terrain wrapper, no await needed
viewer.scene.setTerrain(new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl(url)));
```

## 3. Cesium World Terrain without an ion token

```javascript
// BROKEN: no ion token set.
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
});
```

Symptom: the globe stays flat; the console shows 401 responses for terrain tile
requests.

Root cause: Cesium World Terrain is a Cesium ion asset. Without
`Ion.defaultAccessToken` the ion endpoint rejects every request.

Fix: set the token before constructing the `Viewer`.

```javascript
Cesium.Ion.defaultAccessToken = "<your-ion-token>";
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
});
```

## 4. Lighting enabled without vertex normals

```javascript
// BROKEN: lighting is on but the terrain was loaded without normals.
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(), // requestVertexNormals defaults false
});
viewer.scene.globe.enableLighting = true;
```

Symptom: the terrain looks dark and flat. Slopes are not shaded; mountains lack
relief under the sun.

Root cause: terrain lighting needs per-vertex normals, and
`requestVertexNormals` defaults to `false`. The server never sends the normal
data.

Fix: request normals when the globe uses lighting.

```javascript
terrain: Cesium.Terrain.fromWorldTerrain({ requestVertexNormals: true }),
```

## 5. Using the removed synchronous createWorldTerrain

```javascript
// BROKEN: the synchronous function was removed.
viewer.terrainProvider = Cesium.createWorldTerrain();
```

Symptom: `Cesium.createWorldTerrain is not a function`.

Root cause: the synchronous `createWorldTerrain` was replaced by
`createWorldTerrainAsync` during the 1.104 to 1.107 async migration.

Fix:

```javascript
viewer.scene.terrainProvider = await Cesium.createWorldTerrainAsync();
```

## 6. Sampling elevation before the provider resolves

```javascript
// BROKEN: sampling against a provider that has not finished loading.
const provider = Cesium.CesiumTerrainProvider.fromUrl(url); // a Promise
const positions = [Cesium.Cartographic.fromDegrees(86.925, 27.988)];
await Cesium.sampleTerrainMostDetailed(provider, positions); // wrong argument
```

Symptom: the call throws, or every sampled height comes back as the ellipsoid
height `0`.

Root cause: `sampleTerrainMostDetailed` needs a resolved `TerrainProvider` with
a valid `availability`. A pending promise is not a provider.

Fix: `await` the factory first.

```javascript
const provider = await Cesium.CesiumTerrainProvider.fromUrl(url);
const positions = [Cesium.Cartographic.fromDegrees(86.925, 27.988)];
const updated = await Cesium.sampleTerrainMostDetailed(provider, positions);
```

## 7. Markers drawing through mountains

```javascript
// RISKY: a billboard behind a hill still shows on top of it.
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(86.9, 27.9, 5000),
  billboard: { image: "/pin.png" },
});
```

Symptom: pins and labels behind terrain are visible through the mountain
instead of being hidden.

Root cause: by default the globe does not depth-test other primitives against
terrain, so billboards, labels, and polylines draw on top.

Fix: enable depth testing against terrain.

```javascript
viewer.scene.globe.depthTestAgainstTerrain = true;
```

## 8. Using the removed Globe.terrainExaggeration

```javascript
// BROKEN: this property no longer exists.
viewer.scene.globe.terrainExaggeration = 2.0;
```

Symptom: the assignment does nothing; relief is unchanged.

Root cause: terrain exaggeration moved from `Globe` to `Scene` in CesiumJS
1.113.

Fix:

```javascript
viewer.scene.verticalExaggeration = 2.0;
viewer.scene.verticalExaggerationRelativeHeight = 0.0;
```

## 9. A custom terrain URL without CORS headers

```javascript
// RISKY: fromUrl against a server with no Access-Control-Allow-Origin.
const provider = await Cesium.CesiumTerrainProvider.fromUrl(
  "https://other-domain/tiles",
);
```

Symptom: the globe stays flat and the console fills with opaque CORS errors;
`fromUrl` may reject.

Root cause: terrain tiles are fetched with cross-origin requests. A server that
does not send `Access-Control-Allow-Origin` blocks every tile. A `file://` URL
is treated as cross-origin too.

Fix: serve terrain from a server that returns the correct CORS headers, or host
the tiles on the same origin as the application. Do not load terrain from
`file://`.
