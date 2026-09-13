# Initialization and canvas

## Deterministic sequence

1. Require a secure context and test `navigator.gpu`.
2. Call `requestAdapter({ powerPreference })` only when product policy justifies a
   preference. Treat `null` as a supported failure path. Do not assume a fallback
   adapter property or adapter identity information is available.
3. Read `adapter.features` and `adapter.limits`. Request only features actually used
   and limits the application requires, clamped to verified needs. Device creation
   may reject unsupported requirements.
4. Attach a `device.lost` handler immediately after creation. Add an
   `uncapturederror` listener for surfaced validation/out-of-memory/internal errors.
5. Acquire `canvas.getContext("webgpu")`; handle `null`.
6. Use `navigator.gpu.getPreferredCanvasFormat()` unless a verified format contract
   requires another choice. Configure the context with device, format, `alphaMode`,
   and only required usage/view formats/color-space options supported by current API.

`GPUCanvasConfiguration.alphaMode` changes compositing semantics. Choose `opaque` only
when transparency is not required; otherwise validate premultiplication expectations.

## Resize

Read CSS content size from layout/ResizeObserver. Compute physical width and height
from an explicitly capped pixel ratio and implementation limits. Update canvas
dimensions only when they change. Current canvas textures are acquired per frame;
recreate all application-owned size-dependent depth, MSAA, intermediate, storage, and
readback textures and rebuild their views/bind groups.

Avoid zero dimensions while hidden. Pause or clamp according to product behavior.
Configuration and size-dependent attachment updates must happen before encoding a
pass that uses the new size.

## Error scopes and loss

Push an error scope immediately before a suspect operation, pop it after the operation
has been issued, and await the result. Scopes are diagnostic/control boundaries, not a
replacement for correct validation.

On device loss, stop new encoding/submission, reject or drain application work,
discard every object created from that device, and either re-run initialization and
rebuild from CPU descriptors or transition to fallback/terminal UI. A recovered
device does not resurrect old resources.
