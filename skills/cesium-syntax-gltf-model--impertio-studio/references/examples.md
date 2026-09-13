# Examples: glTF Model

Companion to `SKILL.md`. Every snippet runs on CesiumJS 1.124+ and uses the
async factory `Model.fromGltfAsync`. No WebGPU path exists; CesiumJS is
WebGL2 only.

## 1. Load and Place a Model

```js
try {
  const model = await Cesium.Model.fromGltfAsync({
    url: "./models/aircraft.glb",
    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(4.9, 52.37, 150.0),
    ),
  });
  viewer.scene.primitives.add(model);
} catch (error) {
  console.error("Model failed to load:", error);
}
```

## 2. Place With Heading, Pitch, and Roll

```js
const position = Cesium.Cartesian3.fromDegrees(4.9, 52.37, 150.0);
const hpr = new Cesium.HeadingPitchRoll(
  Cesium.Math.toRadians(135.0),
  Cesium.Math.toRadians(0.0),
  Cesium.Math.toRadians(0.0),
);

const model = await Cesium.Model.fromGltfAsync({
  url: "./models/aircraft.glb",
  modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(position, hpr),
});
viewer.scene.primitives.add(model);
```

## 3. Move a Model After Load

```js
function moveModel(model, lon, lat, height) {
  model.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(lon, lat, height),
  );
}
```

`modelMatrix` is read and write. Reassign it to reposition the model.

## 4. Correct a Z-Up Asset

A model authored Z-up in a CAD tool loads on its side under the default
Y-up assumption. Set the axes to the asset's true orientation.

```js
const model = await Cesium.Model.fromGltfAsync({
  url: "./models/factory.glb",
  modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(4.9, 52.37, 0.0),
  ),
  upAxis: Cesium.Axis.Z,
  forwardAxis: Cesium.Axis.X,
});
viewer.scene.primitives.add(model);
```

## 5. Keep a Distant Model Visible

```js
const model = await Cesium.Model.fromGltfAsync({
  url: "./models/marker.glb",
  modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(4.9, 52.37, 100.0),
  ),
  minimumPixelSize: 64,
  maximumScale: 20000,
});
viewer.scene.primitives.add(model);
```

`minimumPixelSize` keeps the model at least 64 pixels wide on screen.
`maximumScale` caps how large that rule lets it grow.

## 6. Play All Animations

```js
const viewer = new Cesium.Viewer("cesiumContainer", {
  shouldAnimate: true, // required, or animations stay frozen
});

const model = await Cesium.Model.fromGltfAsync({
  url: "./models/walking-figure.glb",
  modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(4.9, 52.37, 0.0),
  ),
});
viewer.scene.primitives.add(model);

model.activeAnimations.addAll({
  loop: Cesium.ModelAnimationLoop.REPEAT,
});
```

## 7. Play One Animation by Name at Double Speed

```js
model.activeAnimations.add({
  name: "Rotor",
  loop: Cesium.ModelAnimationLoop.REPEAT,
  multiplier: 2.0,
});
```

If the clock is paused, enable it so the animation advances.

```js
viewer.clock.shouldAnimate = true;
```

## 8. Drive an Articulation

```js
// Aim a turret defined by the glTF AGI_articulations extension.
model.setArticulationStage("Turret Yaw", 60.0);
model.setArticulationStage("Barrel Pitch", -15.0);

// Apply once after all stage values are set.
model.applyArticulations();
```

## 9. Highlight a Model With Color

```js
const model = await Cesium.Model.fromGltfAsync({
  url: "./models/aircraft.glb",
  modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(4.9, 52.37, 150.0),
  ),
  color: Cesium.Color.RED.withAlpha(0.6),
  colorBlendMode: Cesium.ColorBlendMode.MIX,
  colorBlendAmount: 0.7,
  silhouetteColor: Cesium.Color.YELLOW,
  silhouetteSize: 2.0,
});
viewer.scene.primitives.add(model);
```

## 10. Clamp a Model to Terrain

```js
const model = await Cesium.Model.fromGltfAsync({
  url: "./models/tree.glb",
  modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(6.87, 45.83),
  ),
  heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
  scene: viewer.scene,
});
viewer.scene.primitives.add(model);
```

The `scene` option is required whenever `heightReference` is not `NONE`.

## 11. Remove a Model

```js
function removeModel(viewer, model) {
  if (viewer.scene.primitives.contains(model)) {
    viewer.scene.primitives.remove(model);
  }
}
```

`remove` destroys the model by default. The removed object is destroyed and
NEVER reusable; load a fresh model if needed again.
