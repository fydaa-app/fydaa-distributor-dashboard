import type {
  BgRemovalWorkerRequest,
  BgRemovalWorkerResponse,
} from "@/components/arn-euins/removeProfilePhotoBackground.types";

const MAX_EDGE_PX = 1024;

/**
 * Downscale large crops before inference so processing finishes faster.
 */
async function downscaleForRemoval(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= MAX_EDGE_PX) {
      return file;
    }

    const scale = MAX_EDGE_PX / longest;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    let blob: Blob;

    if (typeof OffscreenCanvas !== "undefined") {
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, width, height);
      blob = await canvas.convertToBlob({ type: "image/png" });
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, width, height);
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) =>
            result
              ? resolve(result)
              : reject(new Error("Could not prepare image")),
          "image/png",
        );
      });
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "profile-photo";
    return new File([blob], `${baseName}.png`, {
      type: "image/png",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/**
 * Runs client-side background removal off the main thread (Web Worker) and
 * returns a transparent PNG File for the existing profile-photo upload API.
 */
export async function removeProfilePhotoBackground(
  croppedFile: File,
  onProgress?: (percent: number, key: string) => void,
): Promise<File> {
  // Let React paint the loading meter before heavy work begins.
  await yieldToUi();

  const prepared = await downscaleForRemoval(croppedFile);
  onProgress?.(5, "prepare");

  const worker = new Worker(
    new URL(
      "./removeProfilePhotoBackground.worker.ts",
      import.meta.url,
    ),
  );

  try {
    const buffer = await prepared.arrayBuffer();

    const result = await new Promise<File>((resolve, reject) => {
      const handleMessage = (event: MessageEvent<BgRemovalWorkerResponse>) => {
        const message = event.data;
        if (!message) return;

        if (message.type === "progress") {
          onProgress?.(message.percent, message.key);
          return;
        }

        if (message.type === "done") {
          resolve(
            new File([message.buffer], message.fileName, {
              type: message.mimeType,
              lastModified: Date.now(),
            }),
          );
          return;
        }

        if (message.type === "error") {
          reject(new Error(message.message || "Background removal failed"));
        }
      };

      const handleError = (event: ErrorEvent) => {
        reject(
          new Error(
            event.message || "Background removal worker failed to start",
          ),
        );
      };

      worker.addEventListener("message", handleMessage);
      worker.addEventListener("error", handleError);

      const request: BgRemovalWorkerRequest = {
        type: "remove",
        buffer,
        mimeType: prepared.type || "image/png",
        fileName: prepared.name,
      };
      worker.postMessage(request, [buffer]);
    });

    onProgress?.(100, "done");
    return result;
  } finally {
    worker.terminate();
  }
}
