---
name: 3d-product-configurator
title: 3D Product Configurator & Showcase
description: Build premium 3D product configurators and showcases on the web — material/color/part swapping, exploded views, hotspot feature callouts, AR (model-viewer / WebXR) handoff, studio lighting, screenshot/share, and pricing state — in Three.js or React Three Fiber. Use for e-commerce product pages, car/furniture/sneaker/watch configurators, hardware launches and "spin the product" hero sections.
license: MIT
category: 3d-webgl
---

# 3D Product Configurator & Showcase

A configurator has two jobs: make the product look *better than a photo*, and make choices
feel instant. Design the state model first, then the look, then the motion.

## 1. State model (source of truth outside the 3D scene)

```ts
type Config = { color: "graphite" | "silver" | "sand"; strap: "leather" | "steel"; engraving?: string };
type Option = { id: string; label: string; price: number; swatch: string; apply: (scene: SceneRefs) => void };
```
- Keep config in a store (zustand/URL params) — the scene *renders* the config; UI never mutates meshes directly.
- Serialize to the URL (`?color=sand&strap=steel`) so every configuration is shareable and SEO-crawlable.
- Price and availability are computed from config, never from the scene.

## 2. Asset preparation

- One GLB per product with **named nodes per swappable part** (`part_strap_leather`, `part_strap_steel`) and **named materials** (`mat_body`, `mat_glass`).
- Variants: use the `KHR_materials_variants` glTF extension (Blender exporter supports it) — switch variants without reloading.
- Bake AO; keep normal maps; KTX2 textures; Meshopt. Hero products may justify 2K textures on desktop only.

## 3. Studio look

- **Lighting:** HDRI studio environment (`scene.environment`, low-res PMREM) + 1 key directional for crisp shadows + optional rim light. Tone map ACES/AgX, exposure ≈ 1.
- **Ground:** contact shadows (drei `<ContactShadows>` or baked shadow plane) — floating products look fake.
- **Materials:** `MeshPhysicalMaterial` — clearcoat for paint, sheen for fabric, transmission for glass (one object max), anisotropy for brushed metal.
- **Background:** soft radial gradient matching brand color; subtle reflection floor for luxury goods.

## 4. Interactions

| Interaction | Implementation |
|-------------|----------------|
| Orbit | damped OrbitControls, limited polar angle, auto-rotate at 0.3 when idle, min/max distance |
| Swap color | tween material color in linear space over 300–500ms (`color.lerpColors`) |
| Swap part | crossfade opacity or scale-pop (0.96 → 1) the incoming part; preload all variants |
| Exploded view | per-part offset vectors authored as empties; tween `position = base + offset * t` |
| Hotspots | HTML annotations (drei `<Html occlude>`); clicking flies camera to a preset view |
| Camera presets | "front / side / detail" buttons; GSAP tween of camera + controls.target together |
| Screenshot/share | `renderer.domElement.toBlob()` after a render with `preserveDrawingBuffer` only for that frame |
| AR | `<model-viewer ar ios-src="product.usdz">` handoff button on mobile; WebXR on Android |

## 5. Performance & UX rules

- First interaction < 3 s on 4G: show a poster image immediately, stream the GLB, fade in.
- Instant swaps: all variants preloaded after first render (idle callback).
- Render on demand: only render when controls move or a tween runs.
- Keep the configurator usable without WebGL: swatches still update a photo gallery.
- Accessibility: every option is a real `<button>`/radio with labels; announce price changes (`aria-live`).

## 6. Scroll showcase mode (hero sections)

Combine with `cinematic-scroll-3d-website`: pin the product, scrub a timeline that rotates it, explodes parts at the feature section, swaps materials at the "colors" beat, and ends on the configurator with state preserved.

## Checklist

- [ ] Config store + URL sync + computed price
- [ ] Named parts/materials + KHR_materials_variants
- [ ] Studio lighting, contact shadows, physical materials
- [ ] Orbit limits, camera presets, hotspots, exploded view
- [ ] Poster → streamed GLB, preloaded variants, render on demand
- [ ] AR handoff, screenshot/share, accessible controls
