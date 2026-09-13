---
name: webgl
description: Implement, review, debug, test, or optimize browser WebGL 2 and WebGL 1 code using WebGL2RenderingContext, WebGLRenderingContext, GLSL ES vertex or fragment shaders, buffers, VAOs, framebuffers, textures, extensions, or context-loss handling. Prefer WebGL 2 for new raw WebGL code while treating WebGL 1 as an explicit legacy compatibility target; preserve an existing engine's renderer, state, and resource ownership.
---

# WebGL operations

## Objective

Produce correct, state-safe, recoverable, and measured WebGL changes in real browser
projects. Prefer WebGL 2 when raw WebGL is the chosen technology; retain WebGL 1 only
when the support matrix or existing architecture requires it.

## Scope boundaries

Use this skill for WebGL 2/1, GLSL ES, context creation/loss, buffers, VAOs,
framebuffers, textures, extensions, debugging, performance, and conscious version
migration. Do not use it for WebGPU/WGSL, native OpenGL, or a Canvas 2D/SVG-only
concern. When Three.js, Babylon.js, PixiJS, Phaser, regl, twgl.js, PlayCanvas,
MapLibre GL, deck.gl, TensorFlow.js, ONNX Runtime Web, or Transformers.js owns the
renderer, use its public abstraction before raw calls.

## Inspect before editing

1. Read project instructions, manifests, renderer/context creation, shaders, render
   loop, state wrappers, resource factories, resize path, tests, and profiling hooks.
2. Record raw API versus framework; WebGL 2/1 and fallback policy; target browsers and
   devices; TypeScript/JavaScript; bundler; worker/OffscreenCanvas; precision, color,
   alpha, antialias, depth/stencil, and power requirements.
3. Trace ownership of canvas, context, programs, shaders, VAOs, buffers, textures,
   samplers, framebuffers, renderbuffers, query/sync objects, and CPU-side recreation
   descriptors.
4. Capture the failure or a performance baseline. Do not “fix” engine-managed code by
   mutating raw state outside its supported extension points.

Use [discovery](checklists/discovery.md).

## Choose the approach

```text
Can Canvas 2D or SVG meet the measured requirement? -> use it
Need compute shaders? -> WebGL is not a compute-shader API; evaluate WebGPU/CPU/WASM
Existing engine owns WebGL? -> use its public renderer/material/effect APIs
Raw WebGL with no legacy constraint? -> start with WebGL 2
WebGL 1 audience is required? -> design and test an explicit restricted path
WebGPU is optional but reach/fallback matters? -> keep a WebGL capability boundary
```

Read [decision and versions](references/decision-versions.md) and
[framework integration and compatibility](references/framework-compatibility.md).

## Implement

1. Request `webgl2`, then use a deliberate `webgl` fallback only if the product has a
   WebGL 1 implementation. Validate context attributes and initialization failure.
2. Compile every shader, link every program, preserve full logs on failure, cache
   locations, and clean partial objects. Keep GLSL ES 3.00 and 1.00 syntax separate.
3. Configure VAOs, attributes, index buffers, textures, pixel-store state,
   framebuffers, viewport/scissor, depth, blend, stencil, culling, and masks
   explicitly at render-pass boundaries.
4. Separate CSS size from drawing-buffer size. Resize attachments and set viewport.
5. Track ownership and delete resources. Stop on context loss; recreate all GPU
   resources from CPU descriptors after restore.

Use [implementation](checklists/implementation.md) and task-specific references.

## Review

Review WebGL as a state machine. Trace the current program, VAO, array/element
buffers, framebuffer/renderbuffer, active texture unit and bindings, viewport,
scissor, blend/depth/stencil/cull enables and functions, masks, and pixel-store state.
Check shader logs, framebuffer completeness, texture completeness, extension gates,
resize, context loss, cleanup, and evidence. Use [code review](checklists/code-review.md).

## Debug

1. Preserve the first console/shader/program error and reproduce with deterministic
   input.
2. Classify initialization, JavaScript, shader compile, program link, invalid state,
   incomplete texture, incomplete framebuffer, extension absence, CORS/upload,
   out-of-memory, or context loss.
