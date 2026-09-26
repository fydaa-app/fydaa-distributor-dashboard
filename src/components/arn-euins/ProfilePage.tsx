"use client";

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import { useProfilePhoto } from "@/context/ProfilePhotoContext";
import { uploadPartnerProfilePhoto } from "@/services/arnProfileService";

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const maxImageBytes = 5 * 1024 * 1024;

function ProfilePhotoPlaceholder() {
  return (
    <div className="flex size-24 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] text-[var(--arn-txt-3)]">
      <i aria-hidden="true" className="ti ti-user text-3xl" />
    </div>
  );
}

function ProfilePhotoImage({ url }: { url: string }) {
  return (
    <img
      src={url}
      alt="Profile"
      className="size-24 shrink-0 rounded-full border-2 border-[var(--arn-bdr)] object-cover"
    />
  );
}

export default function ProfilePage() {
  const { hasActiveRm, photoUrl, refreshProfilePhoto } = useProfilePhoto();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!hasActiveRm) {
    return (
      <div className="mx-auto w-full max-w-[1440px] p-5 sm:p-6 lg:p-8">
        <ComponentCard title="Profile">
          <p className="text-sm text-[var(--arn-txt-2)]">
            Profile photo is not available yet. Contact support to complete
            your setup.
          </p>
        </ComponentCard>
      </div>
    );
  }

  const displayUrl = preview || photoUrl;

  const handleFileSelect = async (file: File) => {
    setError(null);

    if (!allowedImageTypes.includes(file.type)) {
      setError("Supported formats: JPEG, PNG, JPG, GIF");
      return;
    }

    if (file.size > maxImageBytes) {
      setError("Image must be 5MB or smaller");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setIsUploading(true);

    try {
      await uploadPartnerProfilePhoto(file);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
      refreshProfilePhoto();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = allowedImageTypes.join(",");
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileSelect(file);
    };
    input.click();
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ComponentCard title="Profile">
        <div className="flex flex-col items-center gap-4">
          {displayUrl ? (
            <ProfilePhotoImage url={displayUrl} />
          ) : (
            <ProfilePhotoPlaceholder />
          )}

          {isUploading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--arn-txt-2)]">
              <i
                aria-hidden="true"
                className="ti ti-loader animate-spin text-[var(--arn-amber)]"
              />
              Uploading...
            </div>
          ) : (
            <button
              type="button"
              onClick={handleUploadClick}
              className="rounded-[10px] bg-[var(--arn-amber)] px-5 py-2 text-sm font-bold text-[var(--arn-white)] transition-colors hover:bg-[var(--arn-amber-hover)]"
            >
              {photoUrl ? "Replace Photo" : "Upload Photo"}
            </button>
          )}

          {error && (
            <p className="text-xs text-[var(--arn-red)]">{error}</p>
          )}
        </div>
      </ComponentCard>
    </div>
  );
}
