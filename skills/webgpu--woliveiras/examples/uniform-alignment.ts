/// <reference types="@webgpu/types" />
export {};

async function main(): Promise<void> {
  if (!navigator.gpu) throw new Error("WebGPU unavailable.");
  const adapter = await navigator.gpu.requestAdapter(); if (!adapter) throw new Error("No adapter.");
  const device = await adapter.requestDevice();
  // WGSL struct: scale:f32 at 0, 12 bytes padding, color:vec4f at 16; total 32 bytes.
  const bytes = new ArrayBuffer(32);
  new DataView(bytes).setFloat32(0, 0.75, true);
  new Float32Array(bytes, 16, 4).set([0.2, 0.8, 0.4, 1]);
  const uniform = device.createBuffer({ size: bytes.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(uniform, 0, bytes);
  const module = device.createShaderModule({ code: `
    struct Params { scale: f32, _pad0: f32, _pad1: f32, _pad2: f32, color: vec4f }
    @group(0) @binding(0) var<uniform> params: Params;
    @vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f {
      let p=array(vec2f(0,.8),vec2f(-.8,-.8),vec2f(.8,-.8)); return vec4f(p[i]*params.scale,0,1);
    }
    @fragment fn fs()->@location(0) vec4f { return params.color; }` });
  const info = await module.getCompilationInfo();
  if (info.messages.some((m) => m.type === "error")) throw new Error(info.messages.map((m) => m.message).join("\n"));
  // Creation validates the host/shader binding contract without claiming a rendered frame.
  const layout = device.createBindGroupLayout({ entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform", minBindingSize: 32 } }] });
  device.createBindGroup({ layout, entries: [{ binding: 0, resource: { buffer: uniform, size: 32 } }] });
  uniform.destroy(); device.destroy();
}
void main().catch(console.error);
