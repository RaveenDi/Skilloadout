---
name: camera-flythrough-paths
title: Camera Fly-Through Paths
description: Design and implement buttery camera fly-throughs in Three.js / React Three Fiber — spline rails (CatmullRom), separate look-at curves, arc-length constant speed, banking, FOV speed effects, damping, and scroll-scrubbed or time-based playback. Use for tunnels, landscape flyovers, product orbits, "drone shot" intros, and any scroll-controlled camera movement.
license: MIT
category: 3d-webgl
---

# Camera Fly-Through Paths

The camera path is the single biggest factor in whether a 3D site feels cinematic or amateur.
This skill gives you a reusable **CameraRail** and the rules for designing paths.

## Core model

A shot = **position curve** + **target curve** + **timing** + **lens**.

```js
import * as THREE from "three";

export class CameraRail {
  constructor({ points, targets, tension = 0.5, closed = false }) {
    this.pos = new THREE.CatmullRomCurve3(points, closed, "centripetal", tension);
    this.look = new THREE.CatmullRomCurve3(targets, closed, "centripetal", tension);
    this.pos.arcLengthDivisions = 2000; // smoother getPointAt on long rails
    this._p = new THREE.Vector3();
    this._t = new THREE.Vector3();
    this._ahead = new THREE.Vector3();
  }
  // u: 0..1 along the rail (arc-length → constant speed)
  apply(camera, u, { bank = 0, fovBase = 45, fovKick = 0 } = {}) {
    u = THREE.MathUtils.clamp(u, 0, 1);
    this.pos.getPointAt(u, this._p);
    this.look.getPointAt(u, this._t);
    camera.position.copy(this._p);
    camera.lookAt(this._t);
    if (bank) {
      // bank into turns: compare tangent now vs slightly ahead
      const t0 = this.pos.getTangentAt(u);
      const t1 = this.pos.getTangentAt(Math.min(u + 0.01, 1));
      const turn = t0.clone().cross(t1).y; // + left, - right
      camera.rotateZ(THREE.MathUtils.clamp(-turn * bank * 40, -0.25, 0.25));
    }
    if (fovKick) {
      const speed = this.pos.getTangentAt(u).length();
      camera.fov = fovBase + fovKick * speed;
      camera.updateProjectionMatrix();
    }
  }
}
```

### Driving it from scroll (with damping)

```js
const rail = new CameraRail({ points: P, targets: T });
let target = 0, current = 0;
ScrollTrigger.create({ trigger: "#story", start: "top top", end: "bottom bottom", onUpdate: (s) => (target = s.progress) });
renderer.setAnimationLoop((_, dt = 1 / 60) => {
  current = THREE.MathUtils.damp(current, target, 3.5, dt); // λ 2–6: lower = floatier
  rail.apply(camera, current, { bank: 1 });
  renderer.render(scene, camera);
});
```

### Chapter remapping (holds + moves)

Scroll is linear; stories aren't. Remap global progress into rail progress with *holds*
so the camera rests while text is read:

```js
// [scrollStart, scrollEnd, railStart, railEnd]
const beats = [
  [0.00, 0.10, 0.00, 0.00], // hold on establishing shot
  [0.10, 0.40, 0.00, 0.45], // travel
  [0.40, 0.50, 0.45, 0.45], // hold — read feature copy
  [0.50, 1.00, 0.45, 1.00], // finale
];
const smooth = (x) => x * x * (3 - 2 * x);
export function remap(p) {
  for (const [a, b, r0, r1] of beats) if (p <= b) return r0 + (r1 - r0) * smooth((p - a) / (b - a || 1));
  return 1;
}
```

## Path design rules

1. **Author in the scene, not in code.** Place empties/nulls in Blender along the path (name them `cam_000…`, `tgt_000…`), export GLB, read their world positions at load. Designers can then iterate without touching JS.
2. **Targets lead the position.** Look slightly ahead along the path (or at the subject). A camera looking exactly along its tangent feels like a rollercoaster; one looking at a subject feels like film.
3. **5–12 keyframes** per rail; more produces wobble. Use `centripetal` Catmull-Rom to avoid loops/overshoot.
4. **Keep altitude changes gentle** and never pass through geometry — ray-test the sampled path during dev (`scripts/check-path.js` idea: sample 500 points, raycast against collision meshes, log hits).
5. **Speed = FOV + motion blur + parallax**, not raw velocity. Near objects passing by (pillars, particles, foliage) sell speed cheaply.
6. **Visualize while authoring:** draw the rail with `new THREE.Line(new THREE.BufferGeometry().setFromPoints(rail.pos.getSpacedPoints(400)))` plus small spheres for targets; toggle with `?debug`.

## Shot recipes

| Shot | Position curve | Target | Notes |
|------|---------------|--------|-------|
| Drone reveal | low → high, pulling back | fixed at subject | FOV 35→50, fog density ↓ |
| Tunnel dash | straight-ish tube, slight S | 3–5 units ahead on same curve | FOV kick, speed lines, bank 1.0 |
| Product orbit | circle (closed) radius r, y const | product center | `closed: true`, remap only 0→0.5 for 180° |
| Descent | helix down a shaft | shaft axis below camera | rotate slowly, light shafts |
| Room walk | eye-height 1.6 m, doorways | points of interest | see `room-walkthrough-3d` |
| Flyover | high altitude spline over terrain | ground ahead ~30% down | exaggerate terrain scale, atmospheric fog |

## R3F version

```jsx
function Rig({ rail }) {
  const scroll = useScroll(); // inside <ScrollControls pages={6} damping={0.25}>
  useFrame(({ camera }) => rail.apply(camera, remap(scroll.offset), { bank: 1 }));
  return null;
}
```

## Quality bar

- No jitter at any scroll speed (test with trackpad flicks and scrollbar drags).
- Reversing scroll plays the shot backwards cleanly (no one-shot tweens on the camera).
- Mobile: same rail, but lower `damp` λ (feels less laggy with touch momentum) and reduced effects.
