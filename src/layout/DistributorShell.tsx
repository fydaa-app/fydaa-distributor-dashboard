"use client";

import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ImpersonationBanner from "@/components/auth/ImpersonationBanner";
import ProfilePhotoReminder from "@/components/arn-euins/ProfilePhotoReminder";
import { useAuth } from "@/context/AuthContext";
import { ProfilePhotoProvider, useProfilePhoto } from "@/context/ProfilePhotoContext";
import { COLORS } from "@/theme/colors";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";

const publicPaths = [
  "/signin",
  "/forgotpassword",
  "/signup",
  "/reset-password",
  "/impersonate",
];

const REMINDER_HEIGHT = 48;
const IMPERSONATION_HEIGHT = 40;
const HEADER_HEIGHT = 72;

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { isImpersonating } = useAuth();
  const { hasActiveRm, photoUrl, isLoading, reminderDismissed } =
    useProfilePhoto();

  const showReminder =
    !isLoading &&
    hasActiveRm &&
    !photoUrl &&
    !reminderDismissed;

  const topOffset =
    HEADER_HEIGHT +
    (showReminder ? REMINDER_HEIGHT : 0) +
    (isImpersonating ? IMPERSONATION_HEIGHT : 0);

  return (
    <div className={`tone-${COLORS.currentBrand}`}>
      <ProtectedRoute>
        <AppSidebar />
        <Backdrop />
        <div className="min-h-screen lg:ml-[220px]">
          <AppHeader />
          <ProfilePhotoReminder />
          <ImpersonationBanner />
          <main style={{ paddingTop: `${topOffset}px` }}>{children}</main>
        </div>
      </ProtectedRoute>
    </div>
  );
}

export default function DistributorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isPublicPath) {
    return <>{children}</>;
  }

  return (
    <ProfilePhotoProvider>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </ProfilePhotoProvider>
  );
}
