---
name: immersive-concept-director
title: Immersive Website Concept Director
description: Invent original, never-seen-before concepts for 3D / immersive / interactive websites before any code is written — a creative-direction process that turns a brand, product, or idea into a unique world metaphor, signature interaction, camera story, art direction, and sound, then maps it to buildable techniques. Use when the user wants a 3D or "wow" website, asks for creative ideas, says "make it unique / something nobody has seen", or before using the cinematic-scroll-3d-website skill.
license: MIT
category: 3d-webgl
---

# Immersive Website Concept Director

Most 3D sites look the same because they start from techniques ("let's add a floating blob").
Start from **meaning**: what world does this brand live in, and what does the visitor *do* there?

## Step 1 — Extract the essence (ask or infer)

Collect: brand/product, audience, the ONE feeling the visitor should leave with, 3 brand words,
real-world materials/places associated with it, and the conversion goal. If the user gave little
detail, infer boldly and state your assumptions.

## Step 2 — Generate world metaphors (divergent)

Produce **6 concepts** using different generators, each in 2–3 sentences:

1. **Literal-made-magical** – the product's real environment, heightened (a coffee brand → walk through a single roasting bean's interior as it cracks).
2. **Scale shift** – go microscopic or cosmic (a bank → money as a city seen from orbit, zoom to one street).
3. **Material transformation** – one substance becomes another as you scroll (sketch → clay → chrome → final product).
4. **Time travel** – scroll = time (a construction firm → a building assembles itself across 100 years).
5. **Impossible architecture** – Escher/Monument-Valley spaces the camera can traverse (a SaaS → rooms that reorganize like data).
6. **Inversion** – see the world from the product's POV (a running shoe's view of the city at 5 am).

Add one **wildcard** mixing two generators.

## Step 3 — Pick & sharpen (convergent)

Score each concept 1–5 on: *memorability, brand truth, buildability (time/budget), performance risk, conversion clarity*. Pick the winner and write:

- **Logline** (one sentence you could tweet).
- **Signature interaction** – the single thing people will screen-record (e.g., "your cursor is a light source; the product is only visible where you shine it").
- **Camera story** – 4–6 shots (establishing → journey → climax → resolve) with scroll percentages.
- **Art direction** – palette (5 hex), lighting mood, materials, typography pairing, reference artists/films (describe, don't copy).
- **Sound direction** – ambient bed + 3 interaction sounds (opt-in).
- **Copy beats** – ≤ 12 words each, one per shot.

## Step 4 — Map to techniques (make it buildable)

For each shot list the technique and the skill to use:

| Need | Technique | Skill |
|------|-----------|-------|
| Scroll-driven camera | CatmullRom rail + damping | `camera-flythrough-paths` |
| Chapters & text | pinned GSAP timelines | `scroll-storytelling-director`, `gsap-scrolltrigger` |
| Interiors | baked GLB + hotspots | `room-walkthrough-3d` |
| Transitions/materials | noise masks, particle morph, fresnel | `webgl-shader-effects` |
| Everything | budgets & fallbacks | `3d-web-performance` |
| Page shell | layout, type, UI polish | `frontend-design` |

## Step 5 — Output format

Deliver a **Concept Deck** in Markdown:

1. The 6 concepts + wildcard (short)
2. Scoring table
3. Winning concept: logline, signature interaction, shot list table, art direction, sound, copy
4. Technique map + asset list (models, textures, fonts, audio) + risks & fallbacks
5. A 2-week build plan (day-by-day milestones: prototype camera rail first, then look-dev, then content)

## Originality guardrails

- Ban list (unless reinvented): floating abstract blob, generic particle sphere, spinning product on black, laptop-in-space, stock "neural network" lines.
- Every concept must answer: *"Why could this only be for this brand?"*
- Prefer one deep idea over many effects. Restraint reads as premium.
