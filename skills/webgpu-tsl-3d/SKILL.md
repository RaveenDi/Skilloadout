---
name: webgpu-tsl-3d
title: WebGPU & TSL for Next-Gen Web 3D
description: Use Three.js WebGPURenderer and TSL (Three Shading Language) node materials to build next-generation web 3D — compute-shader particles (millions), GPU simulations, node-based materials that compile to WGSL and GLSL, post-processing with the node pipeline, and graceful WebGL fallback. Use when a 3D site needs effects beyond WebGL limits, massive particle counts, GPU compute, or when the user asks for WebGPU/TSL.
license: MIT
category: 3d-webgl
---

# WebGPU & TSL for Next-Gen Web 3D

WebGPU unlocks **compute shaders** — millions of particles, fluid/cloth simulations, GPU culling —
while TSL lets you write shaders once in JavaScript that compile to WGSL (WebGPU) and GLSL (WebGL 2 fallback).

## Setup

```js
import * as THREE from "three/webgpu";          // WebGPU build (includes node materials)
import { color, uv, time, sin, positionLocal, mix, vec3, uniform, Fn, instanceIndex, storage, hash } from "three/tsl";

const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init();                          // required before first render/compute
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
// Automatically falls back to a WebGL 2 backend when WebGPU is unavailable.
```

Check `renderer.backend.isWebGPUBackend` to enable compute-heavy features only on WebGPU.

## TSL node materials

```js
const uProgress = uniform(0);                        // drive from scroll
const mat = new THREE.MeshStandardNodeMaterial();
const wave = sin(positionLocal.y.mul(6).add(time.mul(2))).mul(0.05).mul(uProgress);
mat.positionNode = positionLocal.add(vec3(wave, 0, wave));
mat.colorNode = mix(color("#1b1f3a"), color("#ff7a45"), uv().y.add(wave.mul(4)));
mat.roughnessNode = uProgress.oneMinus().mul(0.6).add(0.2);
```
- Nodes are composable functions: build a small library (`noise3`, `fresnel`, `dissolveMask`) and reuse them across materials.
- Update uniforms from JS each frame (`uProgress.value = damped`), never rebuild materials.

## Compute: a million particles

```js
const COUNT = 1_000_000;
const positions = storage(new THREE.StorageInstancedBufferAttribute(COUNT, 3), "vec3", COUNT);
const velocities = storage(new THREE.StorageInstancedBufferAttribute(COUNT, 3), "vec3", COUNT);

const init = Fn(() => {
  const p = positions.element(instanceIndex);
  p.assign(vec3(hash(instanceIndex), hash(instanceIndex.add(1)), hash(instanceIndex.add(2))).sub(0.5).mul(10));
})().compute(COUNT);

const update = Fn(() => {
  const p = positions.element(instanceIndex);
  const v = velocities.element(instanceIndex);
  // curl-noise flow + attraction to a target shape (sampled into another storage buffer)
  v.addAssign(p.negate().mul(0.0005));
  p.addAssign(v);
})().compute(COUNT);

await renderer.computeAsync(init);
renderer.setAnimationLoop(() => { renderer.compute(update); renderer.render(scene, camera); });
```
Render with `THREE.SpriteNodeMaterial` / `PointsNodeMaterial` reading `positions.toAttribute()`.

## Post-processing (node pipeline)

```js
import { pass, bloom } from "three/tsl";
const post = new THREE.PostProcessing(renderer);
const scenePass = pass(scene, camera);
post.outputNode = scenePass.add(bloom(scenePass, 0.8, 0.4, 0.85));
renderer.setAnimationLoop(() => post.render());
```

## Where WebGPU earns its keep on websites

- Particle morphs with 500k–5M points (logo → product → text) driven by scroll.
- GPU flocking/boids and fluid-like flow fields as living backgrounds.
- Instanced worlds (forests, cities) with GPU culling/LOD.
- Real-time procedural terrain for flyovers.

## Fallback strategy

1. WebGPU backend → full effect.
2. WebGL 2 backend (automatic) → same TSL materials, reduced counts (e.g. 100k particles via instancing, no compute).
3. No WebGL → poster video/image.
Detect tier at startup and pick counts accordingly; see `3d-web-performance`.

## Gotchas

- `await renderer.init()` before using `renderer.compute` or reading capabilities.
- Import from `three/webgpu` and `three/tsl` consistently — mixing with classic `three` materials breaks node compilation.
- Storage buffer sizes are fixed; allocate for the max tier and dispatch a smaller count on weaker devices.
- Safari/Firefox WebGPU support varies by version — always test the WebGL 2 fallback path.
