# Core Architecture : Anti-Patterns

Each entry lists the symptom, the root cause, the prevention, and the recovery. All
failure modes are verified against the CesiumJS API reference and the CesiumGS/cesium
issue tracker.

## 1. Treating Globe as a sibling of Scene

Symptom: `viewer.globe` is `undefined`; terrain and imagery calls silently no-op.

Root cause: `Globe` is a MEMBER of `Scene`, not a sibling of it. The renderer holds
the globe inside the scene as the depth-test ellipsoid surface.

Prevention: ALWAYS access the globe as `viewer.scene.globe`. ALWAYS reason through the
containment graph in SKILL.md before writing an access path.

Recovery: Replace every `viewer.globe` with `viewer.scene.globe`. Replace `globe.scene`
and `globe.camera` with the explicit objects.

## 2. Expecting a back-reference from Scene or Globe

Symptom: `scene.viewer` or `globe.scene` is `undefined`; code that walks back up the
object graph throws.

Root cause: CesiumJS objects do not carry parent back-references. `Scene` does not know
its `Viewer`; `Globe` does not know its `Scene`.

Prevention: ALWAYS pass the object a function needs as a parameter. NEVER design code
that walks upward from a child to a parent.

Recovery: Add explicit parameters. A function that needs the scene takes `scene`; a
function that needs the viewer takes `viewer`.

## 3. Continuous render drains battery on a static scene

Symptom: A scene that never changes still pegs the GPU and drains the battery.

Root cause: CesiumJS renders every animation frame by default, even with no change.

Prevention: ALWAYS set `requestRenderMode: true` for a static or rarely-changing
scene. Set `maximumRenderTimeChange: Infinity` when there is no time-dynamic data.

Recovery: Add `requestRenderMode: true` to the constructor options. Audit the code for
manual mutations that now need `scene.requestRender()` (see entry 4).

## 4. Scene frozen after a manual change in requestRenderMode

Symptom: With `requestRenderMode` on, a primitive, `modelMatrix`, or material uniform
is changed in code but the scene still shows the old frame.

Root cause: In `requestRenderMode`, Cesium renders only on a detected change. A direct
property mutation is not a detected change.

Prevention: After ANY manual change Cesium cannot detect, ALWAYS call
`scene.requestRender()`. Camera moves, tileset loads, and entity property changes are
detected automatically; raw primitive and uniform mutations are not.

Recovery: Add `scene.requestRender()` immediately after the mutation.

## 5. Assuming a WebGPU rendering backend

Symptom: Code or a prompt configures a WebGPU context or expects a WebGPU toggle.

Root cause: CesiumJS 1.124+ renders EXCLUSIVELY on WebGL2. WebGPU is a roadmap item and
is not shipped. There is no WebGPU backend (recorded as L-001).

Prevention: NEVER reference a WebGPU rendering path for CesiumJS. ALWAYS treat WebGL2
as the only backend.

Recovery: Remove every WebGPU reference. WebGL2 is requested by default through
`contextOptions.requestWebgl2`.

## 6. Reading camera state immediately after flyTo

Symptom: Camera position read right after `camera.flyTo(...)` returns the old
position, not the destination.

Root cause: `flyTo` is animated and resolves on a later frame. `setView` is instant;
`flyTo` is not.

Prevention: ALWAYS `await` the `flyTo` promise, or use the `complete` callback, before
reading the final camera state. Use `setView` when an instant placement is required.

Recovery: Wrap the read after `await viewer.camera.flyTo(...)`.

## 7. Constructing both a Viewer and a CesiumWidget for one container

Symptom: Two render loops, duplicated canvases, or input handlers fighting over the
same DOM element.

Root cause: `Viewer` already owns a `CesiumWidget` internally, reachable as
`viewer.cesiumWidget`. A second widget on the same container double-renders.

Prevention: ALWAYS pick one class per container. Use `viewer.cesiumWidget` to reach
the widget a `Viewer` already owns.

Recovery: Remove the extra construction. Keep `Viewer` for the standard UI, or keep
`CesiumWidget` for a custom UI, never both.

## 8. scene3DOnly set, then a 2D morph attempted

Symptom: `morphTo2D` or `morphToColumbusView` does nothing, or a 2D base layer fails
to draw.

Root cause: `scene3DOnly: true` skips 2D and Columbus View geometry batches at
construction. Those modes are unavailable for the lifetime of the scene.

Prevention: ALWAYS leave `scene3DOnly` at its `false` default when the application
needs 2D or Columbus View. Set it `true` ONLY when the scene stays in 3D.

Recovery: Remove `scene3DOnly: true` from the constructor options and reconstruct the
viewer, or remove the morph calls.

## 9. Per-frame work on a separate requestAnimationFrame loop

Symptom: Per-frame logic drifts out of sync with the rendered frame; updates land one
frame late or early.

Root cause: A separate `requestAnimationFrame` loop does not share Cesium's frame
timing or its `requestRenderMode` gating.

Prevention: ALWAYS attach per-frame logic to `scene.preUpdate`, `postUpdate`,
`preRender`, or `postRender`. NEVER run a parallel `requestAnimationFrame` loop for
scene-coupled work.

Recovery: Move the callback onto the appropriate `Scene` event with `addEventListener`,
and remove it with `removeEventListener` during teardown.
