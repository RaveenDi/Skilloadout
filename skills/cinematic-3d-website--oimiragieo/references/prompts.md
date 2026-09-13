# Prompt templates

## Art-direction still (one paragraph per frame)

Structure every frame prompt the same way so a sequence reads as one journey:

```
Cinematic photoreal [WIDE / MEDIUM / CLOSE] shot, [CAMERA POSITION AND HEIGHT],
inside [THE WORLD: a vast dark data hall / a monolithic server core / an
obsidian canyon of machines]. Subject: [THE ONE THING THIS FRAME IS ABOUT].
Lighting: volumetric [COOL COLOR] key light from [DIRECTION], ember glow of
[HOT COLOR] rising from [SOURCE], deep black shadows, atmospheric haze.
Palette locked to [COOL HEX] and [HOT HEX] on near-black. Lens: [24mm wide /
50mm natural / 85mm compressed], f/2.8, cinematic depth of field.
Photoreal, 8k detail, film grain subtle. No text, no watermark, no people.
```

Rules that survived production:

- One subject per frame. Two subjects read as a collage, not a shot.
- Name the camera height and distance. "Low angle, camera 1m off the floor,
  subject towering" produces depth a generic prompt never does.
- Lock the palette by hex in EVERY prompt or frame 3 will drift teal.
- For frame N+1, restate the world of frame N in one clause ("continuing
  deeper into the same dark data hall...") so the journey is continuous.
- Ban text in the image; real UI text comes from the CanvasTexture terminal,
  which stays crisp and is honest.

## Journey arc (5 frames that tell a story)

1. The world at rest, wide establishing, the problem implied by scale.
2. Descend toward the mechanism, medium shot, first motion cue.
3. The core, close and hot, the transformation moment.
4. The product surface, the terminal lives here (frame stays calmer so the
   in-scene monitor reads).
5. The open payoff, wide again, brighter, room for the CTA copy.

## Depth-map prompt (image to image)

```
Output ONLY a precise grayscale DEPTH MAP of this exact image with the same
framing and composition. The nearest surfaces to the camera must be pure
white, the farthest background pure black, with a smooth continuous gradient
in between. Grayscale only, no colour, no text, no labels.
```

Reject and regenerate when: the map is inverted (background white), the model
re-rendered the scene instead of mapping it, or hard banding replaces the
gradient.

## Camera grammar by concept (choose the move per beat)

| Concept of the beat | Camera move |
|---|---|
| Product hero, luxury object | Slow half-orbit around the subject |
| Industrial scale, infrastructure | Low lateral track with foreground parallax |
| Descent into a mechanism | Push-in dolly with slight downward tilt |
| Reveal, arrival, payoff | Rise-and-reveal, then a settling descent |
| Live product moment (terminal) | Hold nearly static; let the screen act |

In the realtime engine these map to: orbit = slow rotation.y sweep, track =
x-position ramp, push-in = z dolly, rise = y ramp + tilt. Keep every move a
pure function of scroll progress so reverse scrubbing stays correct.
