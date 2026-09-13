# AEC Georeferencing : Examples

> CesiumJS 1.124+ unless noted. All snippets verified against cesium.com
> ref-doc on 2026-05-20. Each assumes a constructed `viewer`.

## Place a glTF model at a location

```js
const origin = Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 12.0);
const model = await Cesium.Model.fromGltfAsync({
  url: "/models/building.glb",
  modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(origin),
});
viewer.scene.primitives.add(model);
```

## Place and rotate a model

```js
const origin = Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 12.0);
// fromDegrees, not the radians-only constructor.
const hpr = Cesium.HeadingPitchRoll.fromDegrees(135.0, 0.0, 0.0);
const model = await Cesium.Model.fromGltfAsync({
  url: "/models/building.glb",
  modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(origin, hpr),
});
viewer.scene.primitives.add(model);
```

## Place a non-georeferenced tileset

```js
const tileset = await Cesium.Cesium3DTileset.fromUrl(
  "/tiles/plant/tileset.json"
);
tileset.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
  Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 0.0)
);
viewer.scene.primitives.add(tileset);
```

## Leave an ion-tiled tileset alone

```js
// A tileset tiled by ion from georeferenced data is already placed.
const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(123456);
// Do NOT assign modelMatrix; it stays Matrix4.IDENTITY.
viewer.scene.primitives.add(tileset);
```

## Re-place a tileset at a higher elevation

```js
// modelMatrix is mutable after load: rebuild the frame with a higher origin.
tileset.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
  Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 15.0)
);
```

## A custom non-ENU local frame

```js
// A model authored north-west-up instead of east-north-up.
const origin = Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 0.0);
const nwuToFixed = Cesium.Transforms.localFrameToFixedFrameGenerator(
  "north",
  "west"
);
const modelMatrix = nwuToFixed(origin);
```

## Compose a local correction onto the ENU frame

```js
// enuFrame * correction: apply a fixed local scale, then georeference.
const origin = Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 0.0);
const enuFrame = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
const correction = Cesium.Matrix4.fromTranslationRotationScale(
  new Cesium.TranslationRotationScale(
    Cesium.Cartesian3.ZERO,
    Cesium.Quaternion.IDENTITY,
    new Cesium.Cartesian3(0.3048, 0.3048, 0.3048) // feet to metres
  )
);
const modelMatrix = Cesium.Matrix4.multiply(
  enuFrame,
  correction,
  new Cesium.Matrix4()
);
```

## CAD-style edges (CesiumJS 1.142+)

```js
// EdgeDisplayMode requires CesiumJS 1.142 or newer.
const origin = Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 0.0);
const model = await Cesium.Model.fromGltfAsync({
  url: "/models/structure.glb",
  modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(origin),
});
model.edgeDisplayMode = Cesium.EdgeDisplayMode.SURFACES_AND_EDGES;
viewer.scene.primitives.add(model);
```
