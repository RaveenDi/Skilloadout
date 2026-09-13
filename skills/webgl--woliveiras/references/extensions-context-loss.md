# Extensions and context loss

## Extension discipline

Centralize `getExtension(name)` calls and expose typed capability results. Absence is
a normal branch. Consult the Khronos WebGL Extension Registry for normative behavior,
and distinguish WebGL 1 extensions from functionality promoted to WebGL 2 core. Do
not call extension-suffixed methods when using the corresponding WebGL 2 core method.

For every optional extension, define: requesting version(s), returned object/API,
dependent formats/functions/limits, fallback or unsupported behavior, and tests with
the extension absent. Never infer universal support from one browser/GPU.

## Loss and restoration state machine

On `webglcontextlost`:

1. Call `event.preventDefault()` when restoration is desired.
2. Stop scheduling and issuing rendering work.
3. Mark all WebGL object handles invalid; do not delete or use them as if live.
4. Keep CPU-side descriptors/data needed to reconstruct resources.
5. Surface a non-spamming loading/fallback state.

On `webglcontextrestored`:

1. Re-query context capabilities, extensions, and limits.
2. Recompile/link programs and recreate VAOs, buffers, textures, samplers,
   framebuffers, renderbuffers, queries, and other state.
3. Re-upload source data, reset all pass state, resize, and only then restart the loop.

Restoration does not preserve GPU resources or state. Build resource factories from
CPU descriptors so the same deterministic path handles startup and restore. Use
`WEBGL_lose_context` in controlled tests when available; never depend on it in product
logic.
