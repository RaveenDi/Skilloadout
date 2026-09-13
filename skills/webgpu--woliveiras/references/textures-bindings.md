# Textures, samplers, and bindings

## Texture descriptors

Choose dimension, extent, format, mip count, sample count, and usage from actual
operations. A view selects format/aspect/dimension/mip/layer ranges; validate that the
view matches the shader binding and attachment. Keep sRGB formats at the color-data
boundary and avoid applying transfer functions to normal, mask, depth, or numeric
data.

Uploads may use `queue.writeTexture`, buffer-to-texture copies, or external-image copy
APIs. Verify row layout, origin/extent, source color/alpha semantics, and CORS/decode
behavior for external images. Generate or load complete mip chains before selecting a
mip filter that expects them.

Recreate size-dependent render, depth/stencil, MSAA, and storage textures on resize.
Destroy old application-owned textures after their last use and replace all views and
bind groups that reference them.

## Binding contract

Treat shader declarations as an interface:

- `@group(n) @binding(m)` must be unique for the entry-point interface;
- the bind-group layout entry must match buffer binding type, sampler type, texture
  sample type/view dimension/multisampling, or storage texture access/format;
- visibility must include every shader stage using the binding;
- the resource must have compatible creation usage;
- dynamic offsets must meet device alignment and stay within the bound range.

`layout: "auto"` is convenient for a pipeline-local prototype. Bind groups created
from an auto layout should not be assumed compatible with other pipelines. Prefer
explicit layouts for shared interfaces, stable caches, and cross-pipeline reuse.

Cache immutable samplers, layouts, and bind groups. Rebuild a bind group when an
underlying resource/view changes; mutating a buffer's contents does not require a new
bind group when the binding range remains valid.
