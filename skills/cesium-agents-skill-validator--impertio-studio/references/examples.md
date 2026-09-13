# Validator Worked Examples

Three CesiumJS snippets run through the checklist: one rejected and rewritten,
one warned, one accepted. Target version 1.124+.

## Example 1 : REJECT, then rewrite

Input snippet:

```js
const tileset = new Cesium.Cesium3DTileset({
  url: Cesium.IonResource.fromAssetId(69380),
});
viewer.scene.primitives.add(tileset);
tileset.readyPromise.then(() => viewer.zoomTo(tileset));
```

Validation:

- Check 1 : `new Cesium3DTileset(` matches. Removed 1.107. BLOCKER.
- Check 1 : `.readyPromise` matches. Removed 1.107. BLOCKER.
- Check 4 : not reached; the construction itself is invalid.

Verdict : REJECT. Two Check 1 blockers. Fix skill : `cesium-syntax-3d-tiles`,
`cesium-core-versioning`.

Rewritten:

```js
const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(69380);
viewer.scene.primitives.add(tileset);
await viewer.zoomTo(tileset);
```

Re-validation : Check 1 clear, Check 4 clear (the factory is awaited). If
`Ion.defaultAccessToken` is set elsewhere, Check 3 clear. ACCEPT.

## Example 2 : ACCEPT with a warning

Input snippet:

```js
const viewer = new Cesium.Viewer("cesiumContainer");
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(4.9041, 52.3676),
  point: { pixelSize: 10, color: Cesium.Color.RED },
});
```

Validation:

- Check 1, 2, 4, 6, 7 : clear. `Cartesian3.fromDegrees` is current, correctly
  ordered, and not called with `new`.
- Check 3 : no ion asset used; not applicable.
- Check 5 : `new Cesium.Viewer` with no `viewer.destroy()` anywhere. WARN.
- Check 8 : a static scene constructed without `requestRenderMode: true`. WARN.

Verdict : ACCEPT with two warnings. State to the user: add `viewer.destroy()`
on the cleanup path (`cesium-core-memory`); consider `requestRenderMode: true`
for this static scene (`cesium-core-performance`).

## Example 3 : REJECT on a coordinate defect

Input snippet:

```js
const carto = new Cesium.Cartographic(4.9041, 52.3676);
viewer.entities.add({
  position: carto,
  billboard: { image: "/pin.png" },
});
```

Validation:

- Check 6 : `new Cartographic(` with `4.9` and `52.3` (degree magnitudes) read
  as radians. BLOCKER.
- Check 6 : a `Cartographic` assigned to `position`, which requires a
  `Cartesian3`. BLOCKER.

Verdict : REJECT. Fix skill : `cesium-errors-coordinates`.

Rewritten:

```js
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(4.9041, 52.3676),
  billboard: { image: "/pin.png" },
});
```

Re-validation : Check 6 clear. ACCEPT.

## Example 4 : Hallucinated API caught by Check 7

Input snippet:

```js
const tileset = await Cesium.Cesium3DTileset.fromGeoJsonAsync("/city.geojson");
```

Validation:

- Check 1, 4 : the call looks like a modern awaited factory, so the fast checks
  pass.
- Check 7 : WebFetch `Cesium3DTileset` on the API reference. There is no
  `fromGeoJsonAsync` factory. The name is hallucinated. BLOCKER.

Verdict : REJECT. A `Cesium3DTileset` loads `tileset.json`, not GeoJSON.
GeoJSON loads through `GeoJsonDataSource` (`cesium-syntax-datasources`). Check 7
is the reason every API name must be verified, not only pattern-matched.
