export type CroppedAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = src;
  });
}

/**
 * Export the selected crop at its natural pixel resolution (no forced 420x480 resize).
 */
export async function getCroppedImageFile(
  imageSrc: string,
  crop: CroppedAreaPixels,
  fileName: string,
  mimeType: string,
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const width = Math.max(1, Math.round(crop.width));
  const height = Math.max(1, Math.round(crop.height));

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not crop image");
  }

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    width,
    height,
  );

  const outputType =
    mimeType === "image/png" || mimeType === "image/gif"
      ? mimeType
      : "image/jpeg";

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Could not crop image"));
          return;
        }
        resolve(result);
      },
      outputType,
      outputType === "image/jpeg" ? 0.92 : undefined,
    );
  });

  const baseName = fileName.replace(/\.[^.]+$/, "") || "profile-photo";
  const extension =
    outputType === "image/png" ? "png" : outputType === "image/gif" ? "gif" : "jpg";

  return new File([blob], `${baseName}-cropped.${extension}`, {
    type: outputType,
    lastModified: Date.now(),
  });
}
