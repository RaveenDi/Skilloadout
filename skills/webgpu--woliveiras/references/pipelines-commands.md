# Pipelines and commands

## Shader and pipeline creation

Create shader modules from WGSL and inspect `getCompilationInfo()` during development
or when creation fails. A module diagnostic is distinct from pipeline validation.
Define vertex buffer layouts, primitive topology/front face/cull mode, fragment
targets and blending, depth/stencil, and multisampling explicitly.

Use `createRenderPipelineAsync` or `createComputePipelineAsync` when asynchronous
creation fits the loading workflow and current API support; handle rejection. Cache
pipelines by the complete state that affects compatibility. Never create a pipeline
for every frame or draw.

## Command lifecycle

1. Create a command encoder for a bounded unit of work.
2. Begin render/compute passes with explicit descriptors.
3. Set pipeline and compatible bind groups; set vertex/index buffers for rendering.
4. Draw/dispatch within resource and shader bounds.
5. End each pass, finish the encoder once, and submit command buffers.

Attachment `loadOp`/`storeOp` define preservation and initialization. Do not load
undefined data or discard output needed by a later pass. Organize passes to reduce
unnecessary transitions and intermediate copies while keeping dependencies clear.

For compute, derive dispatch counts from `@workgroup_size` and input length; shaders
must bounds-check partial final workgroups. Validate per-dimension and total workgroup
limits from the active device. Barriers synchronize appropriate workgroup memory or
storage accesses within defined scope; they do not synchronize arbitrary dispatches.
Use separate passes/submissions or resource dependencies as specified.

Render bundles can reduce repeated encoding for stable draw sequences, but add cache
and invalidation complexity. Adopt them only after CPU encoding measurements identify
the bottleneck.
