---
name: cesium-syntax-camera
description: >
  Use when positioning, flying, or constraining the CesiumJS camera, and a view
  refuses to update, the camera will not rotate, the camera ends up underground, or
  flight completion fires at the wrong time. Prevents the awaited-flyTo mistake
  (Camera.flyTo returns void, not a Promise), the stuck-camera bug after lookAt leaves
  a reference-frame lock in place, the degrees-versus-radians orientation error, and
  the camera-clips-through-terrain problem. Covers setView, flyTo, lookAt,
  lookAtTransform, flyToBoundingSphere, viewBoundingSphere, HeadingPitchRoll
  orientation, frustum types, and ScreenSpaceCameraController constraints.
  Keywords: CesiumJS camera, setView, flyTo, lookAt, lookAtTransform,
  flyToBoundingSphere, viewBoundingSphere, HeadingPitchRoll, heading pitch roll,
  endTransform, frustum, PerspectiveFrustum, OrthographicFrustum,
  ScreenSpaceCameraController, minimumZoomDistance, enableCollisionDetection,
  camera stuck, camera will not rotate, camera underground, wrong view, view does not
  update, flyTo does nothing, camera frozen, how do I move the camera, how do I fly to
  a location.
license: MIT
compatibility: "Designed for Claude Code. Requires CesiumJS 1.124+."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# CesiumJS Camera Syntax

## Overview

The camera is reached as `viewer.camera`, which is the same object as
`viewer.scene.camera`. CesiumJS offers two placement styles: instant placement
(`setView`, `lookAt`, `viewBoundingSphere`) and animated flight (`flyTo`,
`flyToBoundingSphere`).

Core principle: `Camera.flyTo` is animated and returns `void`. It signals completion
through a `complete` callback, NEVER through a Promise. Code that `await`s
`camera.flyTo` resolves immediately and reads the camera before it has arrived.

This skill is technology-specific: CesiumJS 1.124+, WebGL2 only.

## When to Use This Skill

- Placing the camera at a location with a specific heading, pitch, and roll.
- Animating a flight and running code when the flight finishes.
- The camera will not rotate or pan after a `lookAt` call.
- The camera clips below terrain or zooms underground.
- A view read right after `flyTo` returns the old position.
- An orientation looks wrong because degrees were passed where radians are expected.
- Constraining or disabling user camera input.

## Quick Reference

| Method | Style | Placement input |
|--------|-------|-----------------|
| `setView` | instant | `destination` + `orientation` |
| `flyTo` | animated | `destination` + `orientation`, `complete` callback |
| `lookAt` | instant | `target` + `offset`, sets a reference-frame lock |
| `lookAtTransform` | instant | `transform` + `offset`, sets a reference-frame lock |
| `flyToBoundingSphere` | animated | a `BoundingSphere`, `complete` callback |
| `viewBoundingSphere` | instant | a `BoundingSphere` + `offset` |
| `flyHome` | animated | default home view |

## destination and orientation

`setView` and `flyTo` both take a `destination` and an `orientation`.

- `destination` accepts a `Cartesian3` (an ECEF point) or a `Rectangle` (a geographic
  extent the view will frame).
- `orientation` accepts a `HeadingPitchRoll`, or an object with `direction` and `up`
  unit vectors.

ALWAYS build a point destination with `Cartesian3.fromDegrees(lon, lat, height)`.
NEVER pass a `Cartographic` as `destination`; the methods expect a `Cartesian3`.

```js
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 4000),
  orientation: {
    heading: Cesium.Math.toRadians(20),
    pitch: Cesium.Math.toRadians(-35),
    roll: 0,
  },
});
```

## Instant placement with setView

`setView({ destination, orientation, endTransform })` places the camera with no
animation. ALWAYS use `setView` when the final view is needed on the same frame, for
example before a screenshot or a deterministic test.

## Animated flight with flyTo

`Camera.flyTo({ destination, orientation, duration, complete, cancel, ... })` animates
the camera. It returns `void`.

ALWAYS run post-arrival code from the `complete` callback. NEVER `await`
`camera.flyTo`; it is not a Promise and the `await` resolves before the flight ends.

```js
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 4000),
  duration: 3,
  complete: function () {
    // runs once the flight has finished; camera state is now final
  },
  cancel: function () {
    // runs if the flight is interrupted
  },
});
```

Interrupt a flight with `camera.cancelFlight()`, or jump straight to its end with
`camera.completeFlight()` (this fires the `complete` callback).

A separate API exists on the viewer: `viewer.flyTo(target, options)` and
`viewer.zoomTo(target, options)` take an entity, an array of entities, or a data
source, and these DO return `Promise<boolean>`. NEVER confuse `viewer.flyTo` (entity
target, Promise) with `camera.flyTo` (coordinate target, callback).

