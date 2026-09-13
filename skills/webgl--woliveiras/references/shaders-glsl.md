# Shaders, programs, and GLSL ES

## Required compile/link workflow

1. Create shader, set complete source, compile, check `COMPILE_STATUS`, and capture
   `getShaderInfoLog()` on failure. Include stage and numbered source in diagnostics.
2. Create program, attach successfully compiled shaders, bind attribute locations
   before link if the design requires stable locations, link, check `LINK_STATUS`, and
   capture `getProgramInfoLog()` on failure.
3. Cache attribute and uniform locations after a successful link. A missing uniform
   can be optimized out; decide whether it is required rather than blindly failing.
4. Delete/detach shader handles when no longer needed and delete the program on any
   failed construction path.

Program validation depends on current state and is not a replacement for link checks;
use it only at an appropriate debug point.

## GLSL ES versions

WebGL 2 shaders normally declare `#version 300 es` as the first directive. Use `in`/
`out`, explicit fragment outputs, WebGL 2 texture functions, and GLSL ES 3.00 types.
WebGL 1 uses GLSL ES 1.00 conventions such as `attribute`, `varying`, and
`gl_FragColor`, subject to its specification. Do not concatenate one token rewrite and
call it a portable shader.

Specify fragment float precision where required. Verify precision support for the
target and algorithm; do not assume `highp` behavior without query/support evidence.
Keep vertex outputs and fragment inputs type/location-compatible.

## Uniforms and locations

Use the setter that matches the active uniform type and dimensions. Cache locations;
do not query them every draw. WebGL 2 uniform blocks require block index/binding and
std140-compatible CPU packing. Validate matrix transpose argument requirements and
array counts from the WebGL specification.

Treat logs as diagnostics even when compilation/link succeeds because implementations
may emit warnings. Never suppress logs merely to make an example concise.
