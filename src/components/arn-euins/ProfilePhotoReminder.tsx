"use client";

import { useRouter } from "next/navigation";
import { useProfilePhoto } from "@/context/ProfilePhotoContext";
import { cn } from "@/lib/utils";

export default function ProfilePhotoReminder() {
  const router = useRouter();
  const {
    hasActiveRm,
    photoUrl,
    isLoading,
    reminderDismissed,
    dismissReminder,
  } = useProfilePhoto();

  if (isLoading) return null;
  if (reminderDismissed) return null;
  if (!hasActiveRm) return null;
  if (photoUrl) return null;

  const handleUpload = () => {
    router.push("/profile");
  };

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-30 flex items-center justify-between gap-3",
        "border-b border-[var(--arn-bdr)] bg-[var(--arn-amber-bg)] px-4 py-2 sm:px-6",
        "lg:left-[220px]",
      )}
      style={{ top: "72px" }}
    >
      <span className="flex items-center gap-2 text-xs font-semibold text-[var(--arn-amber-txt)] sm:text-sm">
        <i aria-hidden="true" className="ti ti-alert-circle" />
        Complete your profile
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUpload}
          className="rounded-[8px] bg-[var(--arn-amber)] px-3 py-1.5 text-[10px] font-bold text-[var(--arn-white)] transition-colors hover:bg-[var(--arn-amber-hover)] sm:text-xs"
        >
          Upload
        </button>
        <button
          type="button"
          onClick={dismissReminder}
          aria-label="Dismiss reminder"
          className="grid size-6 place-items-center rounded-[6px] text-[var(--arn-amber-txt)] transition-colors hover:bg-[var(--arn-amber-bg)]/50"
        >
          <i aria-hidden="true" className="ti ti-x text-sm" />
        </button>
      </div>
    </div>
  );
}
