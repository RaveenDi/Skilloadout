# Framework integration and compatibility

## Ownership rule

When a library controls the renderer, render loop, device/context, passes, or resource
cache, use its public API first. Check its current documentation and release before
assuming a WebGPU backend or raw-device escape hatch.

| Framework category | Inspect before changing |
| --- | --- |
| Three.js / Babylon.js / PlayCanvas | Renderer/backend maturity, shader/material abstraction, pass graph, lifecycle and fallback. |
| PixiJS / Phaser | Selected renderer, plugin/custom-pipeline extension points, canvas ownership, batching and texture cache. |
| regl / twgl.js | These are WebGL-oriented abstractions; do not inject WebGPU into their owned state. Define a separate backend boundary. |
| MapLibre GL / deck.gl | Layer API, shared context/device contract, map render scheduling and state reset rules. |
| TensorFlow.js / ONNX Runtime Web / Transformers.js | Backend selection, tensor ownership, synchronization/readback, model/operator support, fallback. |

## Temporal compatibility procedure

1. Define required browsers, versions, OSes, devices, enterprise policies, secure
   context, workers, and GPU features.
2. Check MDN/browser platform status and the framework's current official docs.
3. Feature-detect `navigator.gpu`, adapter, features, and limits at runtime.
4. Test the exact matrix. Keep fallback or an unsupported-state UI for gaps.
5. Date the evidence. Do not put a changing “supported everywhere” claim in code.

WebGPU exposure does not guarantee an adapter, requested feature, limit, format, good
performance, or bug-free driver. Capability detection and product policy both matter.
