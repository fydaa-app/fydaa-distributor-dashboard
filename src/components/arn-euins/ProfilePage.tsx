"use client";

import { useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import ProfilePhotoCropModal from "@/components/arn-euins/ProfilePhotoCropModal";
import WebsiteProfileForm from "@/components/arn-euins/WebsiteProfileForm";
import { useProfilePhoto } from "@/context/ProfilePhotoContext";
import { uploadPartnerProfilePhoto } from "@/services/arnProfileService";

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const maxImageBytes = 15 * 1024 * 1024;

function ProfilePhotoPlaceholder() {
  return (
    <div className="flex h-[120px] w-[105px] shrink-0 items-center justify-center rounded-[12px] border-2 border-dashed border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] text-[var(--arn-txt-3)]">
      <i aria-hidden="true" className="ti ti-user text-3xl" />
    </div>
  );
}

function ProfilePhotoImage({ url }: { url: string }) {
  return (
    <img
      src={url}
      alt="Profile"
      className="h-[120px] w-[105px] shrink-0 rounded-[12px] border-2 border-[var(--arn-bdr)] object-cover"
    />
  );
}

export default function ProfilePage() {
  const { photoUrl, refreshProfilePhoto, isLoading } = useProfilePhoto();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFileMeta, setPendingFileMeta] = useState<{
    name: string;
    type: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const hasPhoto = Boolean(photoUrl);

  const clearCropState = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFileMeta(null);
  };

  const handleFileSelect = (file: File) => {
    setError(null);

    if (!allowedImageTypes.includes(file.type)) {
      setError("Supported formats: JPEG, PNG, JPG, GIF");
      return;
    }

    if (file.size > maxImageBytes) {
      setError("Image must be 15MB or smaller");
      return;
    }

    if (cropSrc) URL.revokeObjectURL(cropSrc);
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setPendingFileMeta({ name: file.name, type: file.type });
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

  const handleCropApply = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      await uploadPartnerProfilePhoto(file);
      clearCropState();
      refreshProfilePhoto();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ComponentCard title="Profile">
        <div className="flex flex-col items-center gap-4">
          {photoUrl ? (
            <ProfilePhotoImage url={photoUrl} />
          ) : (
            <ProfilePhotoPlaceholder />
          )}

          {isUploading || isLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--arn-txt-2)]">
              <i
                aria-hidden="true"
                className="ti ti-loader animate-spin text-[var(--arn-amber)]"
              />
              {isUploading ? "Uploading..." : "Loading..."}
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

          <p className="text-center text-xs text-[var(--arn-txt-3)]">
            Required ratio 7:8 (420 × 480). Max size 15MB.
          </p>

          {!hasPhoto && (
            <p className="text-center text-sm font-medium text-[var(--arn-txt)]">
              Upload your photo to start building your website.
            </p>
          )}

          {error && (
            <p className="text-xs text-[var(--arn-red)]">{error}</p>
          )}
        </div>
      </ComponentCard>

      {hasPhoto && <WebsiteProfileForm hasPhoto={hasPhoto} />}

      {cropSrc && pendingFileMeta ? (
        <ProfilePhotoCropModal
          imageSrc={cropSrc}
          fileName={pendingFileMeta.name}
          mimeType={pendingFileMeta.type}
          isApplying={isUploading}
          onCancel={clearCropState}
          onApply={handleCropApply}
        />
      ) : null}
    </div>
  );
}
