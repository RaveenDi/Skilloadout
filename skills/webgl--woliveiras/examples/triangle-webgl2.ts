export {};

function shader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const value = gl.createShader(type); if (!value) throw new Error("createShader failed");
  gl.shaderSource(value, source); gl.compileShader(value);
  if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(value) ?? "Unknown shader error"; gl.deleteShader(value); throw new Error(log); }
  return value;
}

function program(gl: WebGL2RenderingContext, vertex: string, fragment: string): WebGLProgram {
  const vs = shader(gl, gl.VERTEX_SHADER, vertex); const fs = shader(gl, gl.FRAGMENT_SHADER, fragment);
  const value = gl.createProgram(); if (!value) { gl.deleteShader(vs); gl.deleteShader(fs); throw new Error("createProgram failed"); }
  gl.attachShader(value, vs); gl.attachShader(value, fs); gl.linkProgram(value);
  gl.deleteShader(vs); gl.deleteShader(fs);
  if (!gl.getProgramParameter(value, gl.LINK_STATUS)) { const log = gl.getProgramInfoLog(value) ?? "Unknown link error"; gl.deleteProgram(value); throw new Error(log); }
  return value;
}

const canvas = document.body.appendChild(document.createElement("canvas")); canvas.width = 640; canvas.height = 360;
const gl = canvas.getContext("webgl2");
if (!gl) throw new Error("WebGL 2 is unavailable.");
const pipeline = program(gl, `#version 300 es
const vec2 p[3]=vec2[3](vec2(0.,.7),vec2(-.7,-.7),vec2(.7,-.7));
void main(){gl_Position=vec4(p[gl_VertexID],0.,1.);}`, `#version 300 es
precision highp float; out vec4 color; void main(){color=vec4(.1,.65,.95,1.);}`);
const vao = gl.createVertexArray(); if (!vao) throw new Error("createVertexArray failed");
gl.bindVertexArray(vao); gl.useProgram(pipeline); gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
gl.clearColor(.02,.03,.05,1); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
gl.bindVertexArray(null); gl.useProgram(null); gl.deleteVertexArray(vao); gl.deleteProgram(pipeline);
