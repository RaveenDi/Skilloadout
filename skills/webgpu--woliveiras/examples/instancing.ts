/// <reference types="@webgpu/types" />
export {};

async function main(): Promise<void> {
  if (!navigator.gpu) throw new Error("WebGPU unavailable.");
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("No adapter.");
  const device = await adapter.requestDevice();
  const canvas = document.body.appendChild(document.createElement("canvas"));
  canvas.width = 640; canvas.height = 360;
  const context = canvas.getContext("webgpu");
  if (!context) throw new Error("No context.");
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: "opaque" });
  const module = device.createShaderModule({ code: `
    struct Out { @builtin(position) p: vec4f, @location(0) c: vec3f }
    @vertex fn vs(@builtin(vertex_index) v: u32, @builtin(instance_index) n: u32) -> Out {
      let tri = array(vec2f(0,.08),vec2f(-.06,-.06),vec2f(.06,-.06));
      let x = f32(n % 10u) * .18 - .81; let y = f32(n / 10u) * .18 - .81;
      var o: Out; o.p = vec4f(tri[v] + vec2f(x,y),0,1); o.c = vec3f(f32(n%3u)/2.0,.7,1.0); return o;
    }
    @fragment fn fs(i: Out) -> @location(0) vec4f { return vec4f(i.c,1); }` });
  const info = await module.getCompilationInfo();
  if (info.messages.some((m) => m.type === "error")) throw new Error(info.messages.map((m) => m.message).join("\n"));
  const pipeline = device.createRenderPipeline({ layout: "auto", vertex: { module, entryPoint: "vs" }, fragment: { module, entryPoint: "fs", targets: [{ format }] } });
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({ colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store", clearValue: [0.02,0.02,0.03,1] }] });
  pass.setPipeline(pipeline); pass.draw(3, 100); pass.end(); device.queue.submit([encoder.finish()]);
  await device.queue.onSubmittedWorkDone(); device.destroy();
}
void main().catch(console.error);
