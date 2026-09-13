# Verify like a director (QA checklist)

Run the whole list before calling the build done. Every item below caught a
real defect at least once.

## 0. Static gates

- [ ] Type-check and lint pass.
- [ ] The cinematic is behind a feature flag; flag-off build is byte-identical
      to prod.
- [ ] No secrets in the tree (grep for `sk-or-`, `API_KEY=`, bearer tokens).

## 1. Console (stop-the-line)

- [ ] Zero WebGL/three.js errors or warnings on load and through a full
      scroll. The classic silent killer: `Precisions of uniform 'X' differ
      between VERTEX and FRAGMENT shaders` fails program validation and the
      mesh simply never draws, with everything else still working.
- [ ] No texture 404s you did not expect (depth maps may 404 by design if the
      luminance fallback is intended; know which it is).

## 2. Screenshot the MOMENTS (not even intervals)

- [ ] Intro after it settles (~2s after load).
- [ ] Each beat at its center (copy fully on).
- [ ] Each seam at mid-shatter (the transition IS the content).
- [ ] Every special element at entry, mid-life, and exit: for a terminal
      monitor, wait 6-7s inside its window so typing finishes before you
      screenshot.
- [ ] Pointer far-left vs far-right at the same scroll position (parallax
      proof; layers must visibly shear).
- [ ] The hand-off out of the cinematic into the page below.

## 3. Both scroll directions

- [ ] Scroll every seam DOWN and then UP. Scroll is a scrubber; a transition
      that only works forward is broken. Parameter-driven effects reverse for
      free; anything time-based one-way will fail here.

## 4. Legibility

- [ ] No two beats visible at once at any scroll position (opacity half-width
      under 0.5 * step).
- [ ] Copy readable over the brightest frame (vignette/scrim present).
- [ ] Scroll cue fades out within the first few percent of scroll.

## 5. Fallbacks

- [ ] prefers-reduced-motion renders the static hero, zero WebGL.
- [ ] Small touch viewport renders the static hero.
- [ ] Disable JS: the sr-only h1 and static content still make sense to a
      crawler.

## 6. Performance

- [ ] DPR capped at 2; loop pauses when tab hidden or canvas off-screen.
- [ ] Frame assets ~60-140KB, depth maps ~16-36KB, all WebP.
- [ ] No per-frame allocations in the tick (no new vectors/materials).
- [ ] Terminal CanvasTexture redraws throttled (every 4th frame, only while
      visible).

## 7. Preloader lifecycle

- [ ] On a cache-bypassed reload, the veil is visible at 0 percent BEFORE
      textures land, fills, gains its done class at N of N, and fades. Capture
      this with a navigation init-script that polls the veil's class and bar
      width every ~60ms into a window array, then read the array after load
      (on localhost the window is ~100ms; the poller is the only way to see
      it).
- [ ] Kill one frame URL: the veil still completes (errors count toward the
      total) instead of hanging.
- [ ] The veil covers EVERYTHING in the stage (copy, cue, vignette) while
      loading. If copy shows through, you have the stacking-context trap: an
      explicit z-index on the canvas host.

## 8. Exit handoff

- [ ] Handoff overlay opacity is 0 at mid-journey and 1 at journey end (read
      the inline style at both scroll positions, then screenshot the payoff
      beat: CTAs must stay legible over the dissolve).

## 9. Live demo

- [ ] Press the demo hotkey with the terminal on screen: command line types,
      bar animates, and the RESULT line shows numbers from a real network
      call (verify the request fired in the network log: this is the
      receipt).
- [ ] Hotkey does nothing while focus is in an input, while the terminal is
      off screen, and within the re-arm window.

## 10. Typeface

- [ ] COMPUTED font-family on a beat title is the display face (not the base
      family) and the font face status is "loaded" via `document.fonts`.
      Reading the CSS is not verification; the cascade trap is silent.

## 11. Gyro (mobile fallback)

- [ ] Under devtools mobile emulation (viewport `390x844x3,mobile,touch`):
      the static fallback mounts with ZERO canvases.
- [ ] Dispatch a synthetic DeviceOrientationEvent (beta/gamma): the bg
      transform moves in the expected direction with the expected x/y ratio.
      Assert the VECTOR, not the absolute settle (emulated rAF runs slow and
      repeat synthetic dispatches are unreliable through devtools bridges).
- [ ] prefers-reduced-motion: no listener, no transform.

## 12. Sound

- [ ] Toggle flips to the on state (a failed AudioContext build must leave it
      off), scroll with sound on produces no errors, second click mutes.

## 13. Chrome

- [ ] Nav background computed opacity is 0 at scroll 0 over the cinematic
      (scroll-aware transparency), solid after ~50px.
- [ ] Consent UI is a compact corner card, not a full-width bar over the
      payoff CTA.

## 14. Dev-environment sanity (when a change refuses to appear)

If an edited component keeps rendering its OLD compile through reloads,
restarts, and even a build-dir wipe, check IN THIS ORDER before touching the
code again:

1. A PWA service worker controlling the page (`navigator.serviceWorker
   .controller`): unregister it and clear caches; never register a SW in dev.
2. A stray lockfile in a PARENT directory making the bundler misinfer the
   workspace root (the dev log names the chosen root): remove it and set the
   bundler root explicitly for local dev.
3. Only then suspect your code.

## 15. Comparison audit (optional but powerful)

Spawn a fresh agent to screenshot YOUR build and a reference site at ~20
scroll steps each, then produce a fix list where every finding cites a
screenshot filename. Findings without a citation get discarded. This is how
"not actually 3D" and double-exposed text defects get caught.

## 16. Editorial-fusion page (Archetype B)

- Section outline probe: every section present, in order, expected heights.
- IO reveals: scroll the page once -- each `data-*` reveal fires ONCE; scroll
  back up -- nothing re-animates. Reduced-motion: all content visible with
  zero transitions.
- Hero panel: mouse-parallax relief moves on fine pointers; on emulated touch
  the static still fills the same box (no black panel -- black means <2 frames).
- Marquee: loops seamlessly (duplicate list, translateX(-50%)); frozen under
  reduced motion.
- Cinema break: parallax never reveals image edges at either scroll extreme.
- Terminal: run the ERROR path (API unreachable) and the SUCCESS path; verify
  the typed numbers are real API values, not scripted.
- Light section: readable in BOTH site themes (it is deliberately fixed).

## 17. True-mobile + CORS (dev-preview traps)

- Desktop windows floor at ~640-650px min-width -- "shrink the window" is NOT
  a 375 test. Use device emulation (`375x812x3,mobile,touch`), then assert
  `document.documentElement.scrollWidth === innerWidth` (the no-horizontal-
  overflow receipt) at top and bottom of page.
- If the live demo works via curl but fails in the browser: probe the CORS
  preflight (`curl -X OPTIONS <endpoint> -H "Origin: <dev-origin>" -H
  "Access-Control-Request-Method: POST"`). A 400 there with a 200 direct POST
  means the API allowlist lacks your dev-preview origin.
