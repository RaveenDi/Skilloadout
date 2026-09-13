'use client';

/**
 * depth-fly-engine.tsx (reference, verbatim from the shipped production build).
 *
 * Beyond the depth-displaced photoreal frames,
 * scroll fly-through, mouse parallax and explode-on-scroll shatter, this adds
 * the systems that make the journey feel CONTINUOUS and ALIVE instead of five
 * crossfading stills:
 *
 *  - Ember/data-mote particle field living in true 3D between the camera and
 *    the frames. It drifts, flickers, parallaxes at its own depth and bridges
 *    every frame transition so the world never "resets".
 *  - Warp light-streaks that punch radially outward exactly while a frame is
 *    shattering — the "flying through into the next scene" whoosh.
 *  - A LIVE terminal monitor floating in 3D during the gateway beat: a real
 *    product CLI session typing itself out on a CanvasTexture (scanlines,
 *    cyan bezel, idle float, near-plane mouse parallax) which then SHATTERS
 *    into ember shards on exit — the "monitors display real things / one
 *    explodes as you scroll to the next" brief. It also occupies the p60-p70
 *    band the comparison audit flagged as a pacing stall.
 *  - Cinematic camera language: a settle-in dolly on load, mouse banking
 *    (roll), and an idle micro-drift so the scene breathes when the cursor
 *    rests. Pointer velocity feeds an "energy" level that excites the embers
 *    and deepens the relief displacement.
 *
 * Depth: loads /cinematic/depthN.webp when present; until then it derives
 * depth from image luminance (glowing core/fire = near).
 *
 * RAW three.js, loaded via next/dynamic({ ssr:false }). PERF: DPR cap 2,
 * additive passes skip their draw when invisible, the CLI texture redraw is
 * throttled, and the loop pauses off-screen / tab hidden.
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type DepthFlyCanvasProps = {
  progressRef: React.MutableRefObject<number>;
  frames: string[];
  depths: string[];
  cool: string;
  hot: string;
  /**
   * Optional LIVE demo hook: when set, the in-scene terminal offers "press D"
   * and types the REAL result of a compression run into the 3D screen.
   */
  runDemo?: () => Promise<{ original_tokens: number; compressed_tokens: number; savings_pct: number }>;
};

const VERT = /* glsl */ `
  uniform sampler2D uColor;
  uniform sampler2D uDepth;
  uniform float uHasDepth;
  uniform float uDisplace;
  uniform float uParallax;
  uniform vec2 uMouse;
  uniform vec2 uCover;
  uniform float uZoom;
  uniform float uShatter;
  varying vec2 vUv;
  varying float vShatter;
  float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
  }
  void main() {
    vec2 uvC = (uv - 0.5) * uCover / uZoom + 0.5;
    vUv = uvC;
    float inside = step(0.0, uvC.x) * step(uvC.x, 1.0) * step(0.0, uvC.y) * step(uvC.y, 1.0);
    float d = uHasDepth > 0.5 ? texture2D(uDepth, clamp(uvC, 0.0, 1.0)).r
                              : lum(texture2D(uColor, clamp(uvC, 0.0, 1.0)).rgb);
    d *= inside;
    vec3 pos = position;
    pos.z += (d - 0.32) * uDisplace;                 // push near surfaces forward
    pos.xy += uMouse * (d - 0.32) * uParallax;        // depth-scaled parallax
    // Shatter: as this frame is left behind, break it into a grid of shards
    // that fly apart (outward + toward the camera) so the outgoing frame
    // explodes into fragments instead of a flat crossfade.
    vShatter = uShatter;
    if (uShatter > 0.001) {
      vec2 cell = floor(uv * vec2(7.0, 5.0));
      vec2 r = hash2(cell);
      float amt = uShatter * uShatter;               // ease-in burst
      pos.xy += (r - 0.5) * 2.0 * amt * 0.95;         // radial spread per shard
      pos.z += (0.5 + r.x * 0.9) * amt * 1.35;        // blast toward the camera
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;
const FRAG = /* glsl */ `
  precision mediump float;
  uniform sampler2D uColor;
  uniform float uOpacity;
  uniform vec3 uHot;
  varying vec2 vUv;
  varying float vShatter;
  void main() {
    if (vUv.x < 0.0 || vUv.x > 1.0 || vUv.y < 0.0 || vUv.y > 1.0) discard;
    vec3 c = texture2D(uColor, vUv).rgb;
    // Exploding shards glow hot (ember) as they fly apart.
    c = mix(c, c * 1.35 + uHot * 0.4, vShatter);
    gl_FragColor = vec4(c, uOpacity);
  }
