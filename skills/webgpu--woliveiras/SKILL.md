---
name: webgpu
description: Implement, review, debug, test, or optimize browser WebGPU code using navigator.gpu, WGSL, GPUDevice, GPUBuffer, GPUTexture, bind groups, render pipelines, compute pipelines, or compute shaders. Use for raw WebGPU, GPU compute in the browser, and deliberate WebGL-to-WebGPU migration; preserve an existing engine's renderer and resource ownership unless raw API integration is explicitly justified. Verify current browser, hardware, and API support from canonical sources.
---

# WebGPU operations

## Objective

Produce correct, measurable, recoverable WebGPU changes in an existing project.
Treat specifications and conformance tests as authority, and treat browser support,
optional features, limits, and framework APIs as temporal facts.

## Scope boundaries

Use this skill for raw WebGPU, WGSL, render/compute pipelines, WebGPU debugging or
profiling, and migrations where WebGPU is a candidate. Do not use it for a WebGL-only
task, native Vulkan/Metal/D3D work, or a purely Canvas 2D/SVG concern. If Three.js,
Babylon.js, PixiJS, Phaser, PlayCanvas, MapLibre GL, deck.gl, TensorFlow.js, ONNX
Runtime Web, or Transformers.js owns the renderer, use its public abstraction first.

## Inspect before editing

1. Read project instructions, manifests, renderer creation, render loop, shaders,
   resource factories, resize path, tests, and performance instrumentation.
2. Record raw API versus framework; target browsers/devices; fallback contract;
   TypeScript/JavaScript; bundler; render versus compute; worker/OffscreenCanvas use;
   precision, color, alpha, depth/stencil, and antialiasing requirements.
3. Trace ownership of canvas, adapter, device, context, pipelines, bind groups,
   buffers, textures, and their CPU-side reconstruction descriptors.
4. Capture the current failure or a baseline before changing behavior. Never replace
   the architecture merely because a minimal raw sample is easier.

Use [discovery](checklists/discovery.md) to make this inspection explicit.

## Choose the approach

```text
Can Canvas 2D, SVG, or CPU/WASM meet the measured requirement? -> use it
Need browser compute shaders? -> evaluate WebGPU and a non-WebGPU fallback
Existing engine owns a suitable WebGPU backend? -> use that public backend
Existing WebGL product with broad/legacy targets? -> preserve WebGL unless migration pays
Raw control is essential and target support is verified? -> raw WebGPU is viable
Otherwise -> prototype behind a capability boundary and retain fallback
```

Do not equate “new project” with “WebGPU.” Read
[decision and architecture](references/decision-and-architecture.md) and
[framework integration and compatibility](references/framework-compatibility.md)
for selection or migration tasks.

## Implement

1. Establish explicit initialization and failure behavior: `navigator.gpu`, adapter,
   required features/limits, device, loss/error handlers, canvas context, format, and
   configuration.
2. Model resource descriptors, ownership, update frequency, and destruction. Match
   CPU bytes to WGSL alignment and size. Reuse pipelines, bind groups, samplers,
   buffers, and textures unless measurements justify churn.
3. Define shader interfaces before host bindings. Validate `@group`/`@binding`,
   visibility, usage flags, texture sample/storage type, buffer binding type, and
   dynamic offset alignment.
4. Encode passes with explicit attachments, load/store operations, state, dispatch or
   draw bounds, submission, and resize behavior.
5. Add diagnostics and tests alongside the change. Preserve a framework's public
   ownership boundary.

Use [implementation](checklists/implementation.md) and the task-specific references.

## Review

Trace input bytes through shader interfaces to output attachments. Check feature and
limit negotiation, usage flags, alignment, bounds, load/store semantics, color space,
alpha, resize, asynchronous failure, device loss, lifetime, cleanup, fallback, and
test evidence. Separate correctness findings from unmeasured optimization ideas. Use
[code review](checklists/code-review.md).

## Debug

1. Reproduce with a minimal deterministic input and preserve the first error.
2. Classify JavaScript exception, adapter absence, validation error, WGSL diagnostic,
   pipeline failure, out-of-memory/internal error, uncaptured error, or device loss.
