# Decision and architecture

## Choose the least complex adequate platform

- Use Canvas 2D or SVG for retained/accessible vector UI, modest sprite counts, or
  diagrams that do not need programmable GPU stages.
- Use CPU or WASM when the workload is small, data-dependent, latency-sensitive to
  GPU readback, or must run where WebGPU is unavailable.
- Use WebGL when an existing renderer is stable, browser/device reach is broader than
  the verified WebGPU matrix, or the engine's WebGPU backend lacks required features.
- Use WebGPU for modern render workloads that benefit from explicit resources and
  pipelines, or browser compute that maps well to parallel dispatch without frequent
  CPU readback.

Rendering produces attachments through render passes. Compute dispatches workgroups
without a graphics pipeline; it is not automatically faster than CPU or WebGL-based
techniques. Include transfer, encoding, synchronization, compilation, and fallback
costs in the decision.

## Define a capability boundary

Expose an application-level renderer/compute interface. Select a backend after
feature detection and product policy, not in domain code. Define what happens when:

- `navigator.gpu` is absent;
- no adapter is returned;
- required features/limits are unavailable;
- device creation or pipeline creation fails;
- the device is lost after work begins.

A fallback may be WebGL, Canvas 2D, CPU/WASM, reduced functionality, or a clear
unsupported state. It must be tested, not only mentioned.

## Raw API versus engine

Prefer the existing engine when it owns the canvas, device, context, render loop,
passes, resource cache, shader graph, or loss recovery. Use raw WebGPU for a new
renderer, research/prototyping, unsupported capabilities behind a documented engine
extension point, or low-level profiling that cannot be obtained otherwise.

Before mixing layers, identify who creates and destroys each resource, who submits
commands, when external code may encode passes, and how state/loss is communicated.
If those contracts are absent, do not mix ownership.

## Migration from WebGL

Migrate by behavior slices, not mechanical API translation. Inventory shaders,
vertex formats, uniforms, textures, render targets, state, extensions, readbacks,
and context-loss logic. Re-express shader interfaces in WGSL, account for coordinate
and texture conventions explicitly, establish golden images or numeric tolerances,
and run both backends on the real support matrix before removing WebGL.
