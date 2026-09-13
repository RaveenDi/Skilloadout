# Study a reference site (repeatable procedure)

Before fusing another site's layout language into your cinematic build, study it
LIVE with instrumentation — never from memory or screenshots someone else took.
The output is a written study doc that (a) proves what the reference actually
does technically, (b) maps its section system, and (c) names which principles
transfer and which your stack already beats. ~20 minutes with a DevTools MCP.

## 1. Screenshot ladder

Open the site at 1440x900. Screenshot the hero, then scroll in ~1100-1300px
steps, screenshotting each stop until the footer. Wait ~700ms after each
scroll (entrance animations need settle time). Read every capture — the
ladder IS the layout map.

```js
// scroll step (evaluate_script), then screenshot in the ADJACENT call:
() => { window.scrollTo({ top: N, behavior: 'instant' });
        return new Promise(r => setTimeout(() => r(scrollY), 700)); }
```

## 2. Tech probe (one call answers "how do they do it")

```js
() => {
  const canvases = [...document.querySelectorAll('canvas')].length;
  const videos = [...document.querySelectorAll('video')].length;
  const libs = ['THREE','gsap','ScrollTrigger','Lenis','lottie','PIXI','Rive']
    .filter(k => k in window);
  const svgAnim = document.querySelectorAll('svg animate, svg animateTransform').length;
  const keyframes = [...document.styleSheets].map(s => {
    try { return [...s.cssRules].filter(r => r.type === 7).map(r => r.name); }
    catch { return []; } }).flat();
  const body = getComputedStyle(document.body);
  const fonts = new Set();
  document.querySelectorAll('h1,h2,p,a,button').forEach(el => {
    if (fonts.size < 12) fonts.add(getComputedStyle(el).fontFamily.split(',')[0]); });
  return JSON.stringify({ canvases, videos, libs, svgAnim,
    keyframes: [...new Set(keyframes)].slice(0, 40),
    bg: body.backgroundColor, color: body.color,
    scrollH: document.documentElement.scrollHeight, fonts: [...fonts] });
}
```

What each field tells you: `canvases`/`videos`/`libs` = whether the "expensive"
feel is real runtime 3D or not; `keyframes` names = their animation SYSTEM
(one orchestrated entrance per section shows up as section-named keyframes);
`bg`/`color`/`fonts` = the token base; `scrollH` = total page scale.

## 3. Section outline probe

```js
() => JSON.stringify([...document.querySelectorAll('section, main > div')]
  .map(s => { const r = s.getBoundingClientRect();
    const h = s.querySelector('h1,h2,h3');
    return { cls: (s.className||'').toString().slice(0,60),
      top: Math.round(r.top + scrollY), h: Math.round(r.height),
      head: h ? h.textContent.trim().slice(0,60) : null,
      bg: getComputedStyle(s).backgroundColor }; })
  .filter(x => x.h > 200))
```

Also count `position: sticky` elements and sample `img` sources (pre-rendered
stills routed through an image CDN are a tell that "3D" moments are baked).

## 4. Write the study doc

Sections: headline finding (what they do NOT use is often the insight) ·
design tokens table · named keyframes + the pattern they imply ·
section-by-section map with heights · transferable principles ·
"what our stack does that theirs cannot".

## Worked example: what the factory.ai-class of sites revealed (2026)

- **Zero WebGL, zero video, zero animation libraries.** The entire premium
  feel: CSS keyframes + IntersectionObserver reveals + a handful of SVG
  `<animate>` sweeps + pre-rendered photographic stills via next/image.
  The craft is typography and layout discipline, not runtime 3D.
- Near-black base (#020202), ALL body copy in a monospace face, display face
  reserved for headlines. Instant "engineering-grade" register.
- **Eyebrow spine**: every section opens `● SECTION-NAME` in mono uppercase.
- **One accent color, spent only where data lives** (charts, progress ticks,
  status dots) — never on chrome.
- **Product-as-hero-art**: a dense window-chromed product mock bleeding off
  the hero's right edge beats abstract art.
- **Zig-zag rows**: left copy / right REAL product panel, alternating sides.
- **Contrast inversions as rhythm**: exactly 2 light sections in ~14 dark.
- **Terminal-as-cinema**: a full-width TUI mock with progress bars and a
  keyboard-hint footer.
- **Settle discipline**: one entrance cinematic per section, then stillness;
  perpetual motion reserved for cursor-blink / radar-sweep only. This is what
  makes `prefers-reduced-motion` compliance nearly free.
- Their layout system + your WebGL relief/live-demo stack = a page neither
  could ship alone. That fusion is `editorial-fusion-template.tsx`.
