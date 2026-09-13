export {};

interface Resources { buffer:WebGLBuffer; dispose():void }
const canvas=document.body.appendChild(document.createElement("canvas"));let gl=canvas.getContext("webgl2");if(!gl)throw new Error("WebGL 2 unavailable");let running=true;let resources:Resources|undefined;

function createResources(context:WebGL2RenderingContext):Resources{const buffer=context.createBuffer();if(!buffer)throw new Error("buffer allocation failed");context.bindBuffer(context.ARRAY_BUFFER,buffer);context.bufferData(context.ARRAY_BUFFER,new Float32Array([0,.5,-.5,-.5,.5,-.5]),context.STATIC_DRAW);context.bindBuffer(context.ARRAY_BUFFER,null);return{buffer,dispose(){context.deleteBuffer(buffer);}};}
function frame():void{if(!running||!gl)return;gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);requestAnimationFrame(frame);}
resources=createResources(gl);requestAnimationFrame(frame);
canvas.addEventListener("webglcontextlost",(event)=>{event.preventDefault();running=false;resources=undefined;document.body.dataset.graphics="lost";});
canvas.addEventListener("webglcontextrestored",()=>{const restored=canvas.getContext("webgl2");if(!restored){document.body.dataset.graphics="failed";return;}gl=restored;try{resources=createResources(restored);running=true;delete document.body.dataset.graphics;requestAnimationFrame(frame);}catch(error){console.error("Restore failed",error);document.body.dataset.graphics="failed";}});
window.addEventListener("pagehide",()=>{running=false;resources?.dispose();resources=undefined;},{once:true});
