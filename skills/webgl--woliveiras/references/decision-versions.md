# Decision and WebGL versions

## Choose WebGL deliberately

Use Canvas 2D or SVG when their scene, accessibility, and performance model is enough.
Use WebGL when programmable raster graphics and broad deployed browser reach matter,
an existing WebGL renderer is stable, or the framework backend requires it. WebGL has
no general compute shader stage; evaluate WebGPU or CPU/WASM for genuine compute.

Prefer WebGL 2 for new raw WebGL code because VAOs, instancing, multiple render
targets, 3D/array textures, uniform buffers, and GLSL ES 3.00 capabilities are core.
WebGL 1 is an explicit compatibility profile. It requires its own shader variants,
extension gates, format rules, and tests.

## Fallback contract

Request `webgl2`. If it fails, request `webgl` only when a maintained WebGL 1 path
exists. Do not return a WebGL 1 context to WebGL 2 code and hope feature tests cover
syntax/API differences. Otherwise choose Canvas 2D, reduced functionality, a WebGPU
backend, or a clear unsupported state according to product requirements.

## Raw API versus engine

Keep a framework-owned canvas/context/render loop/resource cache behind its public
API. Raw calls are appropriate for a new renderer, a documented custom layer/effect
hook, or diagnosis that preserves/restores all state required by the owner. Before
sharing a context, define who controls program, VAO, framebuffer, texture units,
viewport/scissor, blend/depth/stencil/cull state, pixel store, and resource deletion.

## WebGPU migration/fallback

Do not describe WebGPU as a drop-in WebGL upgrade. Build a backend boundary, inventory
extensions and shader semantics, establish image/numeric baselines, and verify the
real audience matrix. Keep WebGL until the WebGPU path meets functional, compatibility,
recovery, and performance acceptance criteria.
