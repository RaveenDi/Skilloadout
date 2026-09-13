# Resources and memory layout

## Ownership and usage

Every resource needs an owner, descriptor, creation point, update frequency, last-use
boundary, and destruction/recovery path. `GPUBufferUsage` and `GPUTextureUsage` are
bit flags describing permitted operations; include all required uses at creation and
no speculative uses that widen cost/validation surface.

Use `mappedAtCreation` for initial CPU population when appropriate, then unmap before
GPU use. Use `queue.writeBuffer` for bounded CPU-to-GPU updates, buffer-to-buffer copy
or staging for larger/structured transfers, and `mapAsync` only with compatible map
usage and synchronization. Mapping/readback waits for GPU ownership and can stall the
pipeline; keep it outside the frame-critical path when possible.

## WGSL host-shareable layout

Do not infer layout from TypeScript object shapes. Compute member alignment, member
offset, size, array stride, and struct alignment from WGSL host-shareable layout rules.
Represent bytes with `ArrayBuffer`, `DataView`, and typed-array views at verified
offsets. Common traps include `vec3` alignment, matrix column stride, nested structs,
runtime arrays, and different uniform/storage address-space constraints.

Validate:

- `GPUBuffer.size` covers the bound range and required alignment;
- binding offset and size meet `minUniformBufferOffsetAlignment` or
  `minStorageBufferOffsetAlignment` for dynamic offsets;
- copy offsets/bytes-per-row/rows-per-image meet operation-specific constraints;
- vertex and index formats match written bytes and draw bounds;
- uniform/storage binding sizes cover the shader's declared access.

## Update patterns

Use immutable/static buffers for stable data. Batch partial writes to dynamic data and
avoid many tiny queue calls when profiling identifies overhead. Use double/ring
buffering only when it solves measured CPU/GPU overlap or overwrite hazards; size it
from frames in flight and alignment. Reuse allocations and destroy no-longer-needed
buffers deliberately. `destroy()` makes future GPU use invalid; do not destroy before
submitted work no longer depends on the resource.