## lookAt and the endTransform reference-frame lock

`lookAt(target, offset)` and `lookAtTransform(transform, offset)` point the camera at a
target. They set `camera.transform` to a non-identity reference frame. While that
transform is in place, the camera is LOCKED to the frame: `ScreenSpaceCameraController`
rotation and pan operate inside the frame, and free global navigation is unavailable.

ALWAYS release the lock before free navigation by calling `lookAtTransform` with the
identity matrix:

```js
// Lock the camera onto a target.
viewer.camera.lookAt(
  centerCartesian3,
  new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 1500)
);

// Release the lock so the user can navigate freely again.
viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
```

A camera that "will not rotate" or feels "stuck" after a `lookAt` almost always still
holds the reference-frame lock. `setView` and `flyTo` with an identity `endTransform`
also release it.

## Framing a target

- `flyToBoundingSphere(boundingSphere, options)` animates the camera until the sphere
  fills the view. It also uses a `complete` callback, not a Promise.
- `viewBoundingSphere(boundingSphere, offset)` does the same instantly.

ALWAYS frame a loaded tileset or model with its `boundingSphere`, which is valid once
the async factory promise resolves.

## HeadingPitchRoll semantics

`HeadingPitchRoll` stores `heading`, `pitch`, and `roll` in RADIANS.

- `heading` is rotation from north, increasing clockwise.
- `pitch` is rotation from the local horizontal plane; it is NEGATIVE when looking
  down. A top-down view is `pitch` of `-Math.PI / 2`.
- `roll` is rotation about the forward view axis.

ALWAYS construct from degrees with `HeadingPitchRoll.fromDegrees(heading, pitch, roll)`
or convert each angle with `Cesium.Math.toRadians`. NEVER pass raw degree numbers into
the radian fields; a `pitch` of `-35` radians points the camera far away from the
intended view.

## Frustum types

The camera's projection is `camera.frustum`.

| Frustum | Use |
|---------|-----|
| `PerspectiveFrustum` | default 3D perspective projection |
| `OrthographicFrustum` | parallel projection, no perspective foreshortening |
| `PerspectiveOffCenterFrustum` | asymmetric perspective, for stereo or tiled walls |

Switch projection with `camera.switchToOrthographicFrustum()` and
`camera.switchToPerspectiveFrustum()`. ALWAYS use these switch methods; NEVER replace
`camera.frustum` with a hand-built frustum object during normal use.

## ScreenSpaceCameraController

User input is handled by `viewer.scene.screenSpaceCameraController`. All `enable*`
flags default to `true`.

| Member | Default | Effect |
|--------|---------|--------|
| `enableInputs` | `true` | master toggle for all input |
| `enableRotate` | `true` | globe rotation |
| `enableTranslate` | `true` | 2D and Columbus View panning |
| `enableZoom` | `true` | zoom |
| `enableTilt` | `true` | tilt |
| `enableLook` | `true` | free-look rotation |
| `enableCollisionDetection` | `true` | stops the camera below terrain |
| `minimumZoomDistance` | `1.0` | closest zoom, in meters |
| `maximumZoomDistance` | `Infinity` | farthest zoom, in meters |

ALWAYS set `minimumZoomDistance` to a positive value to stop the camera zooming
through the ground. NEVER disable `enableCollisionDetection` unless an underground or
fly-through view is explicitly wanted.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `await camera.flyTo(...)` | Use the `complete` callback; `Camera.flyTo` returns void |
| Camera stuck after `lookAt` | Release with `lookAtTransform(Matrix4.IDENTITY)` |
| Camera underground | Set `minimumZoomDistance`; keep `enableCollisionDetection` |
| Degree numbers in radian fields | Use `HeadingPitchRoll.fromDegrees` or `toRadians` |
| `Cartographic` as `destination` | Pass a `Cartesian3` |
| Reading view right after `flyTo` | Read inside the `complete` callback |

Full root-cause analysis is in `references/anti-patterns.md`.

## Reference Files

- `references/methods.md` : verified `Camera` method signatures,
  `ScreenSpaceCameraController` members, `HeadingPitchRoll`, and the frustum classes.
- `references/examples.md` : runnable `setView`, `flyTo`, `lookAt` lock and release,
  bounding-sphere framing, orthographic switch, and input-constraint examples.
- `references/anti-patterns.md` : camera failure modes, each with symptom, root cause,
  prevention, and recovery.

## Related Skills

- `cesium-core-architecture` : the Scene and Camera containment graph.
- `cesium-core-coordinates` : `Cartesian3`, `Cartographic`, and `HeadingPitchRoll`.
- `cesium-syntax-viewer` : `Viewer` and `CesiumWidget` construction.
- `cesium-errors-coordinates` : NaN positions and radians-versus-degrees mistakes.
