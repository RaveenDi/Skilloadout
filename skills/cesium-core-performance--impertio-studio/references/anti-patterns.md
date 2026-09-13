# Core Performance : Anti-Patterns

Each entry lists the symptom, the root cause, the prevention, and the recovery. All
failure modes are verified against the CesiumJS API reference and the CesiumGS/cesium
issue tracker.

## 1. Raising maximumScreenSpaceError by guess

Symptom: The scene is faster but visibly blurry, and the slowdown was not actually a
tileset cost.

Root cause: `maximumScreenSpaceError` was raised without measuring. The error value is
the quality budget; spending it does not help if the bottleneck is elsewhere.

Prevention: ALWAYS enable `scene.debugShowFramesPerSecond` and confirm the tileset is
the cost before touching `maximumScreenSpaceError`. ALWAYS change ONE lever at a time.

Recovery: Lower `maximumScreenSpaceError` back toward `16`, re-measure, and apply the
lever that targets the real bottleneck.

## 2. Continuous render drains battery on a static scene

Symptom: A scene that never changes still pegs the GPU and drains the battery.

Root cause: CesiumJS renders every animation frame by default.

Prevention: ALWAYS set `requestRenderMode: true` for a static scene, with
`maximumRenderTimeChange: Infinity` when there is no time-dynamic data.

Recovery: Add `requestRenderMode: true` to the constructor options, then audit for
manual changes that now need `scene.requestRender()` (see entry 3).

## 3. Scene frozen after a manual change in requestRenderMode

Symptom: With `requestRenderMode` on, a uniform, `modelMatrix`, or primitive is changed
in code but the scene keeps showing the old frame.

Root cause: In `requestRenderMode`, Cesium renders only on a detected change. A direct
mutation is not detected.

Prevention: After ANY manual change Cesium cannot detect, ALWAYS call
`scene.requestRender()`.

Recovery: Add `scene.requestRender()` immediately after the mutation.

## 4. skipLevelOfDetail set true causing memory and request spikes

Symptom: After enabling `skipLevelOfDetail`, peak memory rises and the network shows
request bursts; on a constrained device the context is lost.

Root cause: `skipLevelOfDetail: true` loads target-level tiles directly and skips
intermediate levels, which increases peak memory and burst request count.

Prevention: ALWAYS leave `skipLevelOfDetail` at its `false` default unless progressive
coarse-to-fine refinement is explicitly required.

Recovery: Set `skipLevelOfDetail` back to `false`. Tune `maximumScreenSpaceError`
instead for a steady reduction in tile cost.

## 5. msaaSamples too high on a low-end GPU

Symptom: A high millisecond count per frame on an integrated or mobile GPU, with no
heavy geometry to explain it.

Root cause: `msaaSamples` defaults to `4`, the heaviest anti-aliasing setting.

Prevention: ALWAYS lower `scene.msaaSamples` to `1` or `2` on low-end hardware when
the frame cost is high.

Recovery: Set `scene.msaaSamples = 1` to disable MSAA, or `2` for a middle ground, and
re-measure.

## 6. Disabling throttleRequests causes a request storm

Symptom: A tile server returns 429 or 503, or the browser stalls under hundreds of
parallel requests.

Root cause: `RequestScheduler.throttleRequests` was set to `false`, so every request
is issued at once.

Prevention: ALWAYS keep `throttleRequests` at `true`. ALWAYS raise concurrency per
server with a `requestsByServer` entry, NEVER by disabling throttling.

Recovery: Set `throttleRequests = true`. Add a `requestsByServer` override only for a
CDN that documents a higher concurrency limit.

## 7. Ignoring an undefined return from scheduleTask

Symptom: Tasks are silently lost and their results never arrive.

Root cause: `TaskProcessor.scheduleTask` returns `undefined` when more than
`maximumActiveTasks` are already active. Treating `undefined` as an error or ignoring
it drops the task.

Prevention: ALWAYS check the return value. ALWAYS treat `undefined` as a back-pressure
signal and retry the task on a later frame.

Recovery: Wrap `scheduleTask` so an `undefined` return queues the task for a retry.

## 8. TaskProcessor not destroyed

Symptom: Web Workers accumulate; memory and worker count grow across the session.

Root cause: A `TaskProcessor` owns a Web Worker that is not garbage-collected. Dropping
the reference without `destroy()` leaks the worker.

Prevention: ALWAYS call `processor.destroy()` during teardown. NEVER drop a
`TaskProcessor` reference without destroying it first.

Recovery: Keep the `TaskProcessor` reference and call `destroy()` when the work is
finished or the component unmounts.

## 9. preloadWhenHidden left true on toggled tilesets

Symptom: A tileset hidden with `show = false` keeps consuming bandwidth and memory.

Root cause: `preloadWhenHidden: true` keeps the tileset loading tiles while it is
hidden.

Prevention: ALWAYS keep `preloadWhenHidden` at its `false` default for tilesets that
are toggled on and off.

Recovery: Set `preloadWhenHidden = false` on every tileset that is shown conditionally.
