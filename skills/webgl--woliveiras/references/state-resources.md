# State machine and resources

## Pass boundary state

At every subsystem/pass boundary, establish or restore:

- current program and vertex array object;
- `ARRAY_BUFFER`; note `ELEMENT_ARRAY_BUFFER` is VAO state in WebGL 2;
- draw/read framebuffer and renderbuffer as relevant;
- active texture unit, texture bindings, and WebGL 2 sampler-object binding for every
  used unit;
- viewport and scissor rectangle/test;
- blend enable, equations, functions, and blend color;
- depth enable, function, range, and mask;
- stencil enable, functions, operations, masks, front/back state;
- cull enable, face, front-face winding;
- color mask and pixel-store pack/unpack state.

Do not rely on setup code having run once when another renderer can mutate state.

## Buffers, attributes, and VAOs

Allocate buffer storage with a target and usage hint that describes update behavior;
the hint is not an ownership guarantee. Use `bufferSubData` for bounded updates when
reallocation is unnecessary. Validate byte size, stride, offset, component type,
normalization, divisor, and shader attribute location.

Use a VAO per stable vertex-input configuration in WebGL 2. Record element-array
binding in the VAO. For instancing, call `vertexAttribDivisor` and draw with
`drawArraysInstanced`/`drawElementsInstanced`; reset or isolate divisors through VAOs.
In WebGL 1, require the relevant extensions and use their suffixed APIs.

Index type must match the index buffer and draw call. WebGL 1 32-bit indices require
the appropriate extension; feature-detect it.

## Lifetime

Track owner, creation descriptor, dependencies, and delete path for buffers, VAOs,
textures, samplers, shaders, programs, framebuffers, renderbuffers, queries, and syncs.
Delete partial objects on failure and owned objects when retired. Garbage collection
of JavaScript wrappers is not a resource-lifecycle strategy.
