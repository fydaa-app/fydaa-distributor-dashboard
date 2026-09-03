"use client";

import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { COLORS } from "@/theme/colors";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";

const publicPaths = [
  "/signin",
  "/forgotpassword",
  "/signup",
  "/reset-password",
];

export default function DistributorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
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
          <main className="pt-[72px]">{children}</main>
        </div>
      </ProtectedRoute>
    </div>
  );
}
