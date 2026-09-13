# Errors and deterministic debugging

## Classify first

- JavaScript exception/rejection: host control flow or rejected async API.
- Adapter absence: capability/policy/hardware/environment path, not a shader bug.
- Validation error: invalid API usage; capture with scopes or uncaptured handler.
- Shader diagnostic: WGSL parsing, validation, or warning from compilation info.
- Pipeline failure: interface/state incompatibility or asynchronous creation rejection.
- Out-of-memory/internal error: resource pressure or implementation failure; reduce and
  preserve diagnostics rather than retrying in a loop.
- Device loss: terminal for all resources from that device; inspect `reason`/message
  available from current API and execute recovery policy.

## Isolation procedure

1. Record browser, OS, adapter-relevant environment, page security/origin, and exact
   first diagnostic. Verify the issue on a supported target.
2. Turn on the uncaptured error listener and device-loss observer before resource
   creation. Wrap one suspected phase in the narrowest matching error scope.
3. Await shader compilation info and async pipeline creation. Keep labeled objects so
   diagnostics identify resources.
4. Compare shader bindings with layouts, usages, ranges, formats, sample counts,
   attachment state, and CPU byte layout.
5. Replace data with a known constant, remove passes backward from final output, and
   reduce draw/dispatch counts without changing multiple variables at once.
6. For wrong pixels with no validation error, inspect coordinate transforms, viewport,
   winding/culling, depth, blending, color-space conversion, alpha, load/store ops,
   texture sampling, and uninitialized values.
7. Convert the minimal reproducer into a regression at the nearest layer.

Browser developer tools, Dawn/wgpu diagnostics, and the CTS can help distinguish
application bugs from implementation behavior, but verify tool/API status before
documenting a workflow. Never treat a single implementation quirk as normative.
