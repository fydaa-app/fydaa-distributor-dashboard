"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import { COLORS } from "@/theme/colors";
import {
  getCroppedImageFile,
  type CroppedAreaPixels,
} from "@/components/arn-euins/profilePhotoCrop";

export type ProfilePhotoProcessingPhase =
  | "idle"
  | "removing-bg"
  | "uploading";

type ProfilePhotoCropModalProps = {
  imageSrc: string;
  fileName: string;
  mimeType: string;
  isApplying?: boolean;
  processingPhase?: ProfilePhotoProcessingPhase;
  processingProgress?: number;
  processedPreviewUrl?: string | null;
  onCancel: () => void;
  onApply: (file: File) => void | Promise<void>;
};

const ASPECT = 7 / 8;

function applyButtonLabel(
  phase: ProfilePhotoProcessingPhase,
  progress: number,
): string {
  if (phase === "removing-bg") {
    return `Removing background... ${Math.max(0, Math.min(100, Math.round(progress)))}%`;
  }
  if (phase === "uploading") return "Uploading...";
  return "Apply & Upload";
}

export default function ProfilePhotoCropModal({
  imageSrc,
  fileName,
  mimeType,
  isApplying = false,
  processingPhase = "idle",
  processingProgress = 0,
  processedPreviewUrl = null,
  onCancel,
  onApply,
}: ProfilePhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedAreaPixels | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = isApplying || processingPhase !== "idle";
  const showProcessedPreview = Boolean(processedPreviewUrl);
  const clampedProgress = Math.max(0, Math.min(100, Math.round(processingProgress)));

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels({
      x: pixels.x,
      y: pixels.y,
      width: pixels.width,
      height: pixels.height,
    });
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels || busy) return;
    setError(null);
    try {
      const file = await getCroppedImageFile(
        imageSrc,
        croppedAreaPixels,
        fileName,
        mimeType,
      );
      await onApply(file);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not process image",
      );
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`tone-${COLORS.currentBrand} fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm`}
      onClick={(e) => {
        // Block accidental backdrop dismiss while processing.
        if (busy) e.stopPropagation();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--arn-bdr)] px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[var(--arn-txt)]">
              {processingPhase === "removing-bg"
                ? "Removing background"
                : showProcessedPreview
                  ? "Preview processed photo"
                  : "Crop profile photo"}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--arn-txt-2)]">
              {processingPhase === "removing-bg"
                ? "Please wait — keep this tab open until processing finishes."
                : showProcessedPreview
                  ? "Background removed. Uploading transparent PNG…"
                  : "Adjust to a 7:8 ratio (420 × 480), then apply."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-[8px] p-1 text-[var(--arn-txt-3)] transition-colors hover:bg-[var(--arn-bg-2)] hover:text-[var(--arn-txt)] disabled:opacity-50"
            aria-label="Close"
          >
            <i aria-hidden="true" className="ti ti-x text-lg" />
          </button>
        </div>

        <div className="relative h-[360px] w-full bg-[var(--arn-bg-3)]">
          {showProcessedPreview && processedPreviewUrl ? (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #d0d0d0 25%, transparent 25%), linear-gradient(-45deg, #d0d0d0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d0d0d0 75%), linear-gradient(-45deg, transparent 75%, #d0d0d0 75%)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
                backgroundColor: "#f5f5f5",
              }}
            >
              <img
                src={processedPreviewUrl}
                alt="Processed profile preview"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid
            />
          )}

          {processingPhase === "removing-bg" ||
          processingPhase === "uploading" ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/70 px-8">
              <i
                aria-hidden="true"
                className="ti ti-loader animate-spin text-3xl text-[var(--arn-amber)]"
              />
              <div className="w-full max-w-xs space-y-2 text-center">
                <p className="text-sm font-semibold text-white">
                  {processingPhase === "removing-bg"
                    ? "Removing background..."
                    : "Uploading..."}
                </p>
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full bg-white/20"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={
                    processingPhase === "removing-bg" ? clampedProgress : 100
                  }
                  aria-label={
                    processingPhase === "removing-bg"
                      ? "Background removal progress"
                      : "Upload progress"
                  }
                >
                  <div
                    className="h-full rounded-full bg-[var(--arn-amber)] transition-[width] duration-300 ease-out"
                    style={{
                      width: `${
                        processingPhase === "removing-bg"
                          ? Math.max(clampedProgress, 4)
                          : 100
                      }%`,
                    }}
                  />
                </div>
                <p className="text-xs font-medium text-white/90">
                  {processingPhase === "removing-bg"
                    ? `${clampedProgress}% complete — please don’t leave this page`
                    : "Finishing upload…"}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 px-5 py-4">
          {!showProcessedPreview && processingPhase === "idle" ? (
            <div>
              <label
                htmlFor="profile-photo-zoom"
                className="mb-1 block text-xs font-semibold text-[var(--arn-txt-2)]"
              >
                Zoom
              </label>
              <input
                id="profile-photo-zoom"
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                disabled={busy}
                className="w-full accent-[var(--arn-amber)]"
              />
            </div>
          ) : null}

          {error ? (
            <p className="text-xs text-[var(--arn-red)]">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-[10px] border border-[var(--arn-bdr)] px-4 py-2 text-sm font-semibold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleApply()}
              disabled={busy || !croppedAreaPixels}
              className="rounded-[10px] bg-[var(--arn-amber)] px-4 py-2 text-sm font-bold text-[var(--arn-white)] transition-colors hover:bg-[var(--arn-amber-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? applyButtonLabel(processingPhase, clampedProgress)
                : error
                  ? "Retry"
                  : "Apply & Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
