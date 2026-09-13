# Anti-Patterns: glTF Model

Companion to `SKILL.md`. Each entry is a real failure verified against the
CesiumJS API reference and CesiumGS/cesium GitHub issues on 2026-05-20.

## A-1: Model.fromGltf or ModelExperimental

- **Symptom:** `Model.fromGltf is not a function`, or
  `ModelExperimental is not defined`, or an undefined import.
- **Root cause:** `Model.fromGltf` was the synchronous loader and
  `ModelExperimental` was the in-development renderer. Both were removed;
  `ModelExperimental` was merged into `Model`.
- **Fix:** ALWAYS load with `await Cesium.Model.fromGltfAsync(options)`. Use
  the `Model` class. See `cesium-core-versioning`.

## A-2: Model Loaded but Never Awaited

- **Symptom:** The model variable is `undefined`, or
  `scene.primitives.add(...)` receives a `Promise`.
- **Root cause:** `Model.fromGltfAsync` returns a `Promise`. The code used the
  promise as if it were the model.
- **Fix:** `await` the factory, or chain it correctly, before adding the
  resolved `Model` to `scene.primitives`. Wrap the `await` in `try / catch`.

## A-3: Model at the Center of the Earth

- **Symptom:** The model loads without error but is nowhere on screen. Zooming
  out far enough shows it at the Earth center.
- **Root cause:** No `modelMatrix` was supplied, so the model sits at
  `Matrix4.IDENTITY`, which is the geocentric origin.
- **Fix:** Supply a `modelMatrix` from
  `Transforms.eastNorthUpToFixedFrame(position)` or
  `Transforms.headingPitchRollToFixedFrame(position, hpr)`.

## A-4: Model on Its Side or Facing Wrong

- **Symptom:** The model renders but lies flat, stands sideways, or faces the
  wrong direction.
- **Root cause:** The asset was authored with a different up-axis or
  forward-axis than the glTF Y-up, Z-forward default that `Model` assumes.
- **Fix:** Set `upAxis` and `forwardAxis` to the asset's true axes, for
  example `upAxis: Axis.Z` for a Z-up CAD export. NEVER patch this by rotating
  `modelMatrix`; that hides the root cause.

## A-5: Animation Added but Frozen

- **Symptom:** `activeAnimations.add` was called, but the model does not move.
- **Root cause:** glTF animations advance with the simulation clock.
  `viewer.clock.shouldAnimate` defaults to `false`, so the clock is paused.
- **Fix:** Set `viewer.clock.shouldAnimate = true`, or pass
  `shouldAnimate: true` to the `Viewer` constructor.

## A-6: No Animation Added

- **Symptom:** A model with glTF animations sits in its bind pose and never
  animates.
- **Root cause:** A loaded `Model` plays nothing until an animation is added
  to `activeAnimations`.
- **Fix:** Call `model.activeAnimations.addAll(...)` for all animations, or
  `model.activeAnimations.add({ name })` for one.

## A-7: Articulation Stage Set Without applyArticulations

- **Symptom:** `setArticulationStage` was called but the model pose does not
  change.
- **Root cause:** `setArticulationStage` only records a value. The node
  matrices are not rebuilt until `applyArticulations` runs.
- **Fix:** Call `model.applyArticulations()` once after a batch of
  `setArticulationStage` calls.

## A-8: heightReference Without scene

- **Symptom:** The model does not clamp to terrain, or a `DeveloperError`
  about a missing scene is thrown.
- **Root cause:** A non-`NONE` `heightReference` needs the `scene` to sample
  surface height, and the `scene` option was omitted.
- **Fix:** Pass `scene: viewer.scene` whenever `heightReference` is
  `CLAMP_TO_GROUND`, `CLAMP_TO_TERRAIN`, `CLAMP_TO_3D_TILE`, or any
  relative-to-ground value.

## A-9: Confusing scale With minimumPixelSize

- **Symptom:** A model is the wrong size, or vanishes when the camera zooms
  out.
- **Root cause:** `scale` is a constant world-space multiplier;
  `minimumPixelSize` is a screen-space floor. Using one where the other is
  needed gives the wrong sizing behavior.
- **Fix:** Use `scale` for a fixed real-world size. Use `minimumPixelSize`
  with `maximumScale` to keep a distant model visible on screen.

## A-10: Using a Model After Removal

- **Symptom:** A method call on a model throws `DeveloperError: This object
  was destroyed`.
- **Root cause:** `scene.primitives.remove(model)` destroys the model by
  default. The object is then unusable.
- **Fix:** Load a fresh model with `Model.fromGltfAsync`. Do not keep using a
  removed model.

## A-11: Treating a Model as an Entity Graphics Object

- **Symptom:** Code mixes `Model.fromGltfAsync` with
  `viewer.entities.add({ model: ... })` and behavior is inconsistent.
- **Root cause:** The `Model` class is a primitive added to
  `scene.primitives`. The declarative `entity.model` graphics object is a
  different API on the Entity layer.
- **Fix:** Choose one path. Use this skill's `Model.fromGltfAsync` primitive
  path, or the Entity path documented in `cesium-syntax-entity`.