`;

// --- Ember / data-mote field (additive points between camera and frames) ---
const PARTICLE_VERT = /* glsl */ `
  attribute vec3 aSeed;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uPixelRatio;
  varying vec3 vSeed;
  void main() {
    vSeed = aSeed;
    vec3 pos = position;
    pos.y = mod(pos.y + uTime * (0.025 + 0.06 * aSeed.x) + 1.7, 3.4) - 1.7;
    pos.x += sin(uTime * (0.3 + aSeed.y * 0.5) + aSeed.z * 6.2831) * 0.06;
    float near = (pos.z + 0.7) / 2.4;
    pos.xy += uMouse * near * 0.22;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (1.6 + aSeed.y * 4.2) * uPixelRatio * (2.4 / max(0.001, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`;
const PARTICLE_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uCool;
  uniform vec3 uHot;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uEnergy;
  varying vec3 vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.08, d);
    float isEmber = step(0.7, vSeed.z);
    vec3 c = mix(uCool, uHot, isEmber);
    float flicker = 0.65 + 0.35 * sin(uTime * (2.0 + vSeed.x * 3.0 + uEnergy * 3.0) + vSeed.y * 20.0);
    float a = disc * uOpacity * (0.35 + 0.45 * isEmber) * (1.0 + 0.8 * uEnergy);
    gl_FragColor = vec4(c * flicker, a);
  }
`;

// --- Warp streaks (screen-space, fire only during shatter transitions) ---
const STREAK_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const STREAK_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uWarp;
  uniform float uTime;
  uniform float uAspect;
  uniform vec3 uHot;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    p.x *= uAspect;
    float r = length(p);
    float ang = atan(p.y, p.x);
    float ray = pow(0.5 + 0.5 * sin(ang * 18.0 + uTime * 3.0), 14.0)
              + pow(0.5 + 0.5 * sin(ang * 31.0 - uTime * 2.2 + 1.7), 22.0);
    float mask = smoothstep(0.12, 1.15, r);
    float a = ray * mask * uWarp;
    vec3 c = mix(vec3(1.0), uHot, 0.45) * a;
    gl_FragColor = vec4(c, a * 0.85);
  }
`;

// --- Live CLI monitor (CanvasTexture screen that shatters on exit) ---
const CLI_VERT = /* glsl */ `
  uniform float uShatter;
  uniform vec2 uMouse;
  uniform float uTime;
  varying vec2 vUv;
  varying float vShatter;
  vec2 hash2(vec2 q) {
    return fract(sin(vec2(dot(q, vec2(127.1, 311.7)), dot(q, vec2(269.5, 183.3)))) * 43758.5453);
  }
  void main() {
    vUv = uv;
    vShatter = uShatter;
    vec3 pos = position;
    pos.y += sin(uTime * 0.8) * 0.012;
    pos.xy += uMouse * 0.11;
    if (uShatter > 0.001) {
      vec2 cell = floor(uv * vec2(10.0, 6.0));
      vec2 r = hash2(cell);
      float amt = uShatter * uShatter;
      pos.xy += (r - 0.5) * 2.0 * amt * 1.1;
      pos.z += (0.4 + r.x) * amt * 1.2;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;
const CLI_FRAG = /* glsl */ `
  precision mediump float;
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform vec3 uCool;
  uniform vec3 uHot;
  varying vec2 vUv;
  varying float vShatter;
  void main() {
    vec3 c = texture2D(uMap, vUv).rgb;
    c *= 0.93 + 0.07 * sin(vUv.y * 520.0);
    float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float rim = 1.0 - smoothstep(0.0, 0.02, edge);
    c = mix(c, uCool, rim * 0.8);
    c = mix(c, c * 1.4 + uHot * 0.5, vShatter);
    gl_FragColor = vec4(c, uOpacity);
  }
`;

type CliLine = { text: string; tone: 'cmd' | 'ok' | 'dim' | 'hot' | 'bar'; t0?: number };
const CLI_LINES: CliLine[] = [
  { text: '~ % npx gotcontext wrap claude', tone: 'cmd' },
  { text: '✓ gateway connected   api.gotcontext.ai/mcp', tone: 'ok' },
  { text: '✓ bearer key          gc_••••••••••••', tone: 'dim' },
  { text: '> compressing context  CLAUDE.md + 14 files', tone: 'cmd' },
  { text: 'BAR', tone: 'bar' },
  { text: '✓ 18,204 -> 9,038 tokens   saved 50.4%', tone: 'hot' },
  { text: '> tools ready  compression · code-intel · security · kb', tone: 'ok' },
];
const CLI_DEMO_HINT: CliLine = { text: 'press D  compress a real document, live', tone: 'dim' };
const CLI_CPS = 30; // typing speed (chars/sec)
const CLI_BAR_CHARS = 14; // "typing cost" charged to the progress-bar line

/**
 * Draws the live terminal session into the offscreen canvas. Lines type
 * sequentially on a virtual clock; a line's optional t0 (seconds on the
 * terminal clock) floors its start so lines appended later (the live demo)
 * type from the moment they were added instead of appearing pre-typed.
 */
function drawTerminal(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tSec: number,
  cool: string,
  hot: string,
  lines: CliLine[],
): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#081018');
  grad.addColorStop(1, '#04070c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // window chrome
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  ctx.fillRect(0, 0, w, 54);
  const dots = ['#ff5f57', '#febc2e', '#28c840'];
  dots.forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(34 + i * 30, 27, 8, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  });
  ctx.font = '500 20px Consolas, "Cascadia Mono", monospace';
  ctx.fillStyle = 'rgba(220,230,245,0.5)';
  ctx.fillText('gotcontext · live session', 130, 34);

  ctx.font = '500 26px Consolas, "Cascadia Mono", monospace';
  const lineH = 52;
  const padX = 40;
  let y = 116;
  let caretX = padX;
  let caretY = y;
  let clock = 0; // virtual typing clock (seconds)

  for (const line of lines) {
    const cost = line.tone === 'bar' ? CLI_BAR_CHARS : Math.max(1, line.text.length);
    const startT = Math.max(clock, line.t0 ?? 0);
    clock = startT + cost / CLI_CPS;
    const elapsed = tSec - startT;
    if (elapsed <= 0) {
      break;
    }
    const shown = Math.min(cost, Math.floor(elapsed * CLI_CPS));
    if (shown <= 0) {
      break;
    }
    if (line.tone === 'bar') {
      const barT = Math.min(1, Math.max(0, elapsed / 1.4));
      const bw = 560;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(padX + 34, y - 20, bw, 18);
      ctx.fillStyle = hot;
      ctx.fillRect(padX + 34, y - 20, bw * barT, 18);
      ctx.fillStyle = 'rgba(220,230,245,0.55)';
      ctx.fillText(`${Math.round(barT * 100)}%`, padX + 34 + bw + 18, y - 3);
      caretX = padX;
      caretY = y + lineH;
    } else {
      const text = line.text.slice(0, shown);
      ctx.fillStyle = line.tone === 'ok'
        ? cool
        : line.tone === 'hot'
          ? hot
          : line.tone === 'dim'
            ? 'rgba(210,220,235,0.55)'
            : '#e8eef4';
      ctx.fillText(text, padX, y);
      caretX = padX + ctx.measureText(text).width + 6;
      caretY = y;
    }
    y += lineH;
  }
  // blinking caret
  if (tSec % 1 < 0.55) {
    ctx.fillStyle = cool;
    ctx.fillRect(caretX, caretY - 22, 13, 26);
  }
}

function smooth01(x: number): number {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

export default function DepthFlyCanvas({ progressRef, frames, depths, cool, hot, runDemo }: DepthFlyCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  // Branded preloader: counts frame textures as they land so the intro never
  // shows a half-loaded scene on slow connections. Depth maps are excluded
  // (the luminance fallback covers them until they arrive).
  const [texLoaded, setTexLoaded] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }
    const width = () => mount.clientWidth || window.innerWidth;
    const height = () => mount.clientHeight || window.innerHeight;
    const n = frames.length;

    const scene = new THREE.Scene();
    const FOV = 45;
    const CAM_Z = 2.4;
    const camera = new THREE.PerspectiveCamera(FOV, width() / height(), 0.1, 100);
    camera.position.z = CAM_Z;
    scene.add(camera); // so the camera-attached warp layer renders

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width(), height());
    renderer.setClearColor(0x04060B, 1);
    mount.appendChild(renderer.domElement);

    const coolC = new THREE.Color(cool);
    const hotC = new THREE.Color(hot);

    const loader = new THREE.TextureLoader();
    const planeH = 2 * Math.tan((FOV / 2) * (Math.PI / 180)) * CAM_Z;
    const planeGeo = () => new THREE.PlaneGeometry(planeH * (width() / height()), planeH, 200, 120);

    const coverFor = (): [number, number] => {
      const pa = width() / height();
      const ta = 1; // frames are square
      return pa > ta ? [1, ta / pa] : [pa / ta, 1];
    };

    type Layer = { mesh: THREE.Mesh; mat: THREE.ShaderMaterial };
    const layers: Layer[] = [];
    for (let i = 0; i < n; i += 1) {
      const color = loader.load(frames[i]!, () => setTexLoaded(c => c + 1), undefined, () => setTexLoaded(c => c + 1));
      color.colorSpace = THREE.SRGBColorSpace;
      // max anisotropy keeps the 2K frames sharp at oblique/displaced angles
      color.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: color },
          uDepth: { value: null },
          uHasDepth: { value: 0 },
          uDisplace: { value: 0.6 },
          // Depth-scaled XY parallax. 0.85 tore the texture at depth edges
          // (near monitor pixels dragged ~0.6 world units against static
          // background pixels reads as screen tear). 0.4 + blurred depth maps
          // keeps the layered shift; the camera-position mouse response below
          // carries the true-3D read.
          uParallax: { value: 0.4 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uCover: { value: new THREE.Vector2(...coverFor()) },
          uZoom: { value: 1 },
          uOpacity: { value: i === 0 ? 1 : 0 },
          uShatter: { value: 0 },
          uHot: { value: hotC },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      // load the real depth map if/when it exists; else stay on luminance depth
      if (depths[i]) {
        loader.load(
          depths[i]!,
          (tex) => {
            mat.uniforms.uDepth!.value = tex;
            mat.uniforms.uHasDepth!.value = 1;
          },
          undefined,
          () => {},
        );
      }
      const mesh = new THREE.Mesh(planeGeo(), mat);
      mesh.renderOrder = i;
      scene.add(mesh);
      layers.push({ mesh, mat });
    }

    // --- ember / mote field ---
    const P_COUNT = 1300;
    const pPos = new Float32Array(P_COUNT * 3);
    const pSeed = new Float32Array(P_COUNT * 3);
    for (let i = 0; i < P_COUNT; i += 1) {
      pPos[i * 3] = (Math.random() - 0.5) * 5.0;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 3.4;
      pPos[i * 3 + 2] = -0.7 + Math.random() * 2.4;
      pSeed[i * 3] = Math.random();
      pSeed[i * 3 + 1] = Math.random();
      pSeed[i * 3 + 2] = Math.random();
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aSeed', new THREE.BufferAttribute(pSeed, 3));
    const pMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uCool: { value: coolC },
        uHot: { value: hotC },
        uOpacity: { value: 0 },
        uEnergy: { value: 0 },
      },
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(pGeo, pMat);
    points.renderOrder = 6;
    scene.add(points);

    // --- warp streak layer (camera-attached full-view quad) ---
    const streakMat = new THREE.ShaderMaterial({
      uniforms: {
        uWarp: { value: 0 },
        uTime: { value: 0 },
        uAspect: { value: width() / height() },
        uHot: { value: hotC },
      },
      vertexShader: STREAK_VERT,
      fragmentShader: STREAK_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const streakMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), streakMat);
    streakMesh.renderOrder = 9;
    streakMesh.position.z = -1.05;
    camera.add(streakMesh);
    const sizeStreak = () => {
      const hh = 2 * Math.tan((FOV / 2) * (Math.PI / 180)) * 1.05 * 1.4;
      streakMesh.scale.set(hh * (width() / height()), hh, 1);
      streakMat.uniforms.uAspect!.value = width() / height();
    };
    sizeStreak();

    // --- live CLI monitor ---
    const cliCanvas = document.createElement('canvas');
    cliCanvas.width = 1024;
    cliCanvas.height = 640;
    const cliCtx = cliCanvas.getContext('2d');
    const cliTex = new THREE.CanvasTexture(cliCanvas);
    cliTex.colorSpace = THREE.SRGBColorSpace;
    const cliMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: cliTex },
        uOpacity: { value: 0 },
        uShatter: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uTime: { value: 0 },
        uCool: { value: coolC },
        uHot: { value: hotC },
      },
      vertexShader: CLI_VERT,
      fragmentShader: CLI_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const cliMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9375, 20, 12), cliMat);
    cliMesh.renderOrder = 8;
    cliMesh.visible = false;
    scene.add(cliMesh);
    let cliTime = 0;
    let cliFrame = 0;
    let cliOpNow = 0;
    // LIVE demo state: pressing D while the terminal is on screen runs a real
    // compression via runDemo and types the actual result into the scene.
    let cliLines: CliLine[] = runDemo ? [...CLI_LINES, CLI_DEMO_HINT] : CLI_LINES;
    let demoRunning = false;
    let demoRearmAt = 0;
    const onDemoKey = (e: KeyboardEvent) => {
      if (!runDemo || (e.key !== 'd' && e.key !== 'D')) {
        return;
      }
      const tgt = e.target as HTMLElement | null;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) {
        return;
      }
      if (cliOpNow < 0.5 || demoRunning || cliTime < demoRearmAt) {
        return;
      }
      demoRunning = true;
      cliLines = [
        ...cliLines,
        { text: '~ % gotcontext compress ./architecture.md', tone: 'cmd', t0: cliTime },
        { text: 'BAR', tone: 'bar', t0: cliTime },
      ];
      runDemo()
        .then((r) => {
          const pct = r.savings_pct;
          cliLines = [
            ...cliLines,
            {
              text: `✓ ${r.original_tokens.toLocaleString('en-US')} -> ${r.compressed_tokens.toLocaleString('en-US')} tokens   saved ${pct.toFixed(1)}%  · live, just now`,
              tone: 'hot',
              t0: cliTime,
            },
          ];
        })
        .catch(() => {
          cliLines = [...cliLines, { text: 'x demo is busy  try the playground below', tone: 'dim', t0: cliTime }];
        })
        .finally(() => {
          demoRunning = false;
          demoRearmAt = cliTime + 6; // client-side throttle between runs
        });
    };
    window.addEventListener('keydown', onDemoKey);
    if (cliCtx) {
      drawTerminal(cliCtx, cliCanvas.width, cliCanvas.height, 0, cool, hot, cliLines);
      cliTex.needsUpdate = true;
    }

    const clock = new THREE.Clock();
    let eased = 0;
    let raf = 0;
    let running = false;
    let mx = 0;
    let my = 0;
    let tmx = 0;
    let tmy = 0;
    let lastT = 0;
    let energy = 0;
    let moveAccum = 0;
    let lastPX = 0;
    let lastPY = 0;
    const onPointerMove = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      tmx = ((e.clientX - r.left) / Math.max(r.width, 1)) * 2 - 1;
      tmy = -(((e.clientY - r.top) / Math.max(r.height, 1)) * 2 - 1);
      moveAccum += Math.abs(e.clientX - lastPX) + Math.abs(e.clientY - lastPY);
      lastPX = e.clientX;
      lastPY = e.clientY;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const step = 1 / Math.max(n - 1, 1);
    const tick = () => {
      const t = clock.getElapsedTime();
      const dt = Math.min(0.05, t - lastT);
      lastT = t;
      eased += (progressRef.current - eased) * 0.09;
      mx += (tmx - mx) * 0.06;
      my += (tmy - my) * 0.06;
      // pointer "energy": excites embers + relief while the cursor moves
      energy = Math.min(1.2, energy * 0.93 + moveAccum * 0.0035);
      moveAccum = 0;
      const p = Math.min(Math.max(eased, 0), 1);
      const intro = smooth01(t / 1.6); // settle-in dolly on load

      // cinematic camera: dolly + banking + idle micro-drift. The mouse gain
      // here is the TRUE parallax cue: moving the camera against the
      // z-displaced relief produces view-dependent depth without stretching
      // the texture (unlike the in-shader XY shift, which tears at edges).
      camera.position.z = CAM_Z - p * 0.35 + (1 - intro) * 0.4;
      camera.position.x = mx * 0.11 + Math.sin(t * 0.37) * 0.018;
      camera.position.y = my * 0.08 + Math.cos(t * 0.29) * 0.012;
      camera.rotation.z = -mx * 0.045;

      // per-leg camera grammar: each transit gets its own move. sin(pi*x) arcs
      // are zero at both beat centers, so legs hand off with no pop and reverse
      // scrubbing stays exact (seam velocity law).
      const legJ = p / step;
      const leg = Math.min(n - 2, Math.floor(legJ));
      const legX = Math.min(1, Math.max(0, legJ - leg));
      const legArc = Math.sin(Math.PI * legX);
      let legYaw = 0;
      if (leg === 0) {
        camera.position.x += legArc * 0.13; // lateral track through the data hall
      } else if (leg === 1) {
        camera.position.z -= legArc * 0.14; // push-in toward the core
      } else if (leg === 2) {
        camera.position.y += legArc * 0.09; // rise over the gateway
      } else {
        legYaw = legArc * 0.06; // half-orbit hint into the reactor payoff
        camera.position.x -= legArc * 0.1;
      }
      camera.rotation.y = legYaw;

      let maxShatter = 0;
      for (let i = 0; i < n; i += 1) {
        const c = i * step;
        const dist = Math.abs(p - c);
        const op = Math.max(0, 1 - dist / step);
        const local = Math.min(1, Math.max(0, (p - (c - step)) / (2 * step)));
        const L = layers[i]!;
        L.mat.uniforms.uOpacity!.value = op * (i === 0 ? 0.15 + 0.85 * intro : 1);
        L.mat.uniforms.uZoom!.value = 1 + local * 0.28; // fly-in zoom per frame
        L.mat.uniforms.uMouse!.value.set(mx, my);
        L.mat.uniforms.uDisplace!.value = 0.6 + energy * 0.12;
        // Explode-on-scroll: once the camera moves PAST this frame's center
        // toward the next, the frame shatters apart as it fades out. The
        // incoming frame (exit < 0) flies in intact.
        const exit = (p - c) / step;
        const shatter = Math.min(1, Math.max(0, (exit - 0.12) / 0.6));
        L.mat.uniforms.uShatter!.value = shatter;
        if (op > 0.02) {
          maxShatter = Math.max(maxShatter, shatter);
        }
        L.mesh.visible = op > 0.002;
      }

      // live CLI monitor: flies in after the fire beat, types the session,
      // then explodes out before the finale (fills the audit's pacing stall).
      const cliIn = smooth01((p - 0.5) / 0.06);
      const cliOut = 1 - smooth01((p - 0.755) / 0.045);
      const cliOp = Math.min(cliIn, cliOut);
      const cliShatter = smooth01((p - 0.75) / 0.05);
      cliOpNow = cliOp; // exposed to the D-key live-demo handler

      // ember field — calmed while the terminal plays so the screen reads crisp
      pMat.uniforms.uTime!.value = t;
      pMat.uniforms.uMouse!.value.set(mx, my);
      pMat.uniforms.uOpacity!.value = intro * (1 - 0.65 * cliOp);
      pMat.uniforms.uEnergy!.value = energy;
      if (cliOp > 0.02 || cliShatter > 0.001) {
        cliMesh.visible = true;
        cliTime += dt;
        const entry = smooth01((p - 0.5) / 0.1);
        const aspect = width() / height();
        const xBase = 0.42 + 0.22 * Math.min(1, Math.max(0, aspect - 1));
        cliMesh.position.set(xBase, 0.05 - (1 - entry) * 0.15, 0.35 - (1 - entry) * 0.8);
        cliMesh.rotation.y = -0.3 - (1 - entry) * 0.2;
        cliMat.uniforms.uOpacity!.value = cliOp;
        cliMat.uniforms.uShatter!.value = cliShatter;
        cliMat.uniforms.uMouse!.value.set(mx, my);
        cliMat.uniforms.uTime!.value = t;
        cliFrame += 1;
        if (cliCtx && cliFrame % 4 === 0) {
          drawTerminal(cliCtx, cliCanvas.width, cliCanvas.height, cliTime, cool, hot, cliLines);
          cliTex.needsUpdate = true;
        }
      } else {
        cliMesh.visible = false;
      }
      maxShatter = Math.max(maxShatter, cliShatter);

      // warp streaks peak mid-shatter — the punch-through whoosh (damped while
      // the terminal is on screen so its glare defers to the product moment)
      const warp = maxShatter * (1 - maxShatter) * 4 * (1 - 0.5 * cliOp);
      streakMat.uniforms.uWarp!.value = warp;
      streakMat.uniforms.uTime!.value = t;
      streakMesh.visible = warp > 0.02;

      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    };
    const start = () => {
      if (!running) {
        running = true;
        clock.start();
        raf = window.requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      running = false;
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onResize = () => {
      camera.aspect = width() / height();
      camera.updateProjectionMatrix();
      renderer.setSize(width(), height());
      const cover = coverFor();
      for (let i = 0; i < layers.length; i += 1) {
        const L = layers[i]!;
        L.mesh.geometry.dispose();
        L.mesh.geometry = planeGeo();
        L.mat.uniforms.uCover!.value.set(cover[0], cover[1]);
      }
      sizeStreak();
    };
    window.addEventListener('resize', onResize, { passive: true });

    const io = new IntersectionObserver(([e]) => (e?.isIntersecting && document.visibilityState === 'visible' ? start() : stop()), { threshold: 0 });
    io.observe(mount);
    const onVis = () => (document.visibilityState === 'visible' ? start() : stop());
    document.addEventListener('visibilitychange', onVis);
    start();

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('keydown', onDemoKey);
      for (let i = 0; i < layers.length; i += 1) {
        layers[i]!.mesh.geometry.dispose();
        layers[i]!.mat.dispose();
      }
      pGeo.dispose();
      pMat.dispose();
      streakMesh.geometry.dispose();
      streakMat.dispose();
      cliMesh.geometry.dispose();
      cliMat.dispose();
      cliTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [frames, depths, cool, hot, progressRef, runDemo]);

  const loaderDone = texLoaded >= frames.length;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }} aria-hidden="true">
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div className={`gc-cine-loader${loaderDone ? ' is-done' : ''}`}>
        <div className="gc-cine-loader-mark">gotcontext</div>
        <div className="gc-cine-loader-bar">
          <div
            className="gc-cine-loader-fill"
            style={{ width: `${Math.round((Math.min(texLoaded, frames.length) / frames.length) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
