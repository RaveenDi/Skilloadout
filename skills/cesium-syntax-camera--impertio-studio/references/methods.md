# Camera Syntax : Verified API Reference

All signatures, members, and defaults below are verified against the CesiumJS API
reference (https://cesium.com/learn/cesiumjs/ref-doc/) for CesiumJS 1.124+.

## Camera

Reached as `viewer.camera`, the same object as `viewer.scene.camera`.

### Placement methods

```
camera.setView({ destination, orientation, endTransform, convert })
```

Instant placement. No animation, no return value.

```
camera.flyTo({
  destination, orientation, duration, complete, cancel,
  endTransform, maximumHeight, pitchAdjustHeight, flyOverLongitude, easingFunction
})
```

Animated flight. Returns `void`. Completion is signalled by the `complete` callback,
NOT a Promise. `cancel` runs if the flight is interrupted.

```
camera.lookAt(target, offset)
camera.lookAtTransform(transform, offset)
```

`target` is a `Cartesian3`. `offset` is a `Cartesian3` or a `HeadingPitchRange`. Both
methods set `camera.transform` to a non-identity reference frame. Call
`lookAtTransform(Matrix4.IDENTITY)` to release the lock.

```
camera.flyToBoundingSphere(boundingSphere, options)
camera.viewBoundingSphere(boundingSphere, offset)
```

`flyToBoundingSphere` animates and uses a `complete` callback. `viewBoundingSphere` is
instant.

```
camera.flyHome(duration)
camera.cancelFlight()
camera.completeFlight()
camera.switchToPerspectiveFrustum()
camera.switchToOrthographicFrustum()
```

`cancelFlight` stops a flight without firing `complete`. `completeFlight` jumps to the
flight end and fires `complete`.

### Parameter rules

- `destination` accepts a `Cartesian3` or a `Rectangle`.
- `orientation` accepts a `HeadingPitchRoll`, or `{ direction, up }` unit vectors.
- `duration` is in seconds; the default is computed from the flight distance.

### Camera members

| Member | Type | Notes |
|--------|------|-------|
| `position` | `Cartesian3` | camera position in ECEF |
| `positionCartographic` | `Cartographic` | position as longitude, latitude, height |
| `direction` | `Cartesian3` | view direction unit vector |
| `up` | `Cartesian3` | up unit vector |
| `right` | `Cartesian3` | right unit vector |
| `heading` | `number` | heading in radians, read from current orientation |
| `pitch` | `number` | pitch in radians |
| `roll` | `number` | roll in radians |
| `frustum` | frustum object | the projection frustum |
| `transform` | `Matrix4` | reference frame; identity means free navigation |

## Viewer camera helpers

Distinct from `Camera`. These target entities and DO return Promises.

```
viewer.flyTo(target, options)   // Promise<boolean>
viewer.zoomTo(target, offset)   // Promise<boolean>
```

`target` is an `Entity`, an array of entities, an `EntityCollection`, a `DataSource`,
or a `Cesium3DTileset`. NEVER confuse `viewer.flyTo` with `camera.flyTo`.

## HeadingPitchRoll

```
new Cesium.HeadingPitchRoll(heading, pitch, roll)        // radians, each defaults 0.0
Cesium.HeadingPitchRoll.fromDegrees(heading, pitch, roll, result)
```

`heading`, `pitch`, and `roll` are stored in RADIANS. Documented semantics: heading is
rotation about the negative z axis (from north), pitch is rotation about the negative
y axis (negative looking down), roll is rotation about the positive x axis (the view
axis).

## HeadingPitchRange

```
new Cesium.HeadingPitchRange(heading, pitch, range)
```

Used as the `offset` for `lookAt`. `heading` and `pitch` are radians; `range` is the
distance from the target in meters.

## Frustum classes

| Class | Constructor | Primary members |
|-------|-------------|-----------------|
| `PerspectiveFrustum` | `new PerspectiveFrustum(options)` | `fov`, `fovy` (readonly), `aspectRatio`, `near` (1.0), `far` (500000000.0), `xOffset` (0.0), `yOffset` (0.0) |
| `OrthographicFrustum` | `new OrthographicFrustum(options)` | `width`, `near`, `far`, `aspectRatio` |
| `PerspectiveOffCenterFrustum` | `new PerspectiveOffCenterFrustum(options)` | `left`, `right`, `top`, `bottom`, `near`, `far` |

`fov` is the field of view in radians. Switch projection through the camera methods
`switchToPerspectiveFrustum` and `switchToOrthographicFrustum`.

## ScreenSpaceCameraController

Reached as `viewer.scene.screenSpaceCameraController`.

| Member | Default | Effect |
|--------|---------|--------|
| `enableInputs` | `true` | master toggle for all input |
| `enableTranslate` | `true` | panning in 2D and Columbus View |
| `enableZoom` | `true` | zoom input |
| `enableRotate` | `true` | globe rotation |
| `enableTilt` | `true` | tilt input |
| `enableLook` | `true` | free-look rotation |
| `enableCollisionDetection` | `true` | keeps the camera above terrain |
| `minimumZoomDistance` | `1.0` | closest zoom distance, meters |
| `maximumZoomDistance` | `Infinity` | farthest zoom distance, meters |
| `minimumCollisionTerrainHeight` | `15000.0` | height below which collision is tested |
| `inertiaSpin` | `0.9` | rotation inertia |
| `inertiaTranslate` | `0.9` | pan inertia |
| `inertiaZoom` | `0.8` | zoom inertia |
