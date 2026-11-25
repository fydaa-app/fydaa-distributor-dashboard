/// <reference lib="webworker" />

import { removeBackground } from "@imgly/background-removal";
import type {
  BgRemovalWorkerRequest,
  BgRemovalWorkerResponse,
} from "@/components/arn-euins/removeProfilePhotoBackground.types";

function toPercent(key: string, current: number, total: number): number {
  if (!total || total <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, current / total));
  if (key.startsWith("fetch:")) {
    return Math.round(ratio * 50);
  }
  if (key.startsWith("compute:")) {
    return 50 + Math.round(ratio * 50);
  }
  return Math.round(ratio * 100);
}

self.onmessage = async (event: MessageEvent<BgRemovalWorkerRequest>) => {
  const data = event.data;
  if (!data || data.type !== "remove") return;

  try {
    const inputBlob = new Blob([data.buffer], {
      type: data.mimeType || "image/png",
    });

    // Already running inside a dedicated worker — keep inference here so the
    // page UI thread stays responsive and Chrome won't show "Page is not responding".
    const pngBlob = await removeBackground(inputBlob, {
      model: "isnet_quint8",
      device: "gpu",
      proxyToWorker: false,
      output: {
        format: "image/png",
        quality: 1,
      },
      progress: (key, current, total) => {
        const percent = toPercent(key, current, total);
        const message: BgRemovalWorkerResponse = {
          type: "progress",
          key,
          current,
          total,
          percent,
        };
        self.postMessage(message);
      },
    });

    if (!(pngBlob instanceof Blob) || pngBlob.size === 0) {
      throw new Error("Background removal failed");
    }

    const resultBuffer = await pngBlob.arrayBuffer();
    const baseName =
      data.fileName.replace(/\.[^.]+$/, "").replace(/-cropped$/, "") ||
      "profile-photo";

    const done: BgRemovalWorkerResponse = {
      type: "done",
      buffer: resultBuffer,
      mimeType: "image/png",
      fileName: `${baseName}-no-bg.png`,
    };
    self.postMessage(done, [resultBuffer]);
  } catch (err) {
    const message: BgRemovalWorkerResponse = {
      type: "error",
      message:
        err instanceof Error ? err.message : "Background removal failed",
    };
    self.postMessage(message);
  }
};
