/// <reference types="@webgpu/types" />
export {};

async function main(): Promise<void> {
  if (!navigator.gpu) throw new Error("WebGPU is unavailable in this secure context.");
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("No WebGPU adapter is available.");
  const device = await adapter.requestDevice();
  device.addEventListener("uncapturederror", (event) => console.error(event.error));

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  document.body.append(canvas);
  const context = canvas.getContext("webgpu");
  if (!context) throw new Error("GPUCanvasContext creation failed.");
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: "opaque" });

  const module = device.createShaderModule({
    label: "triangle shader",
    code: `
      @vertex fn vertex(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
        let p = array(vec2f(0.0, 0.7), vec2f(-0.7, -0.7), vec2f(0.7, -0.7));
        return vec4f(p[index], 0.0, 1.0);
      }
      @fragment fn fragment() -> @location(0) vec4f {
        return vec4f(0.12, 0.65, 0.95, 1.0);
      }`,
  });
  const messages = await module.getCompilationInfo();
  if (messages.messages.some((message) => message.type === "error")) {
    throw new Error(messages.messages.map((message) => message.message).join("\n"));
  }
  const pipeline = device.createRenderPipeline({
    label: "triangle pipeline",
    layout: "auto",
    vertex: { module, entryPoint: "vertex" },
    fragment: { module, entryPoint: "fragment", targets: [{ format }] },
    primitive: { topology: "triangle-list" },
  });
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store", clearValue: { r: 0.02, g: 0.03, b: 0.05, a: 1 } }],
  });
  pass.setPipeline(pipeline);
  pass.draw(3);
  pass.end();
  device.queue.submit([encoder.finish()]);

  await device.queue.onSubmittedWorkDone();
  device.destroy();
}

void main().catch((error: unknown) => console.error(error));
