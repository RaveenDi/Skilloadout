# Camera Syntax : Anti-Patterns

Each entry lists the symptom, the root cause, the prevention, and the recovery. All
failure modes are verified against the CesiumJS API reference and the CesiumGS/cesium
issue tracker.

## 1. Awaiting Camera.flyTo

Symptom: Code after `await camera.flyTo(...)` runs immediately, and the camera state
read there is the old position, not the destination.

Root cause: `Camera.flyTo` returns `void`. Awaiting `undefined` resolves on the same
microtask, long before the animated flight finishes.

Prevention: ALWAYS pass a `complete` callback to `Camera.flyTo` and run post-arrival
code from it. NEVER `await` `camera.flyTo`.

Recovery: Move the post-arrival code into the `complete` callback. If an entity is the
target, use `viewer.flyTo(entity)`, which does return a Promise.

## 2. Camera stuck after lookAt

Symptom: After a `lookAt` call, the camera will not rotate or pan freely; navigation
feels locked to one point.

Root cause: `lookAt` and `lookAtTransform` set `camera.transform` to a non-identity
reference frame. While that transform is in place, navigation is confined to the frame.

Prevention: ALWAYS release the lock with `camera.lookAtTransform(Matrix4.IDENTITY)`
before free navigation is needed.

Recovery: Call `viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)`. A `setView` or
`flyTo` with an identity `endTransform` also releases it.

## 3. Camera zooms underground

Symptom: The camera drops below terrain or clips through the ground while zooming.

Root cause: `minimumZoomDistance` is too small, or `enableCollisionDetection` was
disabled.

Prevention: ALWAYS set `screenSpaceCameraController.minimumZoomDistance` to a positive
value suited to the scene scale. ALWAYS keep `enableCollisionDetection` at `true`
unless an underground view is explicitly wanted.

Recovery: Set `minimumZoomDistance` and re-enable `enableCollisionDetection` on
`viewer.scene.screenSpaceCameraController`.

## 4. Reading camera state immediately after flyTo

Symptom: `camera.position` read right after `camera.flyTo(...)` is the start position,
not the destination.

Root cause: `flyTo` is animated and the camera moves over several frames. The line
after the call runs on the current frame.

Prevention: ALWAYS read the final camera state inside the `complete` callback.

Recovery: Move the read into the `complete` callback, or use `setView` when an instant
placement is acceptable.

## 5. Degree values passed into radian fields

Symptom: The camera points far from the intended direction; a small intended tilt
becomes a wild orientation.

Root cause: `HeadingPitchRoll` fields and the `orientation` heading, pitch, and roll
are RADIANS. A degree value such as `-35` is interpreted as `-35` radians.

Prevention: ALWAYS build orientation with `HeadingPitchRoll.fromDegrees(...)` or wrap
each angle in `Cesium.Math.toRadians(...)`.

Recovery: Convert every angle. Replace raw degree numbers with `toRadians` calls or
the `fromDegrees` factory.

## 6. Cartographic passed as destination

Symptom: `setView` or `flyTo` throws, or the camera jumps to a wrong location near the
Earth center.

Root cause: `destination` expects a `Cartesian3` (ECEF meters) or a `Rectangle`. A
`Cartographic` holds radian longitude and latitude and is not a valid `destination`.

Prevention: ALWAYS build a point `destination` with `Cartesian3.fromDegrees(lon, lat,
height)`.

Recovery: Convert the `Cartographic` with `Cartographic.toCartesian` or rebuild the
point with `Cartesian3.fromDegrees`.

## 7. Confusing viewer.flyTo with camera.flyTo

Symptom: `await camera.flyTo(entity)` does nothing useful, or `viewer.flyTo({
destination })` is called with a raw coordinate and fails.

Root cause: `camera.flyTo` takes a coordinate `destination` and returns `void`.
`viewer.flyTo` takes an entity or data source and returns `Promise<boolean>`. The two
are different APIs.

Prevention: ALWAYS use `camera.flyTo({ destination })` for a coordinate, with a
`complete` callback. ALWAYS use `viewer.flyTo(target)` for an entity or data source,
and `await` its Promise.

Recovery: Pick the API that matches the target type and use its completion mechanism.

## 8. Replacing camera.frustum by hand

Symptom: Projection looks wrong, or picking and depth behave inconsistently after a
frustum was assigned directly.

Root cause: Assigning a hand-built object to `camera.frustum` bypasses the camera
state the switch methods maintain.

Prevention: ALWAYS change projection with `camera.switchToOrthographicFrustum()` and
`camera.switchToPerspectiveFrustum()`.

Recovery: Call the appropriate switch method to restore a consistent frustum.
