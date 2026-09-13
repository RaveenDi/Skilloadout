---
name: room-walkthrough-3d
title: 3D Room & Interior Walkthroughs
description: Create photoreal-feeling interior/room walkthroughs on the web — real-estate tours, showrooms, museums, virtual offices — with baked lighting GLBs, eye-height camera rails or click-to-move navigation, hotspots/annotations, portals between rooms, and mobile-safe performance. Use when the user asks for a room walkthrough, virtual tour, interior visualization, 3D showroom, or museum/gallery on the web.
license: MIT
category: 3d-webgl
---

# 3D Room & Interior Walkthroughs

Interiors look fake for three reasons: flat lighting, wrong scale, and robotic camera motion.
Fix those three and a walkthrough feels like a real place.

## 1. Asset pipeline (Blender → web)

1. **Model to real-world scale** (1 unit = 1 m). Door height ~2.1 m, eye height 1.6 m.
2. **Bake lighting**: Cycles bake of combined/diffuse lighting into a *lightmap* (UV2) or bake full textures for static rooms. Baked GI is the #1 realism win and costs nothing at runtime.
3. **Export GLB** with Draco or Meshopt compression; textures to **KTX2 (Basis/UASTC for normals, ETC1S for albedo)**. Target < 10 MB per room, lazy-load adjacent rooms.
4. Keep separate: `room_static.glb` (baked), `props_interactive.glb` (PBR, real-time lit), `nav.glb` (floor collision mesh + camera nodes + hotspot empties).

```js
const gltf = await loader.loadAsync("/rooms/living.glb"); // GLTFLoader + DRACOLoader + KTX2Loader
gltf.scene.traverse((o) => {
  if (o.isMesh && o.material.map) o.material.map.colorSpace = THREE.SRGBColorSpace;
  if (o.isMesh && o.userData.lightmap) {
    o.material.lightMap = lightmaps[o.userData.lightmap];
    o.material.lightMapIntensity = 1.0;
  }
});
```

## 2. Lighting & look

- Baked lightmap + one `RoomEnvironment`/HDRI for reflections (`scene.environment`), low intensity.
- `ACESFilmicToneMapping` (or AgX), exposure ~1.0; SSAO only if not baked; subtle bloom on windows/lamps.
- Add **window light volume**: a soft additive plane with a noise shader gives visible light shafts.
- Color grade with a LUT pass for a consistent "photographed" feel.

## 3. Navigation modes (choose per project)

| Mode | Best for | How |
|------|----------|-----|
| **Scroll rail** | Storytelling tours, marketing | eye-height CatmullRom rail through doorways (see `camera-flythrough-paths`), holds at points of interest |
| **Hotspot jumps** | Real-estate, museums | click floor marker → tween camera (GSAP, 1.2–1.8s, `power2.inOut`) to predefined viewpoint; look-around with damped pointer |
| **Free walk** | Games, configurators | pointer-lock/WASD or joystick on mobile; capsule collision against `nav.glb` (three-mesh-bvh) |

Look-around (hotspot mode): yaw/pitch from pointer delta, damped, pitch clamped to ±35°; never roll.

## 4. Hotspots & annotations

- Hotspot empties in Blender named `hs_<id>`; read positions; render HTML labels with CSS2DRenderer (or drei `<Html occlude>`), so text stays crisp and accessible.
- Project to screen each frame; fade by distance and by occlusion (raycast or depth test).
- Each hotspot opens a side panel with real HTML (price, materials, dimensions, CTA).

## 5. Portals between rooms

- Doorway = portal: when camera passes the threshold plane, swap `activeRoom`, dispose previous room's textures after 2 rooms of distance.
- For stylized transitions: render next room into a render target visible through the doorway (stencil or `MeshPortalMaterial` in drei).

## 6. Performance budget

- ≤ 100 draw calls per room (merge static meshes by material; instance chairs/books/plants).
- Textures ≤ 2K on desktop, 1K on mobile (serve variant by `renderer.capabilities` / device memory).
- DPR cap 1.5; pause rendering when nothing changes (hotspot mode) — render on demand.

## 7. UX details that sell realism

- Head-bob: none (nauseating) — instead micro "breathing" drift of 1–2 cm at 0.2 Hz when idle.
- Camera near plane 0.05 to avoid clipping furniture; FOV 55–65 for interiors (wider feels bigger but distorts).
- Footstep-free but add subtle room tone audio (opt-in).
- Minimap / floorplan with the current room highlighted.

## Deliverables checklist

- [ ] Real-scale, baked GLBs with KTX2 + Draco/Meshopt
- [ ] Navigation mode implemented + keyboard accessible
- [ ] Hotspots as HTML with occlusion
- [ ] Room streaming + disposal
- [ ] Mobile budget met (test on a mid-range Android)
