"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import { COLORS } from "@/theme/colors";
import {
  getCroppedImageFile,
  type CroppedAreaPixels,
} from "@/components/arn-euins/profilePhotoCrop";

type ProfilePhotoCropModalProps = {
  imageSrc: string;
  fileName: string;
  mimeType: string;
  isApplying?: boolean;
  onCancel: () => void;
  onApply: (file: File) => void | Promise<void>;
};

const ASPECT = 7 / 8;

export default function ProfilePhotoCropModal({
  imageSrc,
  fileName,
  mimeType,
  isApplying = false,
  onCancel,
  onApply,
}: ProfilePhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedAreaPixels | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels({
      x: pixels.x,
      y: pixels.y,
      width: pixels.width,
      height: pixels.height,
    });
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels || isApplying) return;
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
      setError(err instanceof Error ? err.message : "Could not crop image");
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`tone-${COLORS.currentBrand} fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm`}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--arn-bdr)] px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[var(--arn-txt)]">
              Crop profile photo
            </h2>
            <p className="mt-0.5 text-xs text-[var(--arn-txt-2)]">
              Adjust to a 7:8 ratio (420 × 480), then apply.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isApplying}
            className="rounded-[8px] p-1 text-[var(--arn-txt-3)] transition-colors hover:bg-[var(--arn-bg-2)] hover:text-[var(--arn-txt)] disabled:opacity-50"
            aria-label="Close"
          >
            <i aria-hidden="true" className="ti ti-x text-lg" />
          </button>
        </div>

        <div className="relative h-[360px] w-full bg-[var(--arn-bg-3)]">
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
        </div>

        <div className="space-y-4 px-5 py-4">
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
              disabled={isApplying}
              className="w-full accent-[var(--arn-amber)]"
            />
          </div>

          {error ? (
            <p className="text-xs text-[var(--arn-red)]">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isApplying}
              className="rounded-[10px] border border-[var(--arn-bdr)] px-4 py-2 text-sm font-semibold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleApply()}
              disabled={isApplying || !croppedAreaPixels}
              className="rounded-[10px] bg-[var(--arn-amber)] px-4 py-2 text-sm font-bold text-[var(--arn-white)] transition-colors hover:bg-[var(--arn-amber-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApplying ? "Uploading..." : "Apply & Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
