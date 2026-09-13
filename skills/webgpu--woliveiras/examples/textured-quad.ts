/// <reference types="@webgpu/types" />
export {};

async function main(): Promise<void> {
  if (!navigator.gpu) throw new Error("WebGPU unavailable.");
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("No adapter.");
  const device = await adapter.requestDevice();
  const canvas = document.body.appendChild(document.createElement("canvas"));
  canvas.width = 512; canvas.height = 512;
  const context = canvas.getContext("webgpu");
  if (!context) throw new Error("No WebGPU canvas context.");
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: "opaque" });

  const texture = device.createTexture({ size: [2, 2], format: "rgba8unorm-srgb", usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST });
  device.queue.writeTexture({ texture }, new Uint8Array([
    255, 40, 40, 255, 40, 255, 40, 255,
    40, 40, 255, 255, 255, 255, 40, 255,
  ]), { bytesPerRow: 8, rowsPerImage: 2 }, { width: 2, height: 2 });
  const sampler = device.createSampler({ magFilter: "nearest", minFilter: "nearest" });
  const shader = device.createShaderModule({ code: `
    struct Out { @builtin(position) position: vec4f, @location(0) uv: vec2f }
    @vertex fn vs(@builtin(vertex_index) i: u32) -> Out {
      let pos = array(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
      let uv = array(vec2f(0,1),vec2f(1,1),vec2f(0,0),vec2f(0,0),vec2f(1,1),vec2f(1,0));
      var out: Out; out.position = vec4f(pos[i],0,1); out.uv = uv[i]; return out;
    }
    @group(0) @binding(0) var s: sampler;
    @group(0) @binding(1) var t: texture_2d<f32>;
    @fragment fn fs(in: Out) -> @location(0) vec4f { return textureSample(t,s,in.uv); }` });
  const info = await shader.getCompilationInfo();
  if (info.messages.some((m) => m.type === "error")) throw new Error(info.messages.map((m) => m.message).join("\n"));
  const pipeline = device.createRenderPipeline({ layout: "auto", vertex: { module: shader, entryPoint: "vs" }, fragment: { module: shader, entryPoint: "fs", targets: [{ format }] } });
  const bindGroup = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: sampler }, { binding: 1, resource: texture.createView() }] });
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({ colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store", clearValue: [0, 0, 0, 1] }] });
  pass.setPipeline(pipeline); pass.setBindGroup(0, bindGroup); pass.draw(6); pass.end();
  device.queue.submit([encoder.finish()]);
  await device.queue.onSubmittedWorkDone(); texture.destroy(); device.destroy();
}
void main().catch(console.error);
