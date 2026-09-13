export function createProgram(gl:WebGLRenderingContext|WebGL2RenderingContext,vertexSource:string,fragmentSource:string):WebGLProgram{
  const compile=(type:number,source:string,label:string):WebGLShader=>{const shader=gl.createShader(type);if(!shader)throw new Error(`${label}: createShader failed`);gl.shaderSource(shader,source);gl.compileShader(shader);const log=gl.getShaderInfoLog(shader)?.trim();if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw new Error(`${label} compile failed${log?`:\n${log}`:""}`);}if(log)console.warn(`${label} compile log:\n${log}`);return shader;};
  const vertex=compile(gl.VERTEX_SHADER,vertexSource,"vertex shader");let fragment:WebGLShader;
  try{fragment=compile(gl.FRAGMENT_SHADER,fragmentSource,"fragment shader");}catch(error){gl.deleteShader(vertex);throw error;}
  const program=gl.createProgram();if(!program){gl.deleteShader(vertex);gl.deleteShader(fragment);throw new Error("createProgram failed");}
  gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);const log=gl.getProgramInfoLog(program)?.trim();gl.detachShader(program,vertex);gl.detachShader(program,fragment);gl.deleteShader(vertex);gl.deleteShader(fragment);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);throw new Error(`program link failed${log?`:\n${log}`:""}`);}if(log)console.warn(`program link log:\n${log}`);return program;
}

const canvas=document.createElement("canvas"),gl=canvas.getContext("webgl2");if(!gl)throw new Error("WebGL 2 unavailable");const p=createProgram(gl,"#version 300 es\nvoid main(){gl_Position=vec4(0,0,0,1);}","#version 300 es\nprecision highp float;out vec4 c;void main(){c=vec4(1);}");gl.deleteProgram(p);
