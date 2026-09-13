# Framework integration and compatibility

## Ownership rule

Use public engine APIs when a library owns the renderer, state cache, render loop,
canvas/context, resources, or loss recovery. Verify current official documentation
before assuming a backend or extension point.

| Framework | Inspect before changing |
| --- | --- |
| Three.js / Babylon.js / PlayCanvas | Renderer state cache, materials/effects, custom pass API, context restoration, resource disposal. |
| PixiJS / Phaser | Batch renderer/custom pipeline APIs, texture cache, renderer reset, canvas lifecycle. |
| regl / twgl.js | Command/state abstraction, resource ownership and destroy API; avoid out-of-band raw state. |
| MapLibre GL / deck.gl | Custom layer shared-context contract, documented state reset, map scheduling and repaint. |
| TensorFlow.js / ONNX Runtime Web / Transformers.js | Backend selection, tensor/resource disposal, synchronization/readback and fallback. |

If raw integration is supported, snapshot or establish every state category required by
the contract and notify/reset the framework cache as documented. A single
`gl.useProgram` or framebuffer bind can invalidate a renderer's assumptions.

## Compatibility procedure

Define browser/OS/device targets, WebGL version, extensions, limits, workers,
OffscreenCanvas, color/alpha, and performance budgets. Check current platform sources,
then feature-detect context and extensions at runtime. Test WebGL 2 and WebGL 1 paths
independently. Date the matrix and preserve a fallback/unsupported state for gaps.

WebGL context creation does not guarantee every extension, format, limit, precision,
or acceptable performance. Avoid version-only support claims.
