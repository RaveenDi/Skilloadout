export {};

interface Pass { program:WebGLProgram; vao:WebGLVertexArrayObject; framebuffer:WebGLFramebuffer|null; width:number; height:number; texture:WebGLTexture; sampler:WebGLSampler|null; samplerLocation:WebGLUniformLocation; }

function drawPass(gl:WebGL2RenderingContext,pass:Pass):void{
  gl.bindFramebuffer(gl.FRAMEBUFFER,pass.framebuffer);gl.viewport(0,0,pass.width,pass.height);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.disable(gl.STENCIL_TEST);gl.disable(gl.CULL_FACE);gl.colorMask(true,true,true,true);gl.depthMask(true);
  gl.useProgram(pass.program);gl.bindVertexArray(pass.vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,pass.texture);gl.bindSampler(0,pass.sampler);gl.uniform1i(pass.samplerLocation,0);gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);gl.drawArrays(gl.TRIANGLES,0,3);
  gl.bindSampler(0,null);gl.bindTexture(gl.TEXTURE_2D,null);gl.bindVertexArray(null);gl.useProgram(null);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
}

// The owner creates validated program/VAO/texture resources and calls drawPass.
const canvas=document.createElement("canvas"),gl=canvas.getContext("webgl2");if(!gl)throw new Error("WebGL 2 unavailable");
const texture=gl.createTexture();if(!texture)throw new Error("texture allocation failed");gl.deleteTexture(texture);
void drawPass;
