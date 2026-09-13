/// <reference types="@webgpu/types" />
export {};

async function main(): Promise<void> {
  if (!navigator.gpu) throw new Error("WebGPU unavailable.");
  const adapter = await navigator.gpu.requestAdapter(); if (!adapter) throw new Error("No adapter.");
  const device = await adapter.requestDevice();
  const canvas = document.body.appendChild(document.createElement("canvas")); canvas.width = 512; canvas.height = 512;
  const context = canvas.getContext("webgpu"); if (!context) throw new Error("No context.");
  const format = navigator.gpu.getPreferredCanvasFormat(); context.configure({ device, format, alphaMode: "opaque" });
  const target = device.createTexture({ size: [256, 256], format: "rgba8unorm", usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING });
  const first = device.createShaderModule({ code: `
    @vertex fn vs(@builtin(vertex_index)i:u32)->@builtin(position)vec4f { let p=array(vec2f(0,.8),vec2f(-.8,-.8),vec2f(.8,-.8)); return vec4f(p[i],0,1); }
    @fragment fn fs()->@location(0)vec4f{return vec4f(1,.2,.5,1);}` });
  const second = device.createShaderModule({ code: `
    struct O{@builtin(position)p:vec4f,@location(0)uv:vec2f}
    @vertex fn vs(@builtin(vertex_index)i:u32)->O{let p=array(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));var o:O;o.p=vec4f(p[i],0,1);o.uv=p[i]*vec2f(.5,-.5)+.5;return o;}
    @group(0)@binding(0)var s:sampler; @group(0)@binding(1)var t:texture_2d<f32>;
    @fragment fn fs(o:O)->@location(0)vec4f{return textureSample(t,s,o.uv);}` });
  for (const module of [first, second]) { const info = await module.getCompilationInfo(); if (info.messages.some((m) => m.type === "error")) throw new Error(info.messages.map((m) => m.message).join("\n")); }
  const p1 = device.createRenderPipeline({ layout: "auto", vertex: { module: first, entryPoint: "vs" }, fragment: { module: first, entryPoint: "fs", targets: [{ format: "rgba8unorm" }] } });
  const p2 = device.createRenderPipeline({ layout: "auto", vertex: { module: second, entryPoint: "vs" }, fragment: { module: second, entryPoint: "fs", targets: [{ format }] } });
  const group = device.createBindGroup({ layout: p2.getBindGroupLayout(0), entries: [{ binding: 0, resource: device.createSampler({ minFilter: "linear", magFilter: "linear" }) }, { binding: 1, resource: target.createView() }] });
  const encoder = device.createCommandEncoder();
  const a = encoder.beginRenderPass({ colorAttachments: [{ view: target.createView(), loadOp: "clear", storeOp: "store", clearValue: [0.05,0.05,0.1,1] }] }); a.setPipeline(p1); a.draw(3); a.end();
  const b = encoder.beginRenderPass({ colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store", clearValue: [0,0,0,1] }] }); b.setPipeline(p2); b.setBindGroup(0, group); b.draw(3); b.end();
  device.queue.submit([encoder.finish()]); await device.queue.onSubmittedWorkDone(); target.destroy(); device.destroy();
}
void main().catch(console.error);