3. Add a narrow error scope around the suspect operation; inspect shader compilation
   info; verify interfaces, usages, ranges, alignment, and pass state.
4. Reduce one resource/pass/binding at a time. Do not suppress validation to make the
   symptom disappear.
5. Add a regression check and remove hot-path diagnostics after resolution.

Read [errors and debugging](references/errors-debugging.md) and use
[debugging](checklists/debugging.md).

## Profile and optimize

Measure CPU frame/encode time, GPU time only when supported, uploads, readbacks,
draw/dispatch count, pass count, pipeline/bind-group changes, allocations, resolution,
and warm-up. Compare repeatable p50 and p95 samples when frame consistency matters.
Change one bottleneck at a time, then remeasure. Never claim occupancy or hardware
behavior without target-specific evidence. Read
[performance and testing](references/performance-testing.md) and use
[performance](checklists/performance.md).

## Test

Layer static type checks, deterministic CPU-side packing/layout tests, shader/pipeline
creation diagnostics, headless or real-browser integration where supported, and a
target-device matrix. Feature absence, adapter failure, resize, visibility changes,
device loss recovery, fallback, and cleanup are test cases. CTS results validate an
implementation, not application logic. Use [testing](checklists/testing.md).

## Mandatory rules

- Verify unstable API shape, browser support, features, formats, and limits from
  current canonical sources; never invent them or assume availability.
- Keep WGSL and GLSL ES distinct. Do not hide uncertainty with `any` or unjustified
  casts.
- Handle initialization failure, shader diagnostics, validation errors, and
  `device.lost`; define recovery or a user-visible terminal state.
- Keep CSS size separate from physical drawing-buffer size; cap pixel ratio from an
  explicit quality/performance policy and recreate size-dependent attachments.
- Avoid per-frame pipeline, buffer, texture, sampler, and bind-group creation unless a
  measured design requires it. Avoid GPU-to-CPU readback in the critical path.
- Profile before optimizing and report what was measured, where, and how.
- Keep ownership and lifetime explicit. Do not mix raw calls into an engine-owned
  device, passes, or render loop without a supported integration contract.

## Prohibited practices

Do not copy stale snippets without verifying current APIs; request maximum limits by
default; use `layout: "auto"` across incompatible pipelines; ignore padding; submit
commands after device loss; recreate attachments without updating views/bind groups;
assume timestamps, storage formats, compressed textures, or adapter information; claim
runtime/browser success from type checking; or replace a proven fallback without an
acceptance plan.

## Reference map

Load only what the current task needs:

- Selection, raw versus engine, fallback: [decision and architecture](references/decision-and-architecture.md)
- Adapter/device/context/resize/loss setup: [initialization and canvas](references/initialization-canvas.md)
- Buffers, padding, uploads, lifetime: [resources and memory](references/resources-memory.md)
- Textures, samplers, bind groups, layouts: [textures and bindings](references/textures-bindings.md)
- Render/compute pipelines, passes, submission: [pipelines and commands](references/pipelines-commands.md)
- WGSL types, interfaces, workgroups, synchronization: [WGSL](references/wgsl.md)
- Failure classification and deterministic diagnosis: [errors and debugging](references/errors-debugging.md)
- Measurement and test strategy: [performance and testing](references/performance-testing.md)
- Framework ownership and current support: [framework integration and compatibility](references/framework-compatibility.md)
- Authority and consultation dates: [source map](references/source-map.md)
- Reusable starting points: [templates](templates/initialization.ts)
- Minimal patterns: [examples](examples/triangle.ts)
- Behavioral forward tests: [evaluation cases](evaluations/cases.yaml)

Run `node scripts/audit-skill.mjs` from this skill directory after editing a copied or
installed skill.

## Completion criteria

Complete the task only when the requested behavior is implemented or the blocker is
explicit; relevant type/static tests pass; shader and initialization failures are
observable; resize, loss, lifetime, and fallback behavior are addressed; performance
claims have before/after evidence; current temporal claims cite sources; and the final
report distinguishes static, browser, device, and unexecuted validation. Finish with
[completion](checklists/completion.md) and [compatibility](checklists/compatibility.md).
