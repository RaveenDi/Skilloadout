/// <reference types="@webgpu/types" />
export {};

function observeCanvas(device: GPUDevice, canvas: HTMLCanvasElement, recreate: (width: number, height: number) => void): () => void {
  const maxDimension = device.limits.maxTextureDimension2D;
  const resize = (): void => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.min(maxDimension, Math.max(1, Math.round(canvas.clientWidth * ratio)));
    const height = Math.min(maxDimension, Math.max(1, Math.round(canvas.clientHeight * ratio)));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width; canvas.height = height;
    recreate(width, height);
  };
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
  return () => observer.disconnect();
}

async function main(): Promise<void> {
  if (!navigator.gpu) throw new Error("WebGPU unavailable.");
  const adapter = await navigator.gpu.requestAdapter(); if (!adapter) throw new Error("No adapter.");
  const device = await adapter.requestDevice();
  const canvas = document.body.appendChild(document.createElement("canvas")); canvas.style.cssText = "width:100%;height:60vh";
  const context = canvas.getContext("webgpu"); if (!context) throw new Error("No context.");
  const format = navigator.gpu.getPreferredCanvasFormat(); context.configure({ device, format, alphaMode: "opaque" });
  let depth: GPUTexture | undefined;
  const stop = observeCanvas(device, canvas, (width, height) => {
    depth?.destroy();
    depth = device.createTexture({ size: [width, height], format: "depth24plus", usage: GPUTextureUsage.RENDER_ATTACHMENT });
  });
  await device.queue.onSubmittedWorkDone(); stop(); depth?.destroy(); device.destroy();
}
void main().catch(console.error);