3. In a debug build, check `getError()` at narrow boundaries, never indiscriminately
   in the production hot path. Inspect complete shader/program logs and framebuffer
   status.
4. Capture or log the full pass state; reduce one draw, binding, attachment, or state
   transition at a time.
5. Add a regression test and remove blocking diagnostics from the hot path.

Read [debugging, performance, and testing](references/debugging-performance-testing.md)
and use [debugging](checklists/debugging.md).

## Profile and optimize

Measure CPU frame time, supported GPU timing, draw calls, program/VAO/texture and
framebuffer changes, uploads, readbacks, allocations, overdraw, and physical
resolution. Warm up shaders and assets; compare repeatable p50/p95 samples when
relevant. Prefer batching, instancing, stable state ordering, right-sized targets,
and reduced uploads only after identifying the bottleneck. Use
[performance](checklists/performance.md).

## Test

Layer TypeScript/static checks, shader/program failure tests, deterministic state and
resource tests, real-browser integration, context-loss simulation where supported,
and target-device coverage. Test WebGL 2 and WebGL 1 as separate capabilities, not by
assuming a WebGL 2 shader will run on WebGL 1. CTS proves implementation conformance,
not application correctness. Use [testing](checklists/testing.md).

## Mandatory rules

- Verify API, GLSL ES version, extension name, format/type combination, limit, and
  browser support from current canonical sources. Feature-detect extensions.
- Check shader `COMPILE_STATUS` and program `LINK_STATUS`; preserve logs and cleanup
  partial objects. Do not silently render with an invalid program.
- Make pass state explicit and avoid accidental residual-state dependencies.
- Check framebuffer completeness after attachment changes and texture completeness
  after allocation/parameter changes.
- Handle `webglcontextlost` with `preventDefault`, stop the loop, invalidate all GPU
  handles, and deterministically rebuild after `webglcontextrestored`.
- Avoid per-frame resource creation and critical-path readback; delete owned objects.
- Keep CSS size, drawing-buffer size, viewport, and size-dependent attachments in
  sync under an explicit pixel-ratio policy.
- Profile before optimizing. Do not use `any` or unjustified casts to hide API errors.

## Prohibited practices

Do not mix WGSL with GLSL ES; default new code to WebGL 1; assume an extension or
float renderability; rely on stale bindings; leave active texture/pixel-store state
implicit across subsystem boundaries; ignore black-texture or incomplete-FBO causes;
use `getError()` after every call in a production loop; mutate engine-owned state
without a reset contract; claim runtime success from compilation; or claim a speedup
without a benchmark.

## Reference map

Load only what the current task needs:

- Technology choice and WebGL 1 versus 2: [decision and versions](references/decision-versions.md)
- Context attributes, resize, viewport, DPR: [context and canvas](references/context-canvas.md)
- State machine, buffers, VAOs, instancing, cleanup: [state and resources](references/state-resources.md)
- Shader compilation, linking, GLSL ES differences: [shaders and GLSL](references/shaders-glsl.md)
- Texture completeness, uploads, FBOs, MRT: [textures and framebuffers](references/textures-framebuffers.md)
- Extension gates and deterministic context restore: [extensions and context loss](references/extensions-context-loss.md)
- Failure isolation, profiling, and test layers: [debugging, performance, and testing](references/debugging-performance-testing.md)
- Framework ownership and current support: [framework integration and compatibility](references/framework-compatibility.md)
- Authority and consultation dates: [source map](references/source-map.md)
- Reusable starting points: [templates](templates/context-creation.ts)
- Minimal patterns: [examples](examples/triangle-webgl2.ts)
- Behavioral forward tests: [evaluation cases](evaluations/cases.yaml)

Run `node scripts/audit-skill.mjs` from this skill directory after editing a copied or
installed skill.

## Completion criteria

Complete only when requested behavior is implemented or the blocker is explicit;
relevant checks pass; shader/program errors remain observable; pass state, resize,
context loss, ownership, deletion, and fallback are addressed; measurements support
performance claims; temporal claims cite current sources; and the final report
distinguishes static, browser, device, and unexecuted validation. Finish with
[completion](checklists/completion.md) and [compatibility](checklists/compatibility.md).
