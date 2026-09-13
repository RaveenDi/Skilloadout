---
name: webgl-shader-effects
title: WebGL Shader Effects for Premium Websites
description: Signature GLSL/TSL shader effects for award-style websites — noise gradients, image distortion/hover ripples, dissolve and noise-mask transitions, particle morphs, fresnel/iridescent materials, displacement on scroll, and post-processing (bloom, chromatic aberration, grain, vignette) in Three.js or React Three Fiber. Use when the user wants a site to feel unique, "alive", or "never seen before", or asks for shaders, WebGL effects, transitions, or post-processing.
license: MIT
category: 3d-webgl
---

# WebGL Shader Effects

Shaders are what make a site look *authored* instead of templated. Use **one hero effect and one
supporting effect** per page; everything else stays calm.

## Setup conventions

- Pass time/scroll/pointer as uniforms: `uTime`, `uProgress` (0–1 scroll/chapter), `uPointer` (vec2, -1..1, damped), `uResolution`.
- Damp pointer & progress on the CPU; shaders should never jump.
- Prefer `ShaderMaterial` with `#include <common>` or three's **TSL/NodeMaterial** when targeting WebGPU.
- Share a noise chunk (simplex/curl) across materials.

## 1. Living gradient background

```glsl
// fragment
uniform float uTime; uniform vec2 uPointer; varying vec2 vUv;
#include ./noise.glsl   // snoise(vec3)
void main() {
  vec2 uv = vUv + uPointer * 0.03;
  float n = snoise(vec3(uv * 1.6, uTime * 0.05));
  float m = snoise(vec3(uv * 3.2 + n, uTime * 0.08));
  vec3 a = vec3(0.06, 0.07, 0.16), b = vec3(0.45, 0.20, 0.95), c = vec3(1.0, 0.55, 0.35);
  vec3 col = mix(a, b, smoothstep(-0.4, 0.8, n));
  col = mix(col, c, smoothstep(0.35, 0.9, m) * 0.6);
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.03; // grain
  gl_FragColor = vec4(col, 1.0);
}
```

## 2. Image hover / scroll distortion (DOM-synced planes)

- Mirror each `<img data-gl>` with a plane whose size/position is synced to `getBoundingClientRect()` every frame (or on scroll/resize).
- Distort UVs with velocity: `uv += normal * sin(uv.y * 10. + uTime) * uVelocity * 0.02;`
- Hover ripple: distance from `uHover` → `sin(d * 30. - uTime * 6.) * exp(-d * 6.) * uStrength`.
- Keep the real `<img>` in the DOM (visibility hidden) for accessibility and SEO.

## 3. Noise-mask transitions (scene A → scene B)

```glsl
uniform sampler2D tA, tB; uniform float uProgress; varying vec2 vUv;
void main() {
  float n = snoise(vec3(vUv * 4.0, 0.0)) * 0.5 + 0.5;
  float edge = 0.08;
  float m = smoothstep(uProgress - edge, uProgress + edge, n);
  vec4 a = texture2D(tA, vUv), b = texture2D(tB, vUv);
  vec3 glow = vec3(1.0, 0.6, 0.2) * (1.0 - abs(m - 0.5) * 2.0) * step(0.01, uProgress) * 2.0;
  gl_FragColor = vec4(mix(b.rgb, a.rgb, m) + glow * 0.4, 1.0);
}
```
Render each scene to a `WebGLRenderTarget`, composite with a fullscreen quad, drive `uProgress` from ScrollTrigger.

## 4. Particle morph (logo → object → text)

- Sample N points from each target (mesh surface via `MeshSurfaceSampler`, text via canvas pixels, image via luminance).
- Store as attributes `aPosA`, `aPosB`, `aRandom`; in the vertex shader:
  `vec3 p = mix(aPosA, aPosB, smoothstep(aRandom * 0.4, aRandom * 0.4 + 0.6, uMorph));` add curl noise during the transition.
- Points: `gl_PointSize = size * (1.0 / -mvPosition.z)`, soft circular alpha in fragment, additive blending.
- For > 200k particles use GPGPU (`GPUComputationRenderer`) or WebGPU compute.

## 5. Materials that read as "premium"

- **Fresnel rim**: `pow(1.0 - dot(normal, viewDir), 3.0)` added to emission.
- **Iridescence / thin-film**: `MeshPhysicalMaterial({ iridescence: 1, iridescenceIOR: 1.3, thickness })`.
- **Transmission glass**: `MeshPhysicalMaterial({ transmission: 1, roughness: 0.1, thickness: 1.5 })` (expensive — one object max, lower res on mobile) or drei `MeshTransmissionMaterial`.
- **Toon/stylized**: quantized N·L + outline via inverted hull.

## 6. Post-processing stack (pmndrs/postprocessing)

Order: RenderPass → (SSAO) → Bloom (threshold 0.8, intensity 0.6–1.2, mipmapBlur) → ChromaticAberration (tiny, scroll-velocity driven) → Noise/grain (0.03–0.06, premultiply) → Vignette → SMAA.
Use one `EffectComposer` with merged `EffectPass`es (fewer fullscreen passes = faster).

## 7. Performance & fallbacks

- Fullscreen fragment shaders at DPR ≤ 1.5; render background effects at half resolution then upscale.
- Avoid branching and texture lookups in loops; precompute noise textures for mobile.
- Detect low-end (`navigator.hardwareConcurrency <= 4`, `deviceMemory <= 4`, failed perf probe) → disable post FX, halve particle count.
- Always provide a static poster (CSS gradient/image) when WebGL is unavailable.
