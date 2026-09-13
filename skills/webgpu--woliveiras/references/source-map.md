# Source map

Consulted: 2026-08-03. Recheck temporal claims before use.

| Source | Owner | Purpose | Authority | Dependent topics |
| --- | --- | --- | --- | --- |
| [WebGPU](https://www.w3.org/TR/webgpu/) | W3C GPU for the Web WG | API semantics, validation, resources, pipelines, canvas, errors | Normative Candidate Recommendation Draft | All raw API guidance |
| [WGSL](https://www.w3.org/TR/WGSL/) | W3C GPU for the Web WG | Shader language, layout, stages, uniformity | Normative | WGSL and CPU layout |
| [WebGPU CTS](https://github.com/gpuweb/cts) | GPU for the Web | Conformance cases and expected behavior | Official conformance | Testing and ambiguity resolution |
| [GPUWeb examples](https://github.com/gpuweb/gpuweb/tree/main/design) | GPU for the Web | Design context and official examples | Official explanatory | Architecture and API patterns |
| [MDN WebGPU API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API) | MDN | Practical API reference and browser tables | Secondary | Initialization and compatibility |
| [Chrome WebGPU](https://developer.chrome.com/docs/web-platform/webgpu/) | Google Chrome | Chromium platform status and diagnostics | Official browser | Chromium compatibility/debugging |
| [WebKit WebGPU](https://webkit.org/blog/14879/webgpu-now-available-for-testing-in-safari-technology-preview/) | WebKit | WebKit status | Official browser | Safari/WebKit compatibility |
| [Firefox WebGPU tracking](https://bugzilla.mozilla.org/show_bug.cgi?id=1602129) | Mozilla | Gecko implementation status | Official browser tracker | Firefox compatibility |
| [Dawn](https://dawn.googlesource.com/dawn) | Chromium project | Implementation diagnostics and native mapping | Reference implementation | Debugging only |
| [wgpu](https://github.com/gfx-rs/wgpu) | gfx-rs | Cross-platform implementation behavior | Reference implementation | Debugging/interoperability only |
| [Agent Skills specification](https://agentskills.io/specification) | Agent Skills project | Portable skill structure and frontmatter | Normative format | Packaging and progressive disclosure |
| [skills CLI](https://github.com/vercel-labs/skills) | Vercel Labs | Discovery and selective installation | Official tool | Distribution |

Community examples consulted for structure, not technical authority:
[webgpu-threejs-tsl](https://github.com/dgreenheck/webgpu-claude-skill/tree/main/skills/webgpu-threejs-tsl)
and [threejs-webgl](https://github.com/freshtechbro/claudedesignskills/tree/main/plugins/individual/threejs-webgl).
Their useful patterns were focused references and reusable templates. This skill does
not inherit their framework-specific scope, broad trigger descriptions, or undocumented
API assumptions.
