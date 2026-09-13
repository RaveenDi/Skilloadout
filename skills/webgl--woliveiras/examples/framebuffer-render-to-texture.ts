export {};

const canvas=document.body.appendChild(document.createElement("canvas"));const gl=canvas.getContext("webgl2");if(!gl)throw new Error("WebGL 2 unavailable");
const texture=gl.createTexture(),framebuffer=gl.createFramebuffer();if(!texture||!framebuffer)throw new Error("Framebuffer resources unavailable");
gl.bindTexture(gl.TEXTURE_2D,texture);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,256,256);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
const status=gl.checkFramebufferStatus(gl.FRAMEBUFFER);if(status!==gl.FRAMEBUFFER_COMPLETE){gl.deleteFramebuffer(framebuffer);gl.deleteTexture(texture);throw new Error(`Incomplete framebuffer: 0x${status.toString(16)}`);}
gl.viewport(0,0,256,256);gl.clearColor(.8,.2,.5,1);gl.clear(gl.COLOR_BUFFER_BIT);
// A second pass can sample `texture`; it must bind another framebuffer, program, and VAO explicitly.
gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);gl.bindTexture(gl.TEXTURE_2D,null);gl.deleteFramebuffer(framebuffer);gl.deleteTexture(texture);
