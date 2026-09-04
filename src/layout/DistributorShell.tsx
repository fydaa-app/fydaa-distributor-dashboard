"use client";

import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ImpersonationBanner from "@/components/auth/ImpersonationBanner";
import { useAuth } from "@/context/AuthContext";
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

export default function DistributorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isImpersonating } = useAuth();
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublicPath) {
    return <>{children}</>;
  }

  return (
    <div className={`tone-${COLORS.currentBrand}`}>
      <ProtectedRoute>
        <AppSidebar />
        <Backdrop />
        <div className="min-h-screen lg:ml-[220px]">
          <AppHeader />
          <ImpersonationBanner />
          <main className={isImpersonating ? "pt-[112px]" : "pt-[72px]"}>
            {children}
          </main>
        </div>
      </ProtectedRoute>
    </div>
  );
}
