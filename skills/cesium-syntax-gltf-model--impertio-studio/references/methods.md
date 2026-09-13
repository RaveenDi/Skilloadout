# Methods Reference: glTF Model

Companion to `SKILL.md`. All signatures, option names, and defaults verified
against the CesiumJS API reference (`cesium.com/learn/cesiumjs/ref-doc/`) on
2026-05-20.

## 1. Model.fromGltfAsync

```js
Cesium.Model.fromGltfAsync(options); // returns Promise<Model>
```

The promise resolves to a `Model` when it is ready to render. `Model` has no
public constructor for application code; `fromGltfAsync` is the only supported
path. `Model.fromGltf` and `ModelExperimental` no longer exist.

### Source and placement options

| Option | Type | Default |
|--------|------|---------|
| `url` | string or `Resource` | required |
| `basePath` | string or `Resource` | `''` |
| `modelMatrix` | `Matrix4` | `Matrix4.IDENTITY` |
| `scale` | number | `1.0` |
| `minimumPixelSize` | number | `0.0` |
| `maximumScale` | number | undefined |
| `upAxis` | `Axis` | `Axis.Y` |
| `forwardAxis` | `Axis` | `Axis.Z` |
| `heightReference` | `HeightReference` | `HeightReference.NONE` |
| `scene` | `Scene` | undefined (required when `heightReference` is not `NONE`) |

### Appearance options

| Option | Type | Default |
|--------|------|---------|
| `show` | boolean | `true` |
| `color` | `Color` | undefined |
| `colorBlendMode` | `ColorBlendMode` | `ColorBlendMode.HIGHLIGHT` |
| `colorBlendAmount` | number | `0.5` |
| `silhouetteColor` | `Color` | `Color.RED` |
| `silhouetteSize` | number | `0.0` |
| `customShader` | `CustomShader` | undefined |
| `lightColor` | `Cartesian3` | undefined |
| `imageBasedLighting` | `ImageBasedLighting` | undefined |
| `backFaceCulling` | boolean | `true` |
| `shadows` | `ShadowMode` | `ShadowMode.ENABLED` |

### Behavior and loading options

| Option | Type | Default |
|--------|------|---------|
| `id` | object | undefined |
| `allowPicking` | boolean | `true` |
| `incrementallyLoadTextures` | boolean | `true` |
| `asynchronous` | boolean | `true` |
| `clampAnimations` | boolean | `true` |
| `cull` | boolean | `true` |
| `releaseGltfJson` | boolean | `false` |
| `clippingPlanes` | `ClippingPlaneCollection` | undefined |
| `clippingPolygons` | `ClippingPolygonCollection` | undefined |
| `distanceDisplayCondition` | `DistanceDisplayCondition` | undefined |
| `gltfCallback` | function | undefined |
| `credit` | `Credit` or string | undefined |

## 2. Key Model Instance Properties

| Property | Type | Access | Meaning |
|----------|------|--------|---------|
| `activeAnimations` | `ModelAnimationCollection` | readonly | The currently playing glTF animations |
| `modelMatrix` | `Matrix4` | read and write | Transformation from model to world space |
| `ready` | boolean | readonly | `true` when the model is ready to render |
| `scale` | number | read and write | Uniform scale, default `1.0` |
| `color` | `Color` | read and write | Color blended with the rendered model |
| `show` | boolean | read and write | Whether the model renders |
| `customShader` | `CustomShader` | read and write | User-defined shader |
| `boundingSphere` | `BoundingSphere` | readonly | Model bounding sphere in world space |

Normal code does not read `ready`. Adding the model to `scene.primitives` is
enough; the render loop displays it once it is ready.

## 3. Articulation Methods

Articulations come from the glTF `AGI_articulations` extension.

```js
model.setArticulationStage(articulationStageKey, value);
```

Records a numeric value for one named articulation stage. Takes no visible
effect on its own.

```js
model.applyArticulations();
```

Writes every modified articulation stage into the node matrices of the
participating nodes. ALWAYS call this once after a batch of
`setArticulationStage` calls.

## 4. ModelAnimationCollection

`model.activeAnimations` is a `ModelAnimationCollection`.

| Method | Returns | Purpose |
|--------|---------|---------|
| `add(options)` | the added animation | Start one glTF animation |
| `addAll(options)` | array of added animations | Start every glTF animation in the model |
| `remove(runtimeAnimation)` | boolean | Stop and remove one animation |
| `removeAll()` | void | Stop and remove every animation |
| `contains(runtimeAnimation)` | boolean | Report membership |
| `get(index)` | animation | Animation at an index |

### add and addAll options

| Option | Type | Default |
|--------|------|---------|
| `name` | string | undefined (identifies the glTF animation; `add` only) |
| `index` | number | undefined (alternative to `name`; `add` only) |
| `loop` | `ModelAnimationLoop` | `ModelAnimationLoop.NONE` |
| `multiplier` | number | `1.0` |
| `reverse` | boolean | `false` |
| `delay` | number | `0.0` |
| `startTime` | `JulianDate` | undefined |
| `stopTime` | `JulianDate` | undefined |
| `removeOnStop` | boolean | `false` |
| `animationTime` | function | undefined |

`add` identifies the target animation by `name` or `index`. `addAll` applies
to every animation and accepts the same options minus `name` and `index`.

### ModelAnimationLoop

| Value | Effect |
|-------|--------|
| `ModelAnimationLoop.NONE` | Play the animation once |
| `ModelAnimationLoop.REPEAT` | Loop the animation continuously |

Additional loop modes are listed in the `ModelAnimationLoop` API reference.

## 5. The Clock and Animations

glTF animations advance with the simulation clock. They do not progress while
`viewer.clock.shouldAnimate` is `false`. Set `viewer.clock.shouldAnimate =
true`, or pass `shouldAnimate: true` to the `Viewer` constructor, before
expecting animation playback.

## 6. Teardown

A `Model` is a primitive owned by `scene.primitives`. Remove it with
`viewer.scene.primitives.remove(model)`, which destroys it by default. After
removal the model object is destroyed and NEVER reusable.
