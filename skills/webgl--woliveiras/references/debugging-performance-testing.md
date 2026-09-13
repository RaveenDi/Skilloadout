# Debugging, performance, and testing

## Failure isolation

Preserve the first failure. Classify context creation, JavaScript, compile, link,
invalid enum/value/operation, incomplete texture, incomplete framebuffer, upload/CORS,
extension absence, out-of-memory, or context loss. In a debug build, put `getError()`
at phase boundaries and drain existing errors before attributing a new one. Remove
blocking checks from the release hot path.

Capture a frame with a maintained tool such as Spector.js only after verifying current
browser/tool support. A capture is evidence about that run, not normative API truth.
Reduce to one program, VAO, texture, framebuffer, and draw while logging the complete
state boundary. Use Khronos conformance tests to distinguish implementation behavior,
not to replace an application regression.

## Performance protocol

Fix target browser/device, resolution, input/scene, warm-up, sample count, and power
conditions. Measure CPU p50/p95 frame time, supported disjoint GPU timer queries,
draws, program/VAO/texture/FBO changes, uploaded bytes, readbacks, allocation churn,
overdraw, and physical pixel count. Treat disjoint/invalid GPU timing samples as
invalid.

Optimize the measured bottleneck: batch compatible draws, instance repeated geometry,
sort stable state when ordering permits, cache locations/programs/VAOs, atlas textures
when lifecycle/filtering allows, use immutable storage/right-sized targets, reduce
uploads/readbacks/overdraw, or cap resolution. Re-measure one change at a time.

## Test layers

1. Strict TypeScript and static shader source/version checks.
2. CPU tests for transforms, packing, geometry bounds, state descriptors, resource
   registries, resize, and fallback selection.
3. Browser integration for compile/link, representative pixels with tolerance,
   framebuffer completeness, texture async/CORS paths, and resource cleanup.
4. Loss/restore tests using a controlled extension path when available.
5. WebGL 2 and explicit WebGL 1 target matrix, including extension absence, high-DPI,
   worker path if required, and low-end device constraints.

Do not call type checking a runtime render test. Record browser version, OS, GPU/device
class, flags, and untested targets for every compatibility claim.
