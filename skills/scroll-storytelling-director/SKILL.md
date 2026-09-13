---
name: scroll-storytelling-director
title: Scroll Storytelling Director
description: Direct scroll-driven narratives (scrollytelling) like a film editor — story structure, chapter pacing, pinned scenes, text reveal choreography, sticky visuals, data/story transitions, and GSAP ScrollTrigger timelines. Use for brand stories, product launches, editorial/long-form journalism pieces, annual reports, case studies, or any page where scrolling should unfold a story.
license: MIT
category: motion-animation
---

# Scroll Storytelling Director

You are the **director and editor**, not just the animator. Great scrollytelling is 70% story
structure and pacing, 30% animation. Work in this order: **Story → Beats → Pacing → Choreography → Code.**

## 1. Story structure (write this first)

Use a five-act arc and give every act ONE job:

1. **Hook (0–10%)** – a single striking image + one sentence. No UI noise.
2. **Tension (10–35%)** – the problem / the "before". Show, don't list.
3. **Journey (35–70%)** – the transformation; this is where the big visual moves live.
4. **Proof (70–90%)** – numbers, testimonials, product detail. Calm, readable, pinned.
5. **Resolution (90–100%)** – the "after" + CTA. Pull back, breathe, end on a clean frame.

Write each beat as: `beat | what the reader sees | what they read (≤ 18 words) | scroll length (vh)`.

## 2. Pacing rules

- **1 idea per viewport.** If a beat needs two sentences, it needs two beats.
- Reading beats: 80–120vh with the visual *held*. Motion beats: 150–300vh.
- Alternate intensity: big move → quiet read → big move. Constant motion = fatigue.
- The first real motion should happen within the first 30% of the first screen of scroll, or users assume the page is static.

## 3. Choreography patterns

| Pattern | Use | Implementation |
|--------|-----|----------------|
| **Sticky stage** | visual stays, text scrolls past | `position: sticky` graphic + steps; ScrollTrigger per step toggles state |
| **Pinned scrub** | scene animates exactly with scroll | `ScrollTrigger({ pin: true, scrub: 0.6, end: "+=200%" })` + timeline |
| **Scene swap** | chapter transitions | crossfade / clip-path wipe between stacked scenes at chapter boundaries |
| **Horizontal run** | timelines, galleries | pin section, translate track `x: -(track.scrollWidth - innerWidth)` with `scrub` |
| **Zoom-through** | macro → micro | scale a layer 1 → 12 while fading next layer in (the "Powers of Ten" move) |
| **Counter/data build** | proof beats | numbers tween with `snap`; charts draw with `strokeDashoffset` |

### Canonical GSAP timeline

```js
gsap.registerPlugin(ScrollTrigger, SplitText);
const tl = gsap.timeline({
  scrollTrigger: { trigger: "#journey", start: "top top", end: "+=250%", pin: true, scrub: 0.8, anticipatePin: 1 },
  defaults: { ease: "none" }, // scrubbed timelines: linear in time, shape with positions
});
tl.to(".stage", { "--reveal": 1 }, 0)
  .from(split.lines, { yPercent: 110, opacity: 0, stagger: 0.05, ease: "power3.out" }, 0.1)
  .to(".stage img", { scale: 1.25 }, 0)
  .to(split.lines, { yPercent: -110, opacity: 0, stagger: 0.03 }, 0.7); // exit before next beat
```

Rules: use one pinned timeline per chapter; position tweens with labels (`tl.addLabel("proof")`);
text **exits** before the next text **enters**; never let two headlines share the screen.

## 4. Typography in motion

- Reveal by **line** with masks (overflow hidden wrapper), 60–100ms stagger, `power3.out`, 0.6–0.9s (or scrubbed).
- Keep body text static and readable; animate only headlines/numbers.
- Max 3 type sizes on screen. Contrast ≥ 4.5:1 over imagery (add a scrim gradient).

## 5. Sound & haptics (optional, opt-in)

Ambient bed + one sound per chapter transition; always muted by default with a visible toggle.

## 6. Accessibility & robustness

- `prefers-reduced-motion`: disable scrub/pins, show each beat as a normal section with its final state.
- All story text is real DOM text, in order. The page must make sense with CSS/JS disabled.
- Keyboard: space/page-down should land on beats (use `snap` sparingly: `snap: { snapTo: "labels", duration: 0.4 }`).
- Mobile: shorten pins (`end: "+=150%"`), avoid horizontal runs longer than 4 panels, use `svh` units.
- Always call `ScrollTrigger.refresh()` after images/fonts load; set `invalidateOnRefresh: true` on size-dependent tweens.

## 7. Review checklist

- [ ] Beat sheet exists and each beat has one idea
- [ ] Intensity alternates; first motion is early
- [ ] No overlapping headlines; exits before entries
- [ ] Reverse scrolling looks intentional
- [ ] Reduced-motion + no-JS versions are complete stories
