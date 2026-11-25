"use client";

import { useEffect, useRef, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import ProfilePhotoCropModal, {
  type ProfilePhotoProcessingPhase,
} from "@/components/arn-euins/ProfilePhotoCropModal";
import WebsiteProfileForm from "@/components/arn-euins/WebsiteProfileForm";
import { removeProfilePhotoBackground } from "@/components/arn-euins/removeProfilePhotoBackground";
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
  const [processingPhase, setProcessingPhase] =
    useState<ProfilePhotoProcessingPhase>("idle");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState<string | null>(
    null,
  );
  const [pendingFileMeta, setPendingFileMeta] = useState<{
    name: string;
    type: string;
  } | null>(null);
  const processedFileRef = useRef<File | null>(null);
  const processedPreviewUrlRef = useRef<string | null>(null);
  const previousPhotoUrlRef = useRef(photoUrl);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  useEffect(() => {
    return () => {
      if (processedPreviewUrlRef.current) {
        URL.revokeObjectURL(processedPreviewUrlRef.current);
      }
    };
  }, []);

  // Drop the local processed preview once the server photo URL refreshes.
  useEffect(() => {
    if (
      previousPhotoUrlRef.current !== photoUrl &&
      processedPreviewUrlRef.current
    ) {
      URL.revokeObjectURL(processedPreviewUrlRef.current);
      processedPreviewUrlRef.current = null;
      setProcessedPreviewUrl(null);
    }
    previousPhotoUrlRef.current = photoUrl;
  }, [photoUrl]);

  const hasPhoto = Boolean(photoUrl);
  const displayPhotoUrl = processedPreviewUrl ?? photoUrl;
  const isBusy = processingPhase !== "idle";

  // Warn before closing/navigating away while processing so users don't leave mid-run.
  useEffect(() => {
    if (!isBusy) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isBusy]);

  // Keep the meter moving during long inference gaps between worker progress events.
  useEffect(() => {
    if (processingPhase !== "removing-bg") return;
    const id = window.setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 95) return prev;
        return Math.min(95, prev + 0.8);
      });
    }, 400);
    return () => window.clearInterval(id);
  }, [processingPhase]);

  const revokeProcessedPreview = () => {
    if (processedPreviewUrlRef.current) {
      URL.revokeObjectURL(processedPreviewUrlRef.current);
      processedPreviewUrlRef.current = null;
    }
    setProcessedPreviewUrl(null);
  };

  const clearProcessedState = () => {
    processedFileRef.current = null;
    revokeProcessedPreview();
  };

  const clearCropState = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFileMeta(null);
    clearProcessedState();
    setProcessingPhase("idle");
    setProcessingProgress(0);
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    clearProcessedState();
    setProcessingPhase("idle");
    setProcessingProgress(0);

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
    if (isBusy) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = allowedImageTypes.join(",");
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileSelect(file);
    };
    input.click();
  };

  const handleCropApply = async (croppedFile: File) => {
    if (isBusy) return;

    setError(null);
    let activePhase: ProfilePhotoProcessingPhase = "idle";

    try {
      let processed = processedFileRef.current;

      if (!processed) {
        activePhase = "removing-bg";
        setProcessingPhase(activePhase);
        setProcessingProgress(0);
        processed = await removeProfilePhotoBackground(
          croppedFile,
          (percent) => {
            setProcessingProgress((prev) => Math.max(prev, percent));
          },
        );

        if (processed.type !== "image/png") {
          throw new Error("Background removal did not produce a PNG image");
        }

        processedFileRef.current = processed;
        setProcessingProgress(100);

        if (processedPreviewUrlRef.current) {
          URL.revokeObjectURL(processedPreviewUrlRef.current);
        }
        const previewUrl = URL.createObjectURL(processed);
        processedPreviewUrlRef.current = previewUrl;
        setProcessedPreviewUrl(previewUrl);
      }

      activePhase = "uploading";
      setProcessingPhase(activePhase);
      await uploadPartnerProfilePhoto(processed);

      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      setPendingFileMeta(null);
      processedFileRef.current = null;
      setProcessingPhase("idle");
      setProcessingProgress(0);
      refreshProfilePhoto();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Image processing failed";
      const isRemovalFailure =
        activePhase === "removing-bg" || !processedFileRef.current;

      if (isRemovalFailure) {
        clearProcessedState();
        setError(
          message.toLowerCase().includes("background")
            ? `${message} You can retry.`
            : `Background removal failed. ${message} You can retry.`,
        );
      } else {
        setError(`${message} You can retry.`);
      }

      setProcessingPhase("idle");
      setProcessingProgress(0);
      throw err instanceof Error ? err : new Error(message);
    }
  };

  const statusLabel =
    processingPhase === "removing-bg"
      ? `Removing background... ${Math.round(processingProgress)}%`
      : processingPhase === "uploading"
        ? "Uploading..."
        : isLoading
          ? "Loading..."
          : null;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ComponentCard title="Profile">
        <div className="flex flex-col items-center gap-4">
          {displayPhotoUrl ? (
            <ProfilePhotoImage url={displayPhotoUrl} />
          ) : (
            <ProfilePhotoPlaceholder />
          )}

          {statusLabel ? (
            <div className="flex items-center gap-2 text-sm text-[var(--arn-txt-2)]">
              <i
                aria-hidden="true"
                className="ti ti-loader animate-spin text-[var(--arn-amber)]"
              />
              {statusLabel}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleUploadClick}
              className="rounded-[10px] bg-[var(--arn-amber)] px-5 py-2 text-sm font-bold text-[var(--arn-white)] transition-colors hover:bg-[var(--arn-amber-hover)]"
            >
              {displayPhotoUrl ? "Replace Photo" : "Upload Photo"}
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
          isApplying={isBusy}
          processingPhase={processingPhase}
          processingProgress={processingProgress}
          processedPreviewUrl={processedPreviewUrl}
          onCancel={clearCropState}
          onApply={handleCropApply}
        />
      ) : null}
    </div>
  );
}
