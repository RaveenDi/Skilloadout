/// <reference types="@webgpu/types" />
export {};

interface Session { device: GPUDevice; dispose(): void }

async function createSession(onLost: (message: string) => void): Promise<Session> {
  if (!navigator.gpu) throw new Error("WebGPU unavailable.");
  const adapter = await navigator.gpu.requestAdapter(); if (!adapter) throw new Error("No adapter.");
  const device = await adapter.requestDevice();
  let active = true;
  device.addEventListener("uncapturederror", (event) => console.error("WebGPU uncaptured error", event.error));
  void device.lost.then((info) => {
    if (!active) return;
    active = false;
    onLost(`${info.reason}: ${info.message}`);
    // Recreate the complete session from CPU descriptors or transition to fallback.
  });
  return { device, dispose() { active = false; device.destroy(); } };
}

void createSession((message) => {
  console.error("GPU device lost", message);
  document.body.textContent = "Graphics device unavailable; reload or use fallback.";
}).then(async (session) => {
  await session.device.queue.onSubmittedWorkDone();
  session.dispose();
}).catch(console.error);
