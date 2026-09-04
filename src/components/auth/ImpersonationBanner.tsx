"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ImpersonationBanner() {
  const router = useRouter();
  const { isImpersonating, user, logout } = useAuth();

  if (!isImpersonating) return null;

  const handleExit = () => {
    logout();
    router.replace("/signin");
  };

  return (
    <div className="fixed left-0 right-0 top-[72px] z-40 flex items-center justify-between gap-3 border-b border-[var(--arn-amber)] bg-[var(--arn-amber)] px-4 py-2 text-white lg:left-[220px] sm:px-6">
      <p className="min-w-0 truncate text-xs font-semibold sm:text-sm">
        Viewing as {user?.name || "partner"} — Partner Admin preview
      </p>
      <button
        type="button"
        onClick={handleExit}
        className="shrink-0 rounded-[8px] bg-white/15 px-2.5 py-1 text-[11px] font-bold hover:bg-white/25"
      >
        Exit view
      </button>
    </div>
  );
}
