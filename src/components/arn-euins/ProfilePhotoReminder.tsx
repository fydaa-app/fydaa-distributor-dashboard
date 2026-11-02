"use client";

import { usePathname, useRouter } from "next/navigation";
import ArnProgressBar from "@/components/common/ArnProgressBar";
import { useProfilePhoto } from "@/context/ProfilePhotoContext";
import { isReminderHidden } from "@/config/routes";
import { cn } from "@/lib/utils";

export default function ProfilePhotoReminder() {
  const router = useRouter();
  const pathname = usePathname();
  const { photoUrl, isLoading } = useProfilePhoto();

  if (isLoading) return null;
  // Nudge partners to upload even before an RM exists (upload now auto-creates RM).
  if (photoUrl) return null;
  if (isReminderHidden(pathname)) return null;

  const handleUpload = () => {
    router.push("/profile");
  };

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-30 flex items-center justify-between gap-3",
        "border-b border-[var(--arn-bdr)] bg-[var(--arn-amber-bg)] px-4 py-2.5 sm:px-6",
        "lg:left-[220px]",
      )}
      style={{ top: "72px" }}
    >
      <div className="absolute inset-x-0 bottom-0">
        <ArnProgressBar value={100} color="var(--arn-amber)" />
      </div>
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
      </div>
    </div>
  );
}
