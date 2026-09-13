# WGSL operational guide

WGSL is the only shader language accepted directly by WebGPU. Do not paste GLSL ES
syntax or assume implicit conversions.

## Interfaces and data

Use explicit scalar/vector/matrix/array/struct types. Address spaces (`function`,
`private`, `workgroup`, `uniform`, `storage`) determine lifetime, access, and layout.
Use `var<uniform>` for read-only uniform bindings and `var<storage, read>` or
`read_write` for storage according to the host layout. Keep host-shareable layout in
sync with written bytes.

Entry points use `@vertex`, `@fragment`, or `@compute`. Match locations and built-ins
across stages. Specify interpolation when integer/flat or non-default behavior is
required. Fragment targets must match pipeline formats and returned locations.

Texture operations distinguish sampled, depth, storage, and external textures plus
filtering/non-filtering/comparison samplers. Match WGSL declarations to bind-group
layout types; do not treat a texture format and its sample type as interchangeable.

## Compute discipline

Set `@workgroup_size` from an algorithm and verified limits, not a universal hardware
claim. Use `@builtin(global_invocation_id)` for global indexing and bounds-check it.
Workgroup memory is shared only within a workgroup. All invocations that reach a
workgroup barrier must do so under valid uniform control flow. Use atomics only on
supported atomic types/address spaces and design contention deliberately.

## Debug checklist

- Inspect compilation diagnostics with source line/column.
- Check missing semicolons, explicit casts, access mode, address space, entry-point
  attributes, stage I/O, binding uniqueness, and uniformity diagnostics.
- Recompute host layout for every struct change.
- Confirm array indexing and dispatch/draw bounds.
- Confirm pipeline targets, vertex formats, bindings, and shader declarations agree.

Use the WGSL specification sections on types, memory layout, shader stages, resource
interface, uniformity, and execution for normative behavior; do not reproduce or
freeze the full specification here.
