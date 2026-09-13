# Context and canvas

## Creation

Call `canvas.getContext("webgl2", attributes)` and handle `null`. Request `"webgl"`
only for a real WebGL 1 path. Context attributes are requests with implementation
semantics; inspect `getContextAttributes()` when behavior depends on the result.
Choose alpha, premultiplied alpha, antialias, depth, stencil, preserve-drawing-buffer,
power preference, and desynchronized behavior only from product requirements and
current specification/support.

`preserveDrawingBuffer` can constrain implementation behavior; do not enable it as a
casual screenshot fix. Copy or capture at a defined point instead when possible.

## CSS size, drawing buffer, and viewport

CSS layout size and `canvas.width`/`height` are separate. Derive physical size from
observed CSS content size and an explicit capped device-pixel-ratio policy. Change the
drawing buffer only when dimensions differ, resize every size-dependent texture and
renderbuffer, recheck framebuffer completeness, then set `gl.viewport` for the target.

The viewport does not automatically track canvas changes. Set it for the default
framebuffer and for offscreen passes whose dimensions differ. Treat zero/hidden sizes
according to a pause or clamp policy.

`drawingBufferWidth`/`drawingBufferHeight` report actual buffer dimensions. Use them
for viewport/aspect computations when the implementation controls the exact size.

## Worker path

`OffscreenCanvas` and worker availability are temporal and context-dependent. Check
current support, transfer ownership once, keep DOM work on the main thread, and route
resize/input/lifecycle messages explicitly. Do not assume worker support from WebGL
support alone.
