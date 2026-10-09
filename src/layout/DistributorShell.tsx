"use client";

import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ImpersonationBanner from "@/components/auth/ImpersonationBanner";
import ProfilePhotoReminder from "@/components/arn-euins/ProfilePhotoReminder";
import { useAuth } from "@/context/AuthContext";
import { ProfilePhotoProvider, useProfilePhoto } from "@/context/ProfilePhotoContext";
import { isPathHidden, isReminderHidden, publicPaths } from "@/config/routes";
import { COLORS } from "@/theme/colors";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";

const REMINDER_HEIGHT = 64;
const IMPERSONATION_HEIGHT = 40;
const HEADER_HEIGHT = 72;

function AuthenticatedShell({
  children,
  pathname,
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  const { isImpersonating } = useAuth();
  const { hasActiveRm, photoUrl, isLoading } = useProfilePhoto();

  const showReminder =
    !isLoading && hasActiveRm && !photoUrl && !isReminderHidden(pathname);

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
  const isPublicPath = isPathHidden(pathname, publicPaths);

  if (isPublicPath) {
    return (
      <div className={`tone-${COLORS.currentBrand} min-h-screen`}>
        {children}
      </div>
    );
  }

  return (
    <ProfilePhotoProvider>
      <AuthenticatedShell pathname={pathname}>{children}</AuthenticatedShell>
    </ProfilePhotoProvider>
  );
}
