# Textures and framebuffers

## Texture completeness

Track active texture unit separately from the binding on each target. Allocate with
format/internal-format/type combinations valid for the WebGL version and required
extensions. In WebGL 2, prefer sized internal formats where the API requires or
benefits from them; do not assume color-renderability or filterability from storage
alone.

A black texture investigation checks: load/CORS/decode completion; correct unit and
sampler uniform; target binding; dimensions; format/type; mip completeness; min/mag
filters; wrap rules; WebGL 1 NPOT restrictions; unpack alignment/flip/premultiplied
state; color-space/alpha semantics; and shader coordinates/output.

Pixel-store state is global. Set the needed unpack state immediately around uploads
and restore or establish it at subsystem boundaries. Generate mipmaps only for a
complete, supported texture configuration. Gate compressed formats by extensions.

## Framebuffer construction

Bind the intended framebuffer, allocate and attach color/depth/stencil textures or
renderbuffers with matching dimensions/sample counts, set draw buffers for MRT, then
require `checkFramebufferStatus(...) === FRAMEBUFFER_COMPLETE`. Recheck after resize
or any attachment change.

Use renderbuffers for attachment storage that does not need sampling. Use textures for
render-to-texture. WebGL 2 multisampled renderbuffers usually require a resolve step
to a sampleable texture. Ping-pong effects must never sample from a texture while it
is attached for conflicting writes in the same operation.

Set viewport/scissor for attachment dimensions and restore/default them for the next
target. Delete retired attachments and framebuffer/renderbuffer objects. A complete
framebuffer can still produce wrong pixels due to draw buffers, masks, state, shader,
sampling, or color-space errors.
