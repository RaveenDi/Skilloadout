# Atmosphere and Lighting : Anti-Patterns

> Each entry: symptom, root cause, prevention, recovery.
> Verified against cesium.com ref-doc and CesiumGS/cesium issues on 2026-05-20.

## 1. Tuning the wrong atmosphere object

Symptom: changing `atmosphereLightIntensity` or a coefficient has no effect on
the part of the scene you expected.

Root cause: `SkyAtmosphere` (the halo) and `Globe` (the ground haze) both
expose `atmosphereLightIntensity`, `atmosphereRayleighCoefficient`, and the rest
under identical names. The two objects are independent.

Prevention: ALWAYS set halo properties on `scene.skyAtmosphere` and ground-haze
properties on `scene.globe`. The defaults differ (`50.0` versus `10.0`), which
confirms they are separate.

Recovery: move the assignment to the correct object.

## 2. Sky atmosphere missing in 2D or Columbus view

Symptom: the blue halo disappears after a `morphTo2D` or in Columbus view.

Root cause: `SkyAtmosphere` renders ONLY in 3D scene mode and is faded out in
the other modes by design.

Prevention: expect no sky atmosphere outside 3D. For a colored backdrop in 2D,
set `scene.backgroundColor`.

Recovery: morph back to 3D with `scene.morphTo3D()`.

## 3. Globe is evenly lit with no night side

Symptom: the whole globe is bright; there is no day-night terminator.

Root cause: `Globe.enableLighting` defaults to `false`, so terrain is lit
uniformly regardless of sun position.

Prevention: ALWAYS set `viewer.scene.globe.enableLighting = true` to get
sun-based shading.

Recovery: set `enableLighting = true`; advance the clock to move the
terminator.

## 4. Sky is black when blue was expected

Symptom: the space behind the globe is solid black.

Root cause: `scene.skyAtmosphere.show` is `false`, the scene is not in 3D, or
`scene.backgroundColor` shows through because both the sky box and the
atmosphere are hidden.

Prevention: keep `scene.skyAtmosphere.show = true` and stay in 3D for a sky.

Recovery: set `skyAtmosphere.show = true`; confirm the `SceneMode` is `SCENE3D`.

## 5. DirectionalLight with a zero-length direction

Symptom: constructing a `DirectionalLight` throws `DeveloperError`,
"options.direction cannot be zero-length".

Root cause: `direction` is required and must be a non-zero `Cartesian3`.

Prevention: ALWAYS pass a real direction vector; normalize it first.

Recovery: supply a non-zero `direction`, for example
`Cartesian3.normalize(new Cartesian3(1, 0, -1), new Cartesian3())`.

## 6. Disabling fog slows distant terrain

Symptom: after `scene.fog.enabled = false`, far terrain loads more tiles and
the frame rate drops.

Root cause: `Fog` raises the screen-space error of distant tiles
(`screenSpaceErrorFactor`, default `2.0`), so disabling fog forces higher
detail far away.

Prevention: NEVER disable fog purely for clarity without measuring the tile
load. Lower `fog.density` instead to thin the haze while keeping the
detail-reduction benefit.

Recovery: re-enable `fog`, or tune `density` and `screenSpaceErrorFactor`.

## 7. Moving sun does not update with requestRenderMode

Symptom: with `requestRenderMode: true`, the sun, the terminator, and the
dynamic atmosphere stay frozen while the clock advances.

Root cause: in request-render mode a frame renders only on an explicit
`scene.requestRender()` call or when `maximumRenderTimeChange` is exceeded.
Clock advance alone does not trigger a render.

Prevention: set a finite `maximumRenderTimeChange`, or call
`scene.requestRender()` whenever the lighting must update.

Recovery: lower `maximumRenderTimeChange`, or leave `requestRenderMode` off for
animated lighting.
