/// <reference types="@webgpu/types" />
export {};

async function main(): Promise<void> {
  if (!navigator.gpu) throw new Error("WebGPU unavailable.");
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("No adapter.");
  const device = await adapter.requestDevice();
  const a = new Float32Array([1, 2, 3, 4]);
  const b = new Float32Array([10, 20, 30, 40]);
  const byteLength = a.byteLength;
  const makeStorage = (data: Float32Array<ArrayBuffer>): GPUBuffer => {
    const buffer = device.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(buffer, 0, data);
    return buffer;
  };
  const aBuffer = makeStorage(a); const bBuffer = makeStorage(b);
  const output = device.createBuffer({ size: byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
  const readback = device.createBuffer({ size: byteLength, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
  const module = device.createShaderModule({ code: `
    @group(0) @binding(0) var<storage, read> a: array<f32>;
    @group(0) @binding(1) var<storage, read> b: array<f32>;
    @group(0) @binding(2) var<storage, read_write> out: array<f32>;
    @compute @workgroup_size(64) fn add(@builtin(global_invocation_id) id: vec3u) {
      if (id.x < arrayLength(&out)) { out[id.x] = a[id.x] + b[id.x]; }
    }` });
  const info = await module.getCompilationInfo();
  if (info.messages.some((m) => m.type === "error")) throw new Error(info.messages.map((m) => m.message).join("\n"));
  const pipeline = device.createComputePipeline({ layout: "auto", compute: { module, entryPoint: "add" } });
  const group = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [
    { binding: 0, resource: { buffer: aBuffer } }, { binding: 1, resource: { buffer: bBuffer } }, { binding: 2, resource: { buffer: output } },
  ] });
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass(); pass.setPipeline(pipeline); pass.setBindGroup(0, group); pass.dispatchWorkgroups(1); pass.end();
  encoder.copyBufferToBuffer(output, 0, readback, 0, byteLength); device.queue.submit([encoder.finish()]);
  await readback.mapAsync(GPUMapMode.READ); console.log([...new Float32Array(readback.getMappedRange().slice(0))]); readback.unmap();
  for (const buffer of [aBuffer, bBuffer, output, readback]) buffer.destroy(); device.destroy();
}
void main().catch(console.error);
