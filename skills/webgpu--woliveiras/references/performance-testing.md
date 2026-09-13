# Performance and testing

## Measurement protocol

Define the target device/browser, scene/input, resolution, warm-up, sample window,
power conditions, and acceptance threshold. Record CPU update/encode/submit time,
frame p50/p95, draw and dispatch counts, pass/pipeline/bind-group changes, allocation
and upload bytes, readback frequency, and memory estimates. Measure GPU timestamps
only when the required query feature is present and the measurement method is valid.

Separate shader/pipeline compilation, asset upload, steady-state frame time, compute
latency, and readback latency. A lower CPU submit time is not proof of lower GPU time.

## Candidate optimizations

- Batch compatible draws; use instancing when data and culling behavior fit.
- Cache pipelines, layouts, samplers, and stable bind groups.
- Consolidate small updates, reuse buffers/textures, and right-size targets.
- Reduce pipeline switches, passes, redundant clears/copies, and excessive resolution.
- Keep readbacks asynchronous and off the critical path; avoid them entirely when an
  on-GPU consumer can use the result.
- Tune workgroup sizes against algorithm and target measurements within device limits.
- Consider render bundles only for stable, repeatedly encoded draw sequences with a
  demonstrated CPU bottleneck.

## Test layers

1. Static: strict TypeScript, lint, descriptor/schema assertions.
2. CPU unit: byte packing, offsets/strides, transforms, dispatch sizing, fallback
   selection, and reconstruction descriptors.
3. GPU integration: adapter/device failure, module/pipeline creation, representative
   render/compute output with tolerances, resize, and cleanup.
4. Recovery: synthetic application loss path plus real `device.lost` handling where a
   controllable environment permits it.
5. Compatibility: current browser/OS/device matrix, optional-feature absence, low
   limits, worker path, alpha/color behavior, and fallback.

Do not call TypeScript success a browser test. Do not call one browser/GPU a support
matrix. Record unexecuted surfaces explicitly.
